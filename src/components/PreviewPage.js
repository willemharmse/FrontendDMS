import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./PreviewPage.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";

const PreviewPage = () => {
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const adminRoles = ['admin', 'teamleader'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const { fileId } = useParams();
    const [fileUrl, setFileUrl] = useState("");
    const [iframeHeight, setIframeHeight] = useState("100%");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
                    <p className="logo-text-um">Document Preview</p>
                </div>
            </div>

            <div className="main-box-preview-pdf">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faBell} />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(true)} />
                        </div>
                    </div>
                </div>

                {isMenuOpen && (<BurgerMenuFI isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} role={"None"} />)}

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
