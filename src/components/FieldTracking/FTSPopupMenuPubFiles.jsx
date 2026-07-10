import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FTSPopupMenuPubFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openProcedurePopup }) => {
    const navigate = useNavigate();
    let route;
    let verRoute;

    const getRoute = () => {
        route = `/FrontendDMS/ftsReviewTemplate/${file._id}/template`; //*NB
    }

    const getVerRoute = () => {
        verRoute = `/FrontendDMS/ftsTemplateVersionHistory/${id}`; //*NB

    }

    useEffect(() => {
        getRoute();
        getVerRoute();
    }, [])

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    {false && (<ul>
                        <li onClick={() => openDownloadModal(file._id, file.fileName)}>Download</li>
                    </ul>)}
                    {type !== "dont" && (
                        <ul>
                            <li onClick={() => navigate(route)}>Review</li>
                        </ul>
                    )}
                    <ul>
                        <li onClick={() => navigate(verRoute)}>Version History</li>
                    </ul>
                    {(file.documentStatus.toLowerCase() !== "in review") && (<ul>
                        <li onClick={() => {
                            let safeId = file._id;
                            if (typeof file._id === 'object' && file._id !== null) {
                                safeId = file._id.$oid || file._id.toString();
                            }
                            openProcedurePopup(safeId);
                        }}>
                            Upload Signed Off Version</li>
                    </ul>)}
                </div>
            )}
        </div>
    );
};

export default FTSPopupMenuPubFiles;