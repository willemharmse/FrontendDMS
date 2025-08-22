import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./PreviewPage.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import TopBar from "./Notifications/TopBar";

const PreviewPage = () => {
    const [token, setToken] = useState('');
    const { fileId } = useParams();
    const [fileUrl, setFileUrl] = useState("");
    const [iframeHeight, setIframeHeight] = useState("100%");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/FrontendDMS/');
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }

        if (fileId) {
            const url = `${process.env.REACT_APP_URL}/api/file/preview/${fileId}`;
            setFileUrl(url);
        }

        // Function to update iframe height on window resize
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIframeHeight("80vh"); // Set a fixed height for mobile view
            } else {
                setIframeHeight("100%"); // Full height for larger screens
            }
        };

        window.addEventListener("resize", handleResize);

        // Call once to set the initial height
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [navigate, fileId]);

    return (
        <div className="pdf-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Preview</p>
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
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <div className="file-preview-container">
                    {fileUrl ? (
                        <iframe
                            src={`${fileUrl}`}
                            className="file-viewer"
                            title="File Preview"
                            style={{ height: iframeHeight }}
                        ></iframe>
                    ) : (
                        <p>Loading file...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewPage;
