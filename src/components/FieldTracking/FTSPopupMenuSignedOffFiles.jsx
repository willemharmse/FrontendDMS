import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FTSPopupMenuSignedOffFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openProcedurePopup, review, preview }) => {
    const navigate = useNavigate();

    const getVerRoute = () => {
        let verRoute;
        verRoute = `/FrontendDMS/ftsTemplateVersionHistory/${file._id}`;

        return verRoute;
    }

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => preview(file._id)}>Preview</li>
                    </ul>
                    {file.documentStatus.toLowerCase() !== "in revision" && (
                        <ul>
                            <li onClick={() => review(file._id)}>Review</li>
                        </ul>
                    )}
                    <ul>
                        <li onClick={() => navigate(`${getVerRoute()}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FTSPopupMenuSignedOffFiles;