import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenuCertificateOptions.css"

const PopupMenuCertificateOptions = ({ isOpen, file, setHoveredFileId, previewCertificate, downloadCertficate }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-certificate-files">
            {isOpen && (
                <div className="popup-content-certificate-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    {file.trainee.passed && (
                        <>
                            <ul>
                                <li onClick={() => navigate(`/FrontendDMS/inductionView/${file._id}`)}>View Induction</li>
                            </ul>
                            <ul>
                                <li onClick={() => previewCertificate(file)}>View Certificate</li>
                            </ul>
                            <ul>
                                <li onClick={() => downloadCertficate(file)}>Download Certificate</li>
                            </ul>
                        </>
                    )}

                    {!file.trainee.passed && (
                        <>
                            <ul>
                                <li onClick={() => navigate(`/FrontendDMS/inductionView/${file._id}`)}>Complete Induction</li>
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PopupMenuCertificateOptions;