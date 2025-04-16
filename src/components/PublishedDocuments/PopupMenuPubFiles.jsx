import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenuPubFiles.css";

const PopupMenuPubFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file }) => {
    const navigate = useNavigate();
    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => openDownloadModal(file._id, file.fileName)}>Download</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/review/${file._id}`)}>Review</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuPubFiles;