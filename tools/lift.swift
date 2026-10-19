// Giberish image tool — cut a subject out of a photo (transparent PNG) and upscale it.
//
//   swift tools/lift.swift <in> <out.png> [--crop x,y,w,h] [--scale 2] [--instances 1,2] [--dark thr] [--max 1400]
//
//   --crop       crop region in source pixels (top-left origin) before lifting
//   --scale      Lanczos upscale factor (followed by an unsharp mask)
//   --instances  which Vision instances to keep (default: all)
//   --dark thr   instead of Vision, keep pixels darker than `thr` (0–1) — used for the logo silhouette
//   --list       print the instances Vision found (with their bounding boxes) and exit
//   --nolift     only crop + upscale + sharpen (keeps the background)
import Foundation
import CoreImage
import CoreImage.CIFilterBuiltins
import Vision
import ImageIO
import UniformTypeIdentifiers

var args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else { print("usage: lift <in> <out.png> [options]"); exit(1) }
let inURL = URL(fileURLWithPath: args.removeFirst())
let outURL = URL(fileURLWithPath: args.removeFirst())
var crop: CGRect? = nil, scale: CGFloat = 1, keep: [Int]? = nil, dark: CGFloat? = nil, list = false, noLift = false, maxSide: CGFloat = 1600
while !args.isEmpty {
  let a = args.removeFirst()
  switch a {
  case "--crop": let v = args.removeFirst().split(separator: ",").compactMap { Double($0) }; crop = CGRect(x: v[0], y: v[1], width: v[2], height: v[3])
  case "--scale": scale = CGFloat(Double(args.removeFirst())!)
  case "--instances": keep = args.removeFirst().split(separator: ",").compactMap { Int($0) }
  case "--dark": dark = CGFloat(Double(args.removeFirst())!)
  case "--max": maxSide = CGFloat(Double(args.removeFirst())!)
  case "--list": list = true
  case "--nolift": noLift = true
  default: print("unknown option \(a)"); exit(1)
  }
}

guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil), var cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("cannot read \(inURL.path)"); exit(1) }
if let c = crop { cg = cg.cropping(to: c)! }
let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])

func upscaleSharpen(_ img: CIImage, _ s: CGFloat) -> CIImage {
  var out = img
  if s != 1 {
    let f = CIFilter.lanczosScaleTransform(); f.inputImage = img; f.scale = Float(s); f.aspectRatio = 1
    out = f.outputImage!
    let u = CIFilter.unsharpMask(); u.inputImage = out; u.radius = Float(1.6 * s); u.intensity = 0.55
    out = u.outputImage!.cropped(to: out.extent)
  }
  return out
}

var result: CIImage
if let thr = dark {
  // Silhouette: alpha = how much darker than threshold, colour = deep warm black
  let base = upscaleSharpen(CIImage(cgImage: cg), scale)
  let k = CIColorKernel(source: """
    kernel vec4 sil(__sample s, float thr) {
      float l = dot(s.rgb, vec3(0.299, 0.587, 0.114));
      float a = clamp((thr - l) / (thr * 0.55), 0.0, 1.0);
      a = a * a * (3.0 - 2.0 * a);
      return vec4(vec3(0.075, 0.043, 0.024) * a, a);
    }
    """)!
  let sil = k.apply(extent: base.extent, arguments: [base, thr])!
  // keep only the shape connected to the centre (drops dark corners / stray background)
  let w = Int(sil.extent.width), h = Int(sil.extent.height)
  var px = [UInt8](repeating: 0, count: w * h * 4)
  ctx.render(sil, toBitmap: &px, rowBytes: w * 4, bounds: sil.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  var seen = [Bool](repeating: false, count: w * h)
  var stack = [(w / 2) + (h / 2) * w]
  while let i = stack.popLast() {
    if seen[i] || px[i * 4 + 3] < 60 { continue }
    seen[i] = true
    let x = i % w, y = i / w
    if x > 0 { stack.append(i - 1) }; if x < w - 1 { stack.append(i + 1) }
    if y > 0 { stack.append(i - w) }; if y < h - 1 { stack.append(i + w) }
  }
  for i in 0..<(w * h) where !seen[i] {
    // keep the soft anti-aliased rim next to the shape
    let x = i % w, y = i / w
    var near = false
    for dy in -2...2 { for dx in -2...2 { let xx = x + dx, yy = y + dy
      if xx >= 0 && yy >= 0 && xx < w && yy < h && seen[yy * w + xx] { near = true } } }
    if !near { px[i * 4] = 0; px[i * 4 + 1] = 0; px[i * 4 + 2] = 0; px[i * 4 + 3] = 0 }
  }
  let data = Data(px)
  result = CIImage(bitmapData: data, bytesPerRow: w * 4, size: CGSize(width: w, height: h), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
} else if noLift {
  result = upscaleSharpen(CIImage(cgImage: cg), scale)
} else {
  let req = VNGenerateForegroundInstanceMaskRequest()
  let handler = VNImageRequestHandler(cgImage: cg)
  try handler.perform([req])
  guard let obs = req.results?.first else { print("no subject found"); exit(2) }
  if list {
    let mask = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
    print("instances: \(Array(obs.allInstances)) mask \(CVPixelBufferGetWidth(mask))x\(CVPixelBufferGetHeight(mask))")
    for i in obs.allInstances {
      let m = CIImage(cvPixelBuffer: try obs.generateScaledMaskForImage(forInstances: IndexSet(integer: i), from: handler))
      // coarse bounding-box scan
      var minX = Int.max, minY = Int.max, maxX = 0, maxY = 0
      let w = Int(m.extent.width), h = Int(m.extent.height), step = 4
      var buf = [UInt8](repeating: 0, count: w * h)
      ctx.render(m, toBitmap: &buf, rowBytes: w, bounds: m.extent, format: .L8, colorSpace: nil)
      for y in stride(from: 0, to: h, by: step) { for x in stride(from: 0, to: w, by: step) where buf[y * w + x] > 128 {
        minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) } }
      print("  #\(i): x \(minX)-\(maxX)  y(top) \(h - maxY)-\(h - minY)")
    }
    exit(0)
  }
  let set = keep.map { IndexSet($0) } ?? obs.allInstances
  let buf = try obs.generateMaskedImage(ofInstances: set, from: handler, croppedToInstancesExtent: true)
  result = upscaleSharpen(CIImage(cvPixelBuffer: buf), scale)
}

// cap the longest side
let longest = max(result.extent.width, result.extent.height)
if longest > maxSide {
  let f = CIFilter.lanczosScaleTransform(); f.inputImage = result; f.scale = Float(maxSide / longest); f.aspectRatio = 1
  result = f.outputImage!
}
result = result.transformed(by: CGAffineTransform(translationX: -result.extent.origin.x, y: -result.extent.origin.y))
try ctx.writePNGRepresentation(of: result, to: outURL, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("wrote \(outURL.lastPathComponent) \(Int(result.extent.width))x\(Int(result.extent.height))")
