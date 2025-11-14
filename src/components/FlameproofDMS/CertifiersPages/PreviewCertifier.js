import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../../Notifications/TopBar";

const PreviewCertifier = () => {
    const [token, setToken] = useState('');
    const { fileId } = useParams();
    const [fileUrl, setFileUrl] = useState("");
    const [iframeHeight, setIframeHeight] = useState("100%");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    // NEW: loading state + delayed overlay
    const [isLoading, setIsLoading] = useState(true);
    const [showDelayedLoading, setShowDelayedLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (isLoading) {
            timer = setTimeout(() => setShowDelayedLoading(true), 400);
        } else {
            setShowDelayedLoading(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken); // (decodedToken not used)
        }

        if (fileId) {
            const url = `${process.env.REACT_APP_URL}/api/flameProofCertifiers/preview/${fileId}`;
            setFileUrl(url);
            setIsLoading(true); // NEW: start loading when URL set/changes
        }

        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIframeHeight("80vh");
            } else {
                setIframeHeight("100%");
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [navigate, fileId]);

    // Optional: handle iframe error to stop spinner and show a message
    const handleIframeError = () => {
        setIsLoading(false);
        // You can also set an error state and show it instead of the spinner
    };

    return (
        <div className="pdf-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Preview Certificate</p>
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
                    <div className="spacer"></div>
                    <TopBar />
                </div>

                <div className="file-preview-container">
                    {fileUrl ? (
                        <>
                            {/* Loading overlay (appears above the iframe while loading) */}
                            {showDelayedLoading && isLoading && (
                                <div className="preview-loading" role="status" aria-live="polite" aria-label="Loading certificate">
                                    <FontAwesomeIcon icon={faSpinner} spin className="preview-loading__spinner" />
                                    <div className="preview-loading__text">Loading Certificate</div>
                                </div>
                            )}

                            <iframe
                                src={fileUrl}
                                className="file-viewer"
                                title="File Preview"
                                style={{ height: iframeHeight }}
                                onLoad={() => setIsLoading(false)}     // NEW
                                onError={handleIframeError}            // NEW (optional)
                            />
                        </>
                    ) : (
                        <div className="preview-loading" role="status" aria-live="polite" aria-label="Loading certificate">
                            <FontAwesomeIcon icon={faSpinner} spin className="preview-loading__spinner" />
                            <div className="preview-loading__text">Loading Certificate</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewCertifier;
