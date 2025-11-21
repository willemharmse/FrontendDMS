import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import "./VersionHistoryDC.css";
import TopBar from "../Notifications/TopBar";
import DeletePopup from "../FileInfo/DeletePopup";

const DeletedDocumentsProcedure = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();

    const fileDelete = (id, fileName) => {
        setFileToDelete(id);
        setIsModalOpen(true);
        setSelectedFileName(fileName);
    }

    const closeModal = () => {
        setIsModalOpen(null);
    }

    const deleteFile = async () => {
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/procedure/deleteFile/${fileToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete the file');

            setFileToDelete("");
            setSelectedFileName("");
            setIsModalOpen(false);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const restoreFile = async (fileId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/procedure/restoreFile/${fileId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            fetchFiles();
        } catch (error) {
            alert('Error restoring the file. Please try again.');
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            default: return 'status-default';
        }
    };

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
    }, [token]);

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = `/api/fileGenDocs/procedure/trash/getFiles`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            setFiles(data.files);
        } catch (error) {
            setError(error.message);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery = (
            file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesSearchQuery;
    });

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Development</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/proceduresDMSInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Deleted Procedure Documents"}</p>
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

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className={`info-box-fih`}>Number of Documents: {filteredFiles.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Deleted Procedure Documents"}</label>
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <table className="gen-table">
                            <thead className="gen-head-del">
                                <tr>
                                    <th className="gen-th ibraGenDelNr">Nr</th>
                                    <th className="gen-th ibraGenDelFN">Document Name</th>
                                    <th className="gen-th ibraGenDelVer">Version</th>
                                    <th className="gen-th ibraGenDelDB">Deleted By</th>
                                    <th className="gen-th ibraGenDelDD">Date Deleted</th>
                                    <th className="gen-th ibraGenDelED">Expiry Date</th>
                                    <th className="gen-th ibraGenDelAct">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => (
                                    <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                        <td className="cent-values-gen gen-point">{index + 1}</td>
                                        <td className=" gen-point">
                                            <div className="popup-anchor">
                                                <span>
                                                    {removeFileExtension(file.formData.title)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="cent-values-gen gen-point">{file.formData.version}</td>
                                        <td className="cent-values-gen  gen-point">{file.deleter.username}</td>
                                        <td className="cent-values-gen  gen-point">{formatDate(file.dateDeleted)}</td>
                                        <td className="cent-values-gen  gen-point">{formatDate(file.expiryDate)}</td>
                                        <td className={"cent-values-gen trashed"}>
                                            <button
                                                className={"delete-button-fi col-but trashed-color"}
                                                onClick={() => fileDelete(file._id, file.formData.title)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Delete Document" />
                                            </button>

                                            <button
                                                className={"delete-button-fi col-but-res trashed-color"}
                                                onClick={() => restoreFile(file._id)}
                                            >
                                                <FontAwesomeIcon icon={faRotate} title="Restore Document" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFileFromTrash={deleteFile} isTrashView={true} loading={loading} selectedFileName={selectedFileName} />)}
        </div >
    );
};

export default DeletedDocumentsProcedure;