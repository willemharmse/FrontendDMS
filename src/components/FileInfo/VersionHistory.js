import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';
import "./VersionHistory.css";

const VersionHistory = () => {
    const [activity, setActivity] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileId, setDownloadFileId] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const { id } = useParams(); // Get the user ID from the URL parameters
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/403");
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (token && role) {
            fetchActivity();
        }
    }, [token, role]);

    const openDownloadModal = (fileId, fileName) => {
        setDownloadFileId(fileId);
        setDownloadFileName(fileName);
        setIsDownloadModalOpen(true);
    };

    const closeDownloadModal = () => {
        setDownloadFileId(null);
        setDownloadFileName(null);
        setIsDownloadModalOpen(false);
    };

    const confirmDownload = () => {
        if (downloadFileId && downloadFileName) {
            downloadFile(downloadFileId, downloadFileName);
        }
        closeDownloadModal();
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/download/${fileId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            // Confirm the response is a Blob
            const blob = await response.blob();

            // Create a URL and download the file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    // Fetch files from the API
    const fetchActivity = async () => {
        const route = `/api/version/${id}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    // 'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            setActivity(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const hours = String(date.getHours()).padStart(2, '0'); // Get hours with leading zero
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Get minutes with leading zero
        const seconds = String(date.getSeconds()).padStart(2, '0'); // Get seconds with leading zero

        return `${hours}:${minutes}`;
    };

    return (
        <div className="version-history-file-info-container">
            <div className="sidebar-um">
                <div className="sidebar-logo-um">
                    <img src={`${process.env.PUBLIC_URL}/CH_Logo.png`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} />
                    <p className="logo-text-um">Version History</p>
                </div>
            </div>

            <div className="main-box-version-history-file">
                <div className="top-section-um">
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <div className="icons-container">
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                        </div>
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" />
                        </div>
                        {isMenuOpen && (<BurgerMenuFI role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
                    </div>
                </div>
                <div className="table-containerversion-history-file-info">
                    <table className="version-history-file-info-table">
                        <thead className="version-history-file-info-head">
                            <tr>
                                <th className="version-history-file-th">Nr</th>
                                <th className="version-history-file-th">Name</th>
                                <th className="version-history-file-th">Version</th>
                                <th className="version-history-file-th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.length > 0 ? (
                                activity.map((act, index) => (
                                    <tr key={act._id} className={`file-info-row-height version-history-file-info-tr`}>
                                        <td className="version-history-file-nr">{index + 1}</td>
                                        <td className="version-history-file-fn">{removeFileExtension(act.fileName)}</td>
                                        <td className="version-history-file-stat">{act.version}</td>
                                        <td className="version-history-file-ver"><button className="verion-download-button" onClick={() => openDownloadModal(act._id, act.fileName)}><FontAwesomeIcon icon={faDownload} title="Download" /></button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3">No Version History</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
        </div >
    );
};

export default VersionHistory;