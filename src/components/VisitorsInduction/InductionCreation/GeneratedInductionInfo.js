import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import PopupMenuPubFiles from "../../PublishedDocuments/PopupMenuPubFiles";
import TopBar from "../../Notifications/TopBar";
import DeletePopup from "../../FileInfo/DeletePopup";
import PopupMenuPubInduction from "./PopupMenuPubInduction";
import PublishedInductionPreviewPage from "./PublishedInductionPreviewPage";

const GeneratedInductionInfo = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [userID, setUserID] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [previewID, setPreviewID] = useState(false);

    const openPreview = (id) => {
        setPreviewID(id);
        setIsPreview(true);
    }

    const closePreview = () => {
        setPreviewID("");
        setIsPreview(false);
    }

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
            case 'in approval': return 'status-rejected'
            default: return 'status-default';
        }
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

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
    }, [token]);

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = `/api/visitorDrafts/publishedDocs`;
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

            setFiles(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery = (
            file.formData.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Published Visitor Induction"}</p>
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

                    <div className={`info-box-fih`}>Number of Inductions: {filteredFiles.length}</div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Published Visitor Induction"}</label>
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <table className="gen-table">
                            <thead className="gen-head">
                                <tr>
                                    <th className="gen-th ibraGenNr">Nr</th>
                                    <th className="gen-th ibraGenFN">Visitor Induction Name</th>
                                    <th className="gen-th ibraGenVer">Version</th>
                                    <th className="gen-th ibraGenStatus">Induction Status</th>
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
                                        <td className="cent-values-gen">{index + 1}</td>
                                        <td className="gen-point" onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                                            <div className="popup-anchor">
                                                <span >
                                                    {removeFileExtension(file.formData.courseTitle)}
                                                </span>

                                                {(hoveredFileId === file._id) && (
                                                    <PopupMenuPubInduction
                                                        file={file}
                                                        typeDoc={"standard"}
                                                        risk={false}
                                                        isOpen={hoveredFileId === file._id}
                                                        setHoveredFileId={setHoveredFileId}
                                                        id={file._id}
                                                        openPreview={openPreview}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="cent-values-gen">{file.version}</td>
                                        <td className={`${getStatusClass(file.approvalState ? "In Approval" : file.documentStatus)} cent-values-gen`}>{file.approvalState ? "In Approval" : file.documentStatus}</td>
                                        <td className="cent-values-gen">{file.publisher.username}</td>
                                        <td className="cent-values-gen">{formatDate(file.datePublished)}</td>
                                        <td className="cent-values-gen">{file.reviewer?.username ? file.reviewer.username : "N/A"}</td>
                                        <td className="cent-values-gen">{file.dateReviewed ? formatDate(file.dateReviewed) : "N/A"}</td>
                                        <td className="cent-values-gen">
                                            <button
                                                className={"delete-button-fi col-but"}
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Delete Document" onClick={() => fileDelete(file._id, file.formData.courseTitle)} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
            {isPreview && (<PublishedInductionPreviewPage draftID={previewID} closeModal={closePreview} />)}
        </div >
    );
};

export default GeneratedInductionInfo;