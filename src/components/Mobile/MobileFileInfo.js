import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faRotate, faSort, faBars, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./MobileFileInfo.css";

const MobileFileInfo = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [disciplines, setDisciplines] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [docStatus, setDocStatus] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [isTrashView, setIsTrashView] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedFileName, setSelectedFileName] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileId, setDownloadFileId] = useState(null);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const normalRoles = ['guest', 'standarduser', 'auditor'];
    const isActionAvailable = !isTrashView && role !== 'auditor';
    const [isSortModalOpen, setIsSortModalOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("ascending");
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        discipline: '',
        fileName: '',
        documentType: '',
        status: '',
        author: '',
        deptHead: '',
        docID: '',
        startDate: '',
        endDate: ''
    });

    const handleFilterChange = (field, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: value,
        }));
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setRole(decodedToken.role);

            if (!(normalRoles.includes(decodedToken.role)) && !(adminRoles.includes(decodedToken.role))) {
                navigate("/FrontendDMS/403");
            }
        }
    }, [navigate]);

    const handlePreview = (fileId) => {
        navigate(`/FrontendDMS/preview/${fileId}`);
    };

    useEffect(() => {
        if (token && role) {
            fetchFiles();
        }
    }, [token, role]);

    useEffect(() => {
        fetchFiles();
    }, [isTrashView]);

    const openSortModal = () => setIsSortModalOpen(true);
    const closeSortModal = () => setIsSortModalOpen(false);

    const handleSort = () => {
        const sortedFiles = [...files].sort((a, b) => {
            const fieldA = a[sortField]?.toString().toLowerCase() || "";
            const fieldB = b[sortField]?.toString().toLowerCase() || "";
            if (sortOrder === "ascending") return fieldA.localeCompare(fieldB);
            return fieldB.localeCompare(fieldA);
        });
        setFiles(sortedFiles);
        closeSortModal();
    };

    // Fetch files from the API
    const fetchFiles = async () => {
        const route = isTrashView ? '/api/file/trash' : '/api/file/';
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

            const sortedFiles = data.files.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));

            setFiles(sortedFiles);

            const uniqueDiscipline = [...new Set(data.files.map(file => file.discipline))].sort();
            const uniqueTypes = [...new Set(data.files.map(file => file.documentType))].sort();
            const uniqueDocStatus = [...new Set(data.files.map(file => file.status))].sort();

            setDocStatus(uniqueDocStatus);
            setDisciplines(uniqueDiscipline);
            setDocTypes(uniqueTypes);
        } catch (error) {
            setError(error.message);
        }
    };

    const restoreFile = async (fileId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/restore/${fileId}`, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
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

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/download/${fileId}`, {
                method: 'GET',
                headers: {
                    //'Authorization': `Bearer ${token}`, // Uncomment if needed
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
            setLoading(false);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const deleteFile = async () => {
        if (!selectedFileId) return;
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/delete/${selectedFileId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete the file');
            setIsModalOpen(false);
            setSelectedFileId(null);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            setLoading(false);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const deleteFileFromTrash = async () => {
        if (!selectedFileId) return;
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/delete/${selectedFileId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete file from trash');
            setIsModalOpen(false);
            setSelectedFileId(null);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file from trash:', error);
            setLoading(false);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const formatStatus = (type) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const getReviewClass = (reviewDate) => {
        const today = new Date();
        const review = new Date(reviewDate);
        const timeDiff = review - today;

        // If the review date is more than 30 days ago, mark it as past
        if (timeDiff < 0) {
            return "review-past";
        }
        // If the review date is within the next 30 days, mark it as soon
        else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
            return "review-soon";
        }
        // Otherwise, mark it as ongoing
        return "review-ongoing";
    };

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'status-approved-mobile';
            case 'in_review': return 'status-rejected-mobile';
            case 'in_approval': return 'status-pending-mobile';
            default: return 'status-default';
        }
    };


    const toggleTrashView = () => {
        setIsTrashView(!isTrashView);
    };

    const openModal = (fileId, fileName) => {
        setSelectedFileId(fileId);
        setSelectedFileName(fileName);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedFileId(null);
        setSelectedFileName(null);
        setIsModalOpen(false);
    };

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

    // Filter files based on selected values
    const filteredFiles = files.filter((file) => {
        const matchesSearchQuery =
            file.fileName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchTextFilters = (
            file.discipline.toLowerCase().includes(filters.discipline.toLowerCase()) &&
            file.fileName.toLowerCase().includes(filters.fileName.toLowerCase()) &&
            file.documentType.toLowerCase().includes(filters.documentType.toLowerCase()) &&
            file.status.toLowerCase().includes(filters.status.toLowerCase()) &&
            file.owner.some(o => o.toLowerCase().includes(filters.author.toLowerCase())) &&
            file.departmentHead.toLowerCase().includes(filters.deptHead.toLowerCase()) &&
            file.docID.toLowerCase().includes(filters.docID.toLowerCase()) &&
            (!filters.startDate || file.reviewDate >= filters.startDate) &&
            (!filters.endDate || file.reviewDate <= filters.endDate)
        );

        const matchesFilters =
            (selectedType ? file.documentType === selectedType : true) &&
            (selectedDiscipline ? file.discipline === selectedDiscipline : true) &&
            (selectedStatus ? file.status === selectedStatus : true);

        const matchesApproval =
            (normalRoles.includes(role) && role !== 'auditor')
                ? file.status.toLowerCase() === "approved"
                : true; // Allow all files for auditors

        return matchesSearchQuery && matchesFilters && matchesApproval && matchTextFilters;
    });

    if (error) {
        return <div>Error: {error}</div>;
    }

    const toggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

    // Modified render for mobile
    return (
        <div className="mobile-dm-container">
            {/* Mobile Header */}
            <div className="mobile-dm-header">
                <div className="mobile-dm-header-top">
                    <img
                        src="logo.webp"
                        alt="Logo"
                        className="mobile-dm-logo"
                        onClick={() => navigate('/FrontendDMS/mobileHome')}
                    />
                    <div className="mobile-dm-header-icons">
                        <FontAwesomeIcon
                            icon={faFilter}
                            className="mobile-dm-icon"
                            onClick={toggleFilters}
                        />
                        <FontAwesomeIcon
                            icon={faSort}
                            className="mobile-dm-icon"
                            onClick={openSortModal}
                        />
                        {adminRoles.includes(role) && (
                            <FontAwesomeIcon
                                icon={faBars}
                                className="mobile-dm-icon"
                                onClick={toggleMenu}
                            />
                        )}

                        {/* Burger Menu */}
                        {isMenuOpen && (
                            <div
                                className="mobile-dm-burger-menu"
                                onMouseLeave={() => setIsMenuOpen(false)}
                            >
                                <button onClick={toggleTrashView}>
                                    {isTrashView ? "Show All Files" : "Show Trash"}
                                </button>
                                <button onClick={() => navigate('/FrontendDMS/mobileLogin')}>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <input
                    className="mobile-dm-search"
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Info Cards */}
                <div className="mobile-dm-stats">
                    <div className="mobile-dm-stat-card">
                        <span>Documents</span>
                        <h3>{filteredFiles.length}</h3>
                    </div>
                    <div className="mobile-dm-stat-card">
                        <span>Owners</span>
                        <h3>{new Set(filteredFiles.map((file) => file.owner)).size}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Drawer */}
            {isFiltersOpen && (
                <div className="mobile-dm-filters-drawer">
                    <div className="mobile-dm-filter-group">
                        <label>Document Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {docTypes.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mobile-dm-filter-group">
                        <label>Discipline</label>
                        <select
                            value={selectedDiscipline}
                            onChange={(e) => setSelectedDiscipline(e.target.value)}
                        >
                            <option value="">All Disciplines</option>
                            {disciplines.map((discipline, index) => (
                                <option key={index} value={discipline}>{discipline}</option>
                            ))}
                        </select>
                    </div>

                    {adminRoles.includes(role) && (
                        <div className="mobile-dm-filter-group">
                            <label>Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                {docStatus.map((status, index) => (
                                    <option key={index} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* File List */}
            <div className="mobile-dm-file-list">
                {filteredFiles.map((file, index) => (
                    <div
                        key={file._id}
                        className={`mobile-dm-file-card ${isTrashView ? "mobile-dm-trash" : ""}`}
                    >
                        <div className="mobile-dm-file-header">
                            <span className="mobile-dm-file-index">{index + 1}</span>
                            <div className="mobile-dm-file-actions">
                                {adminRoles.includes(role) && (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            className="mobile-dm-action-icon"
                                            onClick={() => openModal(file._id, file.fileName)}
                                        />
                                        {isTrashView && (
                                            <FontAwesomeIcon
                                                icon={faRotate}
                                                className="mobile-dm-action-icon"
                                                onClick={() => restoreFile(file._id)}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mobile-dm-file-content">
                            <h4>{removeFileExtension(file.fileName)}</h4>

                            <div className="mobile-dm-file-meta">
                                <div>
                                    <label>Type</label>
                                    <span>{file.documentType}</span>
                                </div>
                                <div>
                                    <label>Discipline</label>
                                    <span>{file.discipline}</span>
                                </div>
                                <div className={getReviewClass(file.reviewDate)}>
                                    <label>Review Date</label>
                                    <span >
                                        {formatDate(file.reviewDate)}
                                    </span>
                                </div>
                                <div>
                                    <label>Author</label>
                                    <span>
                                        <td>
                                            {Array.isArray(file.owner)
                                                ? file.owner.join(", ")
                                                : typeof file.owner === "string"
                                                    ? (() => {
                                                        try {
                                                            const parsed = JSON.parse(file.owner);
                                                            return Array.isArray(parsed) ? parsed.join(", ") : file.owner;
                                                        } catch {
                                                            return file.owner; // If JSON.parse fails, return the original string
                                                        }
                                                    })()
                                                    : "No Owners"}
                                        </td>
                                    </span>
                                </div>
                                <div>
                                    <label>Department Head</label>
                                    <span>
                                        {(file.departmentHead)}
                                    </span>
                                </div>
                                <div className={getStatusClass(file.status)}>
                                    <label>Status</label>
                                    <span>
                                        {formatStatus(file.status)}
                                    </span>
                                </div>
                                <div>
                                    <label>Document ID</label>
                                    <span>
                                        {(file.docID)}
                                    </span>
                                </div>
                            </div>

                            <div className="mobile-dm-file-actions-bottom">
                                <button
                                    className="mobile-dm-preview-btn"
                                    onClick={() => handlePreview(file._id)}
                                >
                                    Preview
                                </button>
                                <button
                                    className="mobile-dm-download-btn"
                                    onClick={() => openDownloadModal(file._id, file.fileName)}
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {isTrashView && (
                            <p>Do you want to delete this file from trash?</p>
                        )}
                        {!isTrashView && (
                            <p>Do you want to delete this file?</p>
                        )}
                        <p>File: {selectedFileName}</p>
                        <div className="modal-actions">
                            {isTrashView && (
                                <button className="modal-button confirm" onClick={deleteFileFromTrash} disabled={loading}>
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                                </button>
                            )}
                            {!isTrashView && (
                                <button className="modal-button confirm" onClick={deleteFile} disabled={loading}>
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                                </button>
                            )}
                            <button className="modal-button cancel" onClick={closeModal}>
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                isDownloadModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <p>Do you want to download this file?</p>
                            <p>File: {downloadFileName}</p>
                            <div className="modal-actions">
                                <button className="modal-button cancel" onClick={confirmDownload} disabled={loading}>
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                                </button>
                                <button className="modal-button confirm" onClick={closeDownloadModal}>
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Sort Modal */}
            {isSortModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Sort Files</h3>
                        <div>
                            <label htmlFor="sort-field">Field:</label>
                            <select
                                id="sort-field"
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value)}
                            >
                                <option value="">Select Field</option>
                                <option value="owner">Author</option>
                                <option value="discipline">Discipline</option>
                                <option value="docID">Document ID</option>
                                <option value="documentType">Document Type</option>
                                <option value="fileName">File Name</option>
                                <option value="reviewDate">Review Date</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort-order">Order:</label>
                            <select
                                id="sort-order"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="ascending">Ascending</option>
                                <option value="descending">Descending</option>
                            </select>
                        </div>
                        <div className="modal-actions-sort">
                            <button className="but-sort" onClick={handleSort}>Apply</button>
                            <button className="but-sort" onClick={closeSortModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileFileInfo;