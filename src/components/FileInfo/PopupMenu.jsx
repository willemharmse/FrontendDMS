import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenu.css";

const PopupMenu = ({ isOpen, setHoveredFileId, handlePreview, openDownloadModal, file, isActionAvailable }) => {
    const navigate = useNavigate();
    return (
        <div className="popup-menu-container-FI">
            {isOpen && (
                <div className="popup-content-FI"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
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