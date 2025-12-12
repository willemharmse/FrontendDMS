import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuOnlineTraining = ({ isOpen, setHoveredFileId, undoRetakeChoice, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openPreview }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => openPreview(file._id)}>Preview Course</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`/onlineReviewCourse/${file._id}`)}>Review</li>
                    </ul>
                    {file.undoable && (<ul>
                        <li onClick={() => undoRetakeChoice(file.batchId)}>Undo Require Retake</li>
                    </ul>)}
                    <ul>
                        <li onClick={() => navigate(`/onlineTrainingHistory/${file._id}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuOnlineTraining;