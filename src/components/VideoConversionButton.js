import { Button } from "antd"
import { fetchFile } from "@ffmpeg/ffmpeg"
import { sliderValueToVideoTime } from "../utils/utils"

function VideoConversionButton({
    videoPlayerState,
    sliderValues,
    videoFile,
    pngFile,
    ffmpeg,
    onConversionStart = () => {},
    onConversionEnd = () => {},
    onCreated = () => {},
    smilePosition = [0, 0],
    smileSize = 1,
}) {
    const processVideo = async () => {
        // starting the conversion process
        onConversionStart(true)

        const inputVideoFileName = "video.mp4"
        const inputPngFileName = "image.png"
        const outputFileName = "output.mp4"

        // writing the video file to memory
        await ffmpeg.FS("writeFile", inputVideoFileName, await fetchFile(videoFile))
        await ffmpeg.FS("writeFile", inputPngFileName, await fetchFile(pngFile))

        const [min, max] = sliderValues
        const minTime = sliderValueToVideoTime(videoPlayerState.duration, min)
        const maxTime = sliderValueToVideoTime(videoPlayerState.duration, max)

        // cutting the video and add png overlay with scale
        await ffmpeg.run(
            "-y", "-ss", `${minTime}`, "-t", `${maxTime}`, "-i", inputVideoFileName, 
            "-i", inputPngFileName, 
            "-filter_complex", `[1]scale=iw*${smileSize}:-1[wm]; [0][wm]overlay=x=${smilePosition[0]}:y=${smilePosition[1]}`, 
            outputFileName
        )

        // reading the resulting file
        const data = ffmpeg.FS("readFile", outputFileName)

        // converting the GIF file created by FFmpeg to a valid image URL
        const resultUrl = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
        onCreated(resultUrl)

        // ending the conversion process
        onConversionEnd(false)
    }

    return <Button onClick={processVideo} className="conversion-btn">Save</Button>
}

export default VideoConversionButton
