import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuPubInduction = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/inductionReview/${file._id}`)}>Review</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/inductionHistory/${file._id}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuPubInduction;