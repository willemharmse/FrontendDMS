import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import "./CertificateVersionHistory.css";

const CertificateVersionHistory = () => {
    const [activity, setActivity] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileId, setDownloadFileId] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const { id, image, text } = useParams(); // Get the user ID from the URL parameters
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchActivity();
        }
    }, [token]);

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

            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/downloadCertificate/${fileId}`, {
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

    const enrichHistory = (arr = []) => {
        // sort by version if present; fallback to issueDate
        const list = [...arr].sort((a, b) => {
            const vA = a?.version ?? 0, vB = b?.version ?? 0;
            if (vA !== vB) return vA - vB;
            const dA = new Date(a?.dateCreated || 0).getTime();
            const dB = new Date(b?.dateCreated || 0).getTime();
            return dA - dB;
        });

        return list.map((item, i) => ({
            ...item,
            // if there’s a next item, dateReplaced = next.issueDate; else null (→ "-")
            dateReplaced: i < list.length - 1 ? list[i + 1]?.dateCreated ?? null : null,
        }));
    };

    // Fetch files from the API
    const fetchActivity = async () => {
        const route = `/api/flameproof/certificates/${id}/history`;
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

            const enriched = enrichHistory(data.history || []);
            setActivity(enriched);
        } catch (error) {
            setError(error.message);
        }
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
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
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Version History</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/${image}`} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{text}</p>
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
            <div className="main-box-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-containerversion-history-file-info">
                    <table className="version-history-file-info-table">
                        <thead className="version-history-file-info-head">
                            <tr>
                                <th className="certificate-version-history-file-nr">Nr</th>
                                <th className="certificate-version-history-file-name">Name</th>
                                <th className="certificate-version-history-file-version">Version</th>
                                <th className="certificate-version-history-file-certAuth">Certification Authority</th>
                                <th className="certificate-version-history-file-certNr">Certificate Number</th>
                                <th className="certificate-version-history-file-issueDate">Issue Date</th>
                                <th className="certificate-version-history-file-dateReplaced">Date Replaced</th>
                                <th className="certificate-version-history-file-actions">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.length > 0 ? (
                                activity.map((act, index) => (
                                    <tr key={act._id} className={`file-info-row-height version-history-file-info-tr`}>
                                        <td className="certificate-version-history-file-nr">{index + 1}</td>
                                        <td className="certificate-version-history-file-name">{removeFileExtension(act.fileName)}</td>
                                        <td className="certificate-version-history-file-version">{act.version}</td>
                                        <td className="certificate-version-history-file-certAuth">{act.certAuth}</td>
                                        <td className="certificate-version-history-file-certNr">{act.certNr}</td>
                                        <td className="certificate-version-history-file-issueDate">{formatDate(act.issueDate)}</td>
                                        <td className="certificate-version-history-file-dateReplaced">{formatDate(act.dateReplaced)}</td>
                                        <td className="certificate-version-history-file-actions"><button className="verion-download-button" onClick={() => openDownloadModal(act._id, act.fileName)}><FontAwesomeIcon icon={faDownload} title="Download" /></button></td>
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

export default CertificateVersionHistory;