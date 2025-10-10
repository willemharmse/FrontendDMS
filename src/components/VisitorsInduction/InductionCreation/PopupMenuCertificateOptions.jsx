import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenuCertificateOptions.css"

const PopupMenuCertificateOptions = ({ isOpen, file, setHoveredFileId, previewCertificate, downloadCertficate, printCertificate, type, risk = false, typeDoc = "", id = null }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-certificate-files">
            {isOpen && (
                <div className="popup-content-certificate-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => previewCertificate(file)}>View Certificate</li>
                    </ul>
                    <ul>
                        <li onClick={() => downloadCertficate(file)}>Download Certificate</li>
                    </ul>
                    {false && (<ul>
                        <li onClick={() => printCertificate(file)}>Print Certificate</li>
                    </ul>)}
                </div>
            )}
        </div>
    );
};

export default PopupMenuCertificateOptions;