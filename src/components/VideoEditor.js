import { createFFmpeg } from "@ffmpeg/ffmpeg"
import { useEffect, useMemo, useRef, useState } from "react"
import { Slider, Spin } from "antd"
import { VideoPlayer } from "./VideoPlayer"
import { sliderValueToVideoTime } from "../utils/utils"
import VideoUpload from "./VideoUpload"
import VideoConversionButton from "./VideoConversionButton"
import { Rnd } from "react-rnd";

const ffmpeg = createFFmpeg({ log: true })

function VideoEditor() {
    const [ffmpegLoaded, setFFmpegLoaded] = useState(false)
    const [videoFile, setVideoFile] = useState()
    const [pngFile, setPngFile] = useState()
    const [pngUrl, setPngUrl] = useState()
    const [videoPlayerState, setVideoPlayerState] = useState()
    const [videoPlayer, setVideoPlayer] = useState()
    const [sliderValues, setSliderValues] = useState([0, 100])
    const [processing, setProcessing] = useState(false);
    const [smilePosition, setSmilePosition] = useState([0, 0]);
    const [smileSize, setSmileSize] = useState(128);

    const prevSmilePosition = useRef(smilePosition);

    useEffect(() => {
        fetch('smiley-icon.png')
        .then((data) => data.blob())
        .then((blob) => setPngFile(new File([blob], 'smile.png', { type:"image/png" })));
    }, [])

    useEffect(() => {
        // loading ffmpeg on startup
        ffmpeg.load().then(() => {
            setFFmpegLoaded(true)
        })
    }, [])

    useEffect(() => {
        const min = sliderValues[0]
        // when the slider values are updated, updating the
        // video time
        if (min !== undefined && videoPlayerState && videoPlayer) {
            videoPlayer.seek(sliderValueToVideoTime(videoPlayerState.duration, min))
        }
    }, [sliderValues])

    useEffect(() => {
        if (videoPlayer && videoPlayerState) {
            // allowing users to watch only the portion of
            // the video selected by the slider
            const [min, max] = sliderValues

            const minTime = sliderValueToVideoTime(videoPlayerState.duration, min)
            const maxTime = sliderValueToVideoTime(videoPlayerState.duration, max)

            if (videoPlayerState.currentTime < minTime) {
                videoPlayer.seek(minTime)
            }
            if (videoPlayerState.currentTime > maxTime) {
                // looping logic
                videoPlayer.seek(minTime)
            }
        }
    }, [videoPlayerState])


    useEffect(() => {
        if (pngFile) {
            setPngUrl(URL.createObjectURL(pngFile));
            return () => URL.revokeObjectURL(pngUrl);
        }
    }, [pngFile])

    const videoSize = useMemo(() => {
        if (!videoPlayer?.videoWidth || !videoPlayer.videoHeight) {
            return {
                scale: 1,
            }
        }

        const videoRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
        const clientRatio = videoPlayer.video.video.scrollWidth / videoPlayer.video.video.scrollHeight;

        if (clientRatio > videoRatio) {
            return {
                with: videoPlayer.video.video.scrollHeight * videoRatio,
                height: videoPlayer.video.video.scrollHeight,
                scale: videoPlayer.videoHeight / videoPlayer.video.video.scrollHeight,
            }
        } else {
            return {
                with: videoPlayer.video.video.scrollWidth,
                height: videoPlayer.video.video.scrollWidth / videoRatio,
                scale: videoPlayer.videoWidth / videoPlayer.video.video.scrollWidth,
            }
        }
    }, [videoPlayer?.videoWidth, videoPlayer?.videoHeight]);

    console.log(videoSize);

    const onSuccess = (resultUrl) => {
        const a = document.createElement('a');
        a.href = resultUrl;
        a.setAttribute('style', 'display: none');
        a.setAttribute('download', 'result.mp4');

        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
    }

    const onResizeStop = (delta, direction) => {
        const current = smileSize;
        setSmileSize(current + delta);

        console.log(direction);
        switch (direction) {
            case 'bottom':
            case 'right':
            case 'bottomRight':
                setSmilePosition(prevSmilePosition.current);
                break;
            case 'top':
            case 'left':
            case 'topLeft':
                setSmilePosition([prevSmilePosition.current[0] - delta, prevSmilePosition.current[1] - delta]);
                break;
            case 'topRight':
                setSmilePosition([prevSmilePosition.current[0], prevSmilePosition.current[1] - delta]);
                break;
            case 'bottomLeft':
                setSmilePosition([prevSmilePosition.current[0] - delta, prevSmilePosition.current[1]]);
                break;
            default:
                break;
        }
        
    }

    const onDragStop = (x,y) => {
        prevSmilePosition.current = smilePosition;
        setSmilePosition([x,y]);
    }

    return (
        <div>
            <div className={"container"}>
                    {!videoFile ? (
                        <VideoUpload
                            disabled={!!videoFile}
                            onChange={(videoFile) => {
                                setVideoFile(videoFile)
                            }}
                        />
                    ) : (
                        <>
                            <div className={"video-player"}>
                                <VideoPlayer
                                    src={URL.createObjectURL(videoFile)}
                                    onPlayerChange={(videoPlayer) => {
                                        setVideoPlayer(videoPlayer)
                                    }}
                                    onChange={(videoPlayerState) => {
                                        setVideoPlayerState(videoPlayerState)
                                    }}
                                />
                            </div>
                            {pngUrl && videoSize.with && (
                                <div style={{
                                    width: videoSize.with,
                                    height: videoSize.height,
                                    position: 'fixed',
                                }}>
                                    <Rnd
                                        key={smileSize}
                                        lockAspectRatio
                                        style={{
                                            border: "solid 1px #ddd",
                                            pointerEvents: 'auto'
                                        }}
                                        onDragStop={(_, { x, y }) => onDragStop(x,y)}
                                        onResizeStop={(_, dir, ___, delta) => onResizeStop(delta.width, dir)}
                                        default={{
                                            x: smilePosition[0],
                                            y: smilePosition[1],
                                            width: smileSize,
                                            height: smileSize,                                      
                                        }}
                                    >
                                        <img src={pngUrl} className={"smile"} alt={"PNG"} />
                                    </Rnd>
                                </div>
                            )}
                            <div className="controls">
                                    <VideoConversionButton
                                        onConversionStart={() => {
                                            setProcessing(true)
                                        }}
                                        onConversionEnd={() => {
                                            setProcessing(false)
                                        }}
                                        ffmpeg={ffmpeg}
                                        videoPlayerState={videoPlayerState}
                                        sliderValues={sliderValues}
                                        videoFile={videoFile}
                                        pngFile={pngFile}
                                        onCreated={onSuccess}
                                        smilePosition={[Math.round(smilePosition[0] * videoSize.scale), Math.round(smilePosition[1] * videoSize.scale)]}
                                        smileSize={Math.round((smileSize * 100 * videoSize.scale) / 512) / 100}
                                    />
                                <div className={"slider-div"}>
                                    <h3 className="text">Cut Video</h3>
                                    <Slider
                                        disabled={!videoPlayerState}
                                        value={sliderValues}
                                        range={true}
                                        onChange={(values) => {
                                            setSliderValues(values)
                                        }}
                                        tooltip={{
                                            formatter: null,
                                        }}
                                    />
                                </div>
                            </div>
                        </>)}
                    </div>
            {(processing || !ffmpegLoaded) && <Spin
                tip={!ffmpegLoaded ? "Waiting for FFmpeg to load..." : "Processing..."}
                className={"spinner"}
            />}
        </div>
    )
}

export default VideoEditor
