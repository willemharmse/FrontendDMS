import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./PreviewPage.css";

const PreviewPage = () => {
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const { fileId } = useParams();
    const [fileUrl, setFileUrl] = useState("");
    const [iframeHeight, setIframeHeight] = useState("100%");

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        navigate('/FrontendDMS/');
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }
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
            <div className="sidebar-preview-pdf">
                <div className="sidebar-logo-preview-pdf">
                    <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/documentManage')} />
                </div>
                <button className="sidebar-item-preview-pdf text-format-log-preview-pdf log-but-preview-pdf" onClick={handleLogout}>
                    Log Out
                </button>
            </div>

            <div className="main-box-preview-pdf">
                <div className="file-preview-container">
                    <h2>File Preview</h2>
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
                    <button onClick={() => navigate(-1)} className="back-button-preview-pdf">Go Back</button>
                </div>
            </div>
        </div>
    );
};

export default PreviewPage;
