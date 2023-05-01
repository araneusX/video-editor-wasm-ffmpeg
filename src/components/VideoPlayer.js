import { ControlBar, LoadingSpinner, Player, BigPlayButton } from "video-react"
import "video-react/dist/video-react.css"
import { useEffect, useState } from "react"

export function VideoPlayer({
    src,
    onPlayerChange = () => {},
    onChange = () => {},
    startTime = undefined,
}) {
    const [player, setPlayer] = useState(undefined)
    const [playerState, setPlayerState] = useState(undefined)

    useEffect(() => {
        if (playerState) {
            onChange(playerState)

            if (playerState.isFullscreen) {
                player.toggleFullscreen();
            }
        }
    }, [playerState])

    useEffect(() => {
        onPlayerChange(player)

        if (player) {
            player.subscribeToStateChange(setPlayerState)
        }
    }, [player])

    return (
        <Player
            fluid={false}
            ref={(player) => {
                setPlayer(player)
            }}
            startTime={startTime}
            ControlBar={false}
            
        >
            <source src={src} />
            <LoadingSpinner />
            <BigPlayButton />
            <ControlBar disableCompletely />
        </Player>
    )
}
