import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenuPubFiles.css";

const PopupMenuPubFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "" }) => {
    const navigate = useNavigate();
    const route = risk ? `/FrontendDMS/review${typeDoc.toUpperCase()}/${file._id}/${typeDoc}` : `/FrontendDMS/review/${file._id}`;
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
                    {type !== "dont" && (
                        <ul>
                            <li onClick={() => navigate(route)}>Review</li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default PopupMenuPubFiles;