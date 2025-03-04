import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import FilterFileName from "./FileInfo/FilterFileName";
import "./FileInfo.css";
import Select from "react-select";
import ReviewDatePopup from "./FileInfo/ReviewDatePopup";

const FileInfo = () => {
  const [files, setFiles] = useState([]); // State to hold the file data
  const [disciplines, setDisciplines] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [docStatus, setDocStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState([]);
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
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [reviewDateVal, setReviewDateVal] = useState("");
  const [isRDPopupOpen, setIsRDPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    author: '',
    deptHead: '',
    docID: '',
    startDate: '',
    endDate: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    navigate('/FrontendDMS/');
  };

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

  useEffect(() => {
    // Function to fetch users
    const fetchValues = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();

        setReviewDateVal(data[0].reviewDate);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchValues();
  }, []);

  const openRDPopup = () => setIsRDPopupOpen(true);
  const closeRDPopup = () => setIsRDPopupOpen(false);

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
    today.setHours(0, 0, 0, 0); // Normalize today to midnight to avoid time mismatches
    const review = new Date(reviewDate);
    review.setHours(0, 0, 0, 0); // Normalize review date

    const timeDiff = review - today;

    // If the review date is in the past, mark it as "review-past"
    if (timeDiff < 0) {
      return "review-past";
    }
    // If the review date is within the next `reviewDateVal` days, mark it as "review-soon"
    else if (timeDiff <= reviewDateVal * 24 * 60 * 60 * 1000) {
      return "review-soon";
    }
    // Otherwise, mark it as "review-ongoing"
    return "review-ongoing";

  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'in_review': return 'status-rejected';
      case 'in_approval': return 'status-pending';
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
      file.owner.some(o => o.toLowerCase().includes(filters.author.toLowerCase())) &&
      file.departmentHead.toLowerCase().includes(filters.deptHead.toLowerCase()) &&
      file.docID.toLowerCase().includes(filters.docID.toLowerCase()) &&
      (!filters.startDate || file.reviewDate >= filters.startDate) &&
      (!filters.endDate || file.reviewDate <= filters.endDate)
    );

    const matchesFilters =
      (selectedType.length === 0 || selectedType.includes(file.documentType)) &&
      (selectedDiscipline.length === 0 || selectedDiscipline.includes(file.discipline)) &&
      (selectedStatus.length === 0 || selectedStatus.includes(file.status));

    const matchesApproval =
      (normalRoles.includes(role) && role !== 'auditor')
        ? file.status.toLowerCase() === "approved"
        : true; // Allow all files for auditors

    return matchesSearchQuery && matchesFilters && matchesApproval && matchTextFilters;
  });
  //7EAC89 CB6F6F
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-info-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={`${process.env.PUBLIC_URL}/logo.webp`} alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
        </div>
        <Select options={docTypes.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedType(selected.map(s => s.value))} className="sidebar-select" placeholder="All Document Types" />
        <Select options={disciplines.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedDiscipline(selected.map(s => s.value))} className="sidebar-select" placeholder="All Discipline Types" />
        {adminRoles.includes(role) && (
          <Select options={docStatus.map(d => ({ value: d, label: formatStatus(d) }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select" placeholder="All Status Types" />
        )}
        <div className="button-container">
          {adminRoles.includes(role) && (
            <button className="text-format-log but-upload"
              onClick={() => navigate("/FrontendDMS/upload")}
            >
              Upload Document
            </button>
          )}
          {adminRoles.includes(role) && (
            <button className="text-format-log but-batch"
              onClick={() => navigate("/FrontendDMS/batchUpload")}
            >
              Batch Upload Documents
            </button>
          )}
        </div>
      </div>

      <div className="main-box-file-info">
        <div className="top-section">
          <input
            className="search-input"
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="info-box">Number of Documents: {filteredFiles.length}</div>
          <div className="info-box">Number of Document Author: {
            new Set(filteredFiles.flatMap((file) => Array.isArray(file.owner) ? file.owner : [file.owner])).size
          }</div>
          <div className="sort-menu-icon" onClick={openSortModal}>
            <FontAwesomeIcon icon={faSort} />
          </div>
          {adminRoles.includes(role) && (
            <div className="burger-menu-icon" onClick={toggleMenu}>
              &#9776; {/* This is a simple burger menu icon */}
            </div>
          )}

          {isMenuOpen && (
            <div className="burger-menu"
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <button onClick={() => navigate('/FrontendDMS/updateFile')}>
                Update File
              </button>
              <button
                onClick={toggleTrashView}
              >
                {isTrashView ? "Show All Files" : "Show Trash"}
              </button>
              <button
                onClick={() => navigate("/FrontendDMS/userManagement")}
              >
                Manage Users
              </button>
              {role === 'developer' && (
                < button
                  onClick={() => navigate("/FrontendDMS/repair")}
                >
                  Repair Fields
                </button>
              )}
              <button onClick={openRDPopup}>Change Date Formatting</button>
              <ReviewDatePopup isOpen={isRDPopupOpen} onClose={closeRDPopup} onUpdate={setReviewDateVal} currVal={reviewDateVal} />
              <button onClick={handleLogout}>
                Log Out
              </button>
            </div>
          )}
        </div>
        <div className="table-container-file">
          <table>
            <thead>
              <FilterFileName adminRoles={adminRoles} role={role} filters={filters} onFilterChange={handleFilterChange} />
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr key={file._id} className={`${isTrashView ? "tr-trash" : ""} file-info-row-height`}>
                  <td className="col">{index + 1}</td>
                  <td className="col">{file.discipline}</td>
                  <td
                    onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}
                    className="file-name-cell"
                  >
                    {removeFileExtension(file.fileName)}

                    {(hoveredFileId === file._id && !isTrashView) && (
                      <div
                        className="popup"
                        onMouseEnter={() => setHoveredFileId(file._id)}
                        onMouseLeave={() => setHoveredFileId(null)}
                      >
                        <div class="buttons-container">
                          <button
                            className="btn accept"
                            onClick={() => handlePreview(file._id)}
                          >
                            Preview
                          </button>
                          {isActionAvailable && (
                            <button
                              className="btn reject"
                              onClick={() => openDownloadModal(file._id, file.fileName)}
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="col">{file.documentType}</td>
                  {(adminRoles.includes(role) || role === 'auditor') && (
                    <td className={`col ${getStatusClass(file.status)}`}>{formatStatus(file.status)}</td>
                  )}
                  <td className="col">
                    {
                      Array.isArray(file.owner)
                        ? file.owner.length > 1
                          ? file.owner[0].length > 11
                            ? `${file.owner[0].substring(0, 11)}...` // Shorten first name if longer than 8 and add "..."
                            : `${file.owner[0]}...` // Show first author and "..."
                          : file.owner[0].length > 11
                            ? `${file.owner[0].substring(0, 11)}...` // Shorten single name if longer than 8
                            : file.owner[0] // Just show the single author if within limit
                        : typeof file.owner === "string"
                          ? (() => {
                            try {
                              const parsed = JSON.parse(file.owner);
                              return Array.isArray(parsed)
                                ? parsed.length > 1
                                  ? parsed[0].length > 11
                                    ? `${parsed[0].substring(0, 11)}...`
                                    : `${parsed[0]}...`
                                  : parsed[0].length > 11
                                    ? `${parsed[0].substring(0, 11)}...`
                                    : parsed[0]
                                : file.owner;
                            } catch {
                              return file.owner.length > 11 ? `${file.owner.substring(0, 11)}...` : file.owner;
                            }
                          })()
                          : "No Owners"
                    }
                  </td>
                  <td className="col">{file.departmentHead}</td>
                  <td className="col">{(file.docID)}</td>
                  <td className={`col ${getReviewClass(file.reviewDate)}`}>{formatDate(file.reviewDate)}</td>
                  {adminRoles.includes(role) && (
                    <td className="col-action">
                      <button
                        className="delete-button col-but"
                        onClick={() => openModal(file._id, file.fileName)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      {isTrashView && (
                        <button
                          className="delete-button col-but-res"
                          onClick={() => restoreFile(file._id)}
                        >
                          <FontAwesomeIcon icon={faRotate} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <button className="modal-button-FI confirm" onClick={deleteFileFromTrash} disabled={loading}>
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                </button>
              )}
              {!isTrashView && (
                <button className="modal-button-FI confirm" onClick={deleteFile} disabled={loading}>
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                </button>
              )}
              <button className="modal-button-FI cancel" onClick={closeModal}>
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
                <button className="modal-button-FI cancel" onClick={confirmDownload} disabled={loading}>
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Yes'}
                </button>
                <button className="modal-button-FI confirm" onClick={closeDownloadModal}>
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
              <button className="modal-button-FI cancel" onClick={handleSort}>Apply</button>
              <button className="modal-button-FI confirm" onClick={closeSortModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default FileInfo;