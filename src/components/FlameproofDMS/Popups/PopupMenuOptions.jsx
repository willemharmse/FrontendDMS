import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuOptions = ({ isOpen, setHoveredFileId, openDownloadModal, file, canIn, access, openUpdate, img, txt }) => {
    const navigate = useNavigate();
    const popupRef = useRef(null);
    const [position, setPosition] = useState("below");

    useEffect(() => {
        if (isOpen && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.top;
            const spaceAbove = rect.top;

            // If not enough space below and more above, show above
            if (spaceBelow < rect.height + 20 && spaceAbove > rect.height) {
                setPosition("above");
            } else {
                setPosition("below");
            }
        }
    }, [isOpen]);

    return (
        <div className="popup-menu-container-FI">
            {isOpen && (
                <div
                    className={`popup-content-FI ${position === "above" ? "popup-above" : "popup-below"}`}
                    ref={popupRef}
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => openDownloadModal(file._id, file.fileName)}>Download</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/previewCertificate/${file._id}`)}>Preview</li>
                    </ul>
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<li onClick={() => openUpdate(file._id)}>Update</li>)}
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/flameVersionHistory/${file._id}/${img}/${txt}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuOptions;