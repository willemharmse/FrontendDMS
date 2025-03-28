import React, { useState } from "react";
import "./PopupMenu.css";

const PopupMenu = ({ isOpen, setHoveredFileId, handlePreview, openDownloadModal, file, isActionAvailable }) => {

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
                </div>
            )}
        </div>
    );
};

export default PopupMenu;