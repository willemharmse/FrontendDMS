import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const PopupAudioPlayer = ({
    isOpen = true,
    closePopup,
    audioFile,
    slide,
    module,
    topic,
    onDelete,               // <— add this prop for the delete button callback
}) => {
    const navigate = useNavigate();
    const popupRef = useRef(null);
    const audioRef = useRef(null);        // keep a ref so we can pause on unmount/close
    const [position, setPosition] = useState("below");

    useEffect(() => {
        if (isOpen && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.top;
            const spaceAbove = rect.top;

            // same “above/below” logic you had
            if (spaceBelow < rect.height + 20 && spaceAbove > rect.height) {
                setPosition("above");
            } else {
                setPosition("below");
            }
        }
    }, [isOpen]);

    // Optional: pause audio if popup closes or component unmounts
    useEffect(() => {
        if (!isOpen && audioRef.current) {
            audioRef.current.audio.current?.pause();
        }
        return () => {
            audioRef.current?.audio.current?.pause();
        };
    }, [isOpen]);

    return (
        <div className="popup-menu-audio-player">
            {isOpen && (
                <div
                    className={`popup-content-audio ${position === "above" ? "popup-above" : "popup-below"}`}
                    ref={popupRef}
                    onMouseLeave={() => closePopup()}
                    style={{ display: "flex", alignItems: "center" }}
                >
                    {/* Minimal player: just Play/Pause */}
                    <AudioPlayer
                        className="popup-audio"
                        ref={audioRef}
                        src={audioFile}
                        layout="horizontal"
                        showJumpControls={false}
                        customAdditionalControls={[]}
                        customVolumeControls={[]}
                        customControlsSection={[]} // <- intentionally empty
                        autoPlayAfterSrcChange={false}
                        preload="metadata"
                        customProgressBarSection={[
                            RHAP_UI.MAIN_CONTROLS,
                            RHAP_UI.CURRENT_TIME,
                            RHAP_UI.PROGRESS_BAR,
                            RHAP_UI.DURATION,
                        ]}
                    />


                    <button
                        type="button"
                        className="removeAudio-iconBtn"
                        title="Remove audio"
                        onClick={() => {
                            // 1. Tell parent to clear audio
                            if (onDelete) onDelete(module, topic, slide, 10); // the same slot index you used for audio
                            // 2. Close the popup
                            closePopup();
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PopupAudioPlayer;
