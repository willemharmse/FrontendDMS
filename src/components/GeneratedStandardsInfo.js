import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import { jwtDecode } from 'jwt-decode';
import "./GeneratedFileInfo.css";
import PopupMenuPubFiles from "./PublishedDocuments/PopupMenuPubFiles";
import TopBar from "./Notifications/TopBar";
import DeletePopup from "./FileInfo/DeletePopup";

const GeneratedStandardsInfo = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const [loading, setLoading] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [userID, setUserID] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/trashFile/${fileToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
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


    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
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

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            default: return 'status-default';
        }
    };

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);
            setUserID(decodedToken.userId);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/403");
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (token && role) {
            fetchFiles();
        }
    }, [token, role]);

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = `/api/fileGenDocs/standard/${userID}`;
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

            setFiles(data.files);
        } catch (error) {
            setError(error.message);
        }
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/generatedStandard/download/${fileId}`, {
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
                        <p className="logo-text-um">Published Documents</p>
                    </div>
                    <div className="button-container-create">
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/deletedStandardDocs')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-icon" />
                                <span className="button-text">Deleted Documents</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/standardsDMSInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Standard"}</p>
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className={`info-box-fih`}>Number of Documents: {filteredFiles.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} />
                </div>
                <div className="table-container-gen">
                    <table className="gen-table">
                        <thead className="gen-head">
                            <tr>
                                <th className="gen-th ibraGenNr">Nr</th>
                                <th className="gen-th ibraGenFN">Document Name</th>
                                <th className="gen-th ibraGenVer">Version</th>
                                <th className="gen-th ibraGenStatus">Document Status</th>
                                <th className="gen-th ibraGenPB">First Published By</th>
                                <th className="gen-th ibraGenPD">First Published Date</th>
                                <th className="gen-th ibraGenRB">Last Reviewed By</th>
                                <th className="gen-th ibraGenRD">Last Review Date</th>
                                <th className="gen-th ibraGenType">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.map((file, index) => (
                                <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                    <td className="cent-values-gen gen-point">{index + 1}</td>
                                    <td className="gen-point">
                                        <div className="popup-anchor">
                                            <span onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                                                {removeFileExtension(file.formData.title)}
                                            </span>

                                            {(hoveredFileId === file._id) && (
                                                <PopupMenuPubFiles
                                                    file={file}
                                                    typeDoc={"standard"}
                                                    risk={false}
                                                    isOpen={hoveredFileId === file._id}
                                                    openDownloadModal={downloadFile}
                                                    setHoveredFileId={setHoveredFileId}
                                                    id={file._id}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="cent-values-gen gen-point">{file.formData.version}</td>
                                    <td className={`${getStatusClass(file.documentStatus)} cent-values-gen  gen-point`}>{file.documentStatus}</td>
                                    <td className="cent-values-gen  gen-point">{file.publisher.username}</td>
                                    <td className="cent-values-gen  gen-point">{formatDate(file.datePublished)}</td>
                                    <td className="cent-values-gen  gen-point">{file.reviewer?.username ? file.reviewer.username : "N/A"}</td>
                                    <td className="cent-values-gen  gen-point">{file.dateReviewed ? formatDate(file.dateReviewed) : "N/A"}</td>
                                    <td className="cent-values-gen gen-point">
                                        <button
                                            className={"delete-button-fi col-but"}
                                        >
                                            <FontAwesomeIcon icon={faTrash} title="Delete Document" onClick={() => fileDelete(file._id, file.formData.title)} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
        </div >
    );
};

export default GeneratedStandardsInfo;