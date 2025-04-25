import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenu.css";

const PopupMenu = ({ isOpen, setHoveredFileId, handlePreview, openDownloadModal, file, isActionAvailable, role, openUpdate }) => {
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
                    {role === "admin" && (<li onClick={() => openUpdate(file._id)}>Update File</li>)}
                    <ul>
                        <li onClick={() => handlePreview(file._id)}>Preview</li>
                    </ul>
                    {isActionAvailable && (
                        <ul>
                            <li onClick={() => openDownloadModal(file._id, file.fileName)}>Download</li>
                        </ul>
                    )}
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/versionHistory/${file.docID}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenu;