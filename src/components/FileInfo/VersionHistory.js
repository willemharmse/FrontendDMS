import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faDownload,
    faCaretLeft,
    faCaretRight,
    faRotateLeft,
    faRotateRight
} from "@fortawesome/free-solid-svg-icons";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';
import "./VersionHistory.css";
import TopBar from "../Notifications/TopBar";
import { ToastContainer, toast } from "react-toastify";
import VersionActionPopup from "./VersionActionPopup";

const VersionHistory = () => {
    const [activity, setActivity] = useState([]);
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileId, setDownloadFileId] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [versionActionType, setVersionActionType] = useState(null);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [selectedVersionName, setSelectedVersionName] = useState(null);
    const [selectedVersionLabel, setSelectedVersionLabel] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const openVersionModal = (actionType, fileId, fileName, versionLabel) => {
        setVersionActionType(actionType);
        setSelectedVersionId(fileId);
        setSelectedVersionName(fileName);
        setSelectedVersionLabel(versionLabel);
        setIsVersionModalOpen(true);
    };

    const closeVersionModal = () => {
        setVersionActionType(null);
        setSelectedVersionId(null);
        setSelectedVersionName(null);
        setSelectedVersionLabel(null);
        setIsVersionModalOpen(false);
    };

    const confirmVersionAction = async () => {
        if (!selectedVersionId || !versionActionType) return;

        if (versionActionType === "rollback") {
            await rollbackVersion(selectedVersionId);
        } else if (versionActionType === "rollforward") {
            await rollForwardVersion(selectedVersionId);
        }

        closeVersionModal();
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchActivity();
        }
    }, [token, id]);

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

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const rollbackVersion = async (fileId) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/version/rollback/${fileId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to roll back file');
            }

            toast.success("Document rolled back successfully.");
            await fetchActivity();
        } catch (error) {
            console.error('Error rolling back file:', error);
            alert(error.message || 'Error rolling back file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const rollForwardVersion = async (fileId) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/version/rollfwd/${fileId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to roll forward file');
            }

            toast.success("Document rolled forward successfully.");
            await fetchActivity();
        } catch (error) {
            console.error('Error rolling forward file:', error);
            alert(error.message || 'Error rolling forward file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const fetchActivity = async () => {
        const route = `/api/version/history/${id}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    Authorization: `Bearer ${token}`
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

    return (
        <div className="version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div
                        className="sidebar-toggle-icon"
                        title="Hide Sidebar"
                        onClick={() => setIsSidebarVisible(false)}
                    >
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img
                            src={`${process.env.PUBLIC_URL}/CH_Logo.svg`}
                            alt="Logo"
                            className="logo-img-um"
                            onClick={() => navigate('/FrontendDMS/home')}
                            title="Home"
                        />
                        <p className="logo-text-um">Version History</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div
                        className="sidebar-toggle-icon"
                        title="Show Sidebar"
                        onClick={() => setIsSidebarVisible(true)}
                    >
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">Version History</label>
                    </div>

                    <div className="table-containerversion-history-file-info">
                        <table className="version-history-file-info-table">
                            <thead className="version-history-file-info-head" style={{ fontSize: "14px" }}>
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
                                        <tr key={act._id} className="file-info-row-height version-history-file-info-tr">
                                            <td className="version-history-file-nr">{index + 1}</td>
                                            <td className="version-history-file-fn">
                                                {removeFileExtension(act.fileName)}
                                            </td>
                                            <td className="version-history-file-stat">
                                                {act.versionLabel || act.version}
                                            </td>
                                            <td className="version-history-file-ver">
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "8px",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    <button
                                                        className="verion-download-button"
                                                        onClick={() => openDownloadModal(act._id, act.fileName)}
                                                        title="Download"
                                                        type="button"
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} />
                                                    </button>

                                                    {act.canRollback && (
                                                        <button
                                                            className="verion-download-button"
                                                            onClick={() =>
                                                                openVersionModal("rollback", act._id, act.fileName, act.versionLabel || act.version)
                                                            }
                                                            title="Roll Back"
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon icon={faRotateLeft} />
                                                        </button>
                                                    )}

                                                    {act.canRollForward && (
                                                        <button
                                                            className="verion-download-button"
                                                            onClick={() =>
                                                                openVersionModal("rollforward", act._id, act.fileName, act.versionLabel || act.version)
                                                            }
                                                            title="Roll Forward"
                                                            type="button"
                                                        >
                                                            <FontAwesomeIcon icon={faRotateRight} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No Version History</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {error && (
                        <div style={{ padding: "10px", color: "red" }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {isDownloadModalOpen && (
                <DownloadPopup
                    closeDownloadModal={closeDownloadModal}
                    confirmDownload={confirmDownload}
                    downloadFileName={downloadFileName}
                    loading={loading}
                />
            )}

            {isVersionModalOpen && (
                <VersionActionPopup
                    closeModal={closeVersionModal}
                    confirmAction={confirmVersionAction}
                    fileName={selectedVersionName}
                    versionLabel={selectedVersionLabel}
                    loading={loading}
                    actionType={versionActionType}
                />
            )}

            <ToastContainer />
        </div>
    );
};

export default VersionHistory;