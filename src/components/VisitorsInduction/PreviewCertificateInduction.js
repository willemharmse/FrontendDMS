import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";

const PreviewCertificateInduction = () => {
    const [token, setToken] = useState('');
    const { fileId } = useParams();
    const [fileUrl, setFileUrl] = useState("");
    const [iframeHeight, setIframeHeight] = useState("100%");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [iframeSrc, setIframeSrc] = useState("");
    const location = useLocation();
    const { traineeData, inductionName } = location.state || {};

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    useEffect(() => {
        const fetchPdf = async () => {

            const res = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/preview-certificate-induction`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ traineeData, inductionName })
            });

            if (!res.ok) {
                console.error("Failed to fetch pdf");
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setIframeSrc(url);

            // Cleanup when unmounting
            return () => URL.revokeObjectURL(url);
        };

        fetchPdf();
    }, [traineeData, inductionName]);

    return (
        <div className="pdf-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Certificate Preview</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-preview-pdf">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate("/FrontendDMS/visitorHomePage")} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <div className="file-preview-container">
                    {iframeSrc ? (
                        <iframe
                            src={`${iframeSrc}`}
                            className="file-viewer"
                            title="File Preview"
                            style={{ height: iframeHeight }}
                        ></iframe>
                    ) : (
                        <p>Loading certificate...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewCertificateInduction;
