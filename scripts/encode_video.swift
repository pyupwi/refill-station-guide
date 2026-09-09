// Native macOS encoder. Usage: encoder FRAMES_DIRECTORY OUTPUT.mp4 REVIEW_DIRECTORY
import AVFoundation
import ImageIO
import CoreVideo

let frames = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let review = URL(fileURLWithPath: CommandLine.arguments[3])
let files = try FileManager.default.contentsOfDirectory(at: frames, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension == "bmp" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
precondition(!files.isEmpty)
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: 800, AVVideoHeightKey: 480,
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1_200_000,
                                      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]])
let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input,
    sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
                                 kCVPixelBufferWidthKey as String: 800,
                                 kCVPixelBufferHeightKey as String: 480,
                                 kCVPixelBufferCGImageCompatibilityKey as String: true,
                                 kCVPixelBufferCGBitmapContextCompatibilityKey as String: true])
writer.add(input)
precondition(writer.startWriting())
writer.startSession(atSourceTime: .zero)
for (index, url) in files.enumerated() {
    while !input.isReadyForMoreMediaData {
        precondition(writer.status == .writing, "Encoder failed: \(String(describing: writer.error))")
        Thread.sleep(forTimeInterval: 0.002)
    }
    let source = CGImageSourceCreateWithURL(url as CFURL, nil)!
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)!
    precondition(image.width == 800 && image.height == 480)
    var optionalBuffer: CVPixelBuffer?
    precondition(CVPixelBufferPoolCreatePixelBuffer(nil, adapter.pixelBufferPool!, &optionalBuffer) == kCVReturnSuccess)
    let buffer = optionalBuffer!
    CVPixelBufferLockBaseAddress(buffer, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(buffer), width: 800, height: 480,
        bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    context.draw(image, in: CGRect(x: 0, y: 0, width: 800, height: 480))
    CVPixelBufferUnlockBaseAddress(buffer, [])
    precondition(adapter.append(buffer, withPresentationTime: CMTime(value: Int64(index), timescale: 20)))
}
input.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
precondition(writer.status == .completed, "Encoder failed: \(String(describing: writer.error))")

// Decode the finished movie, so verification covers the encoded file too.
let asset = AVURLAsset(url: output)
let duration = CMTimeGetSeconds(asset.duration)
precondition(abs(duration - Double(files.count) / 20) < 0.1)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
try FileManager.default.createDirectory(at: review, withIntermediateDirectories: true)
for seconds in [0.0, 1.5, 3.5, 5.0, 8.0, 10.5, 13.0, 16.0] where seconds < duration {
    let image = try generator.copyCGImage(at: CMTime(seconds: seconds, preferredTimescale: 600), actualTime: nil)
    precondition(image.width == 800 && image.height == 480)
    let url = review.appendingPathComponent("frame-\(seconds).png")
    let destination = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, image, nil)
    precondition(CGImageDestinationFinalize(destination))
}
print("PASS: \(files.count) frames, \(duration)s, H.264 800×480; decoded review frames: \(review.path)")
