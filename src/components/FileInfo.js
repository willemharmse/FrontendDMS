import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import "./FileInfo.css";

const FileInfo = () => {
  const [files, setFiles] = useState([]); // State to hold the file data
  const [disciplines, setDisciplines] = useState([]);
  const [champs, setChamps] = useState([]);
  const [docStatus, setDocStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [selectedChamp, setSelectedChamp] = useState('');
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
      setFiles(data.files);

      const uniqueDiscipline = [...new Set(data.files.map(file => file.discipline))];
      const uniqueChamps = [...new Set(data.files.map(file => file.Champion))];
      const uniqueDocStatus = [...new Set(data.files.map(file => file.status))];

      setDocStatus(uniqueDocStatus);
      setDisciplines(uniqueDiscipline);
      setChamps(uniqueChamps);
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

      // Check if it's a valid PDF Blob (optional)
      if (blob.type !== 'application/pdf') {
        throw new Error('The downloaded file is not a valid PDF');
      }

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
    }
  };

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/delete/${selectedFileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete the file');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const deleteFileFromTrash = async () => {
    if (!selectedFileId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/delete/${selectedFileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete file from trash');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file from trash:', error);
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

  const isReviewSoon = (reviewDate) => {
    const today = new Date();
    const review = new Date(reviewDate);
    const timeDiff = review - today;
    return timeDiff >= 0 && timeDiff <= 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
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

    const matchesFilters =
      (selectedChamp ? file.Champion === selectedChamp : true) &&
      (selectedDiscipline ? file.discipline === selectedDiscipline : true) &&
      (selectedStatus ? file.status === selectedStatus : true);

    const matchesApproval =
      (normalRoles.includes(role) && role !== 'auditor')
        ? file.status.toLowerCase() === "approved"
        : true; // Allow all files for auditors

    return matchesSearchQuery && matchesFilters && matchesApproval;
  });

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-info-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="logo.webp" alt="Logo" className="logo-img" onClick={() => navigate('/FrontendDMS/home')} />
        </div>
        <select
          className="sidebar-item"
          value={selectedChamp}
          onChange={(e) => setSelectedChamp(e.target.value)}
        >
          <option value="">All Champions</option>
          {champs.map((champ, index) => (
            <option key={index} value={champ}>
              {champ}
            </option>
          ))}
        </select>
        <select
          className="sidebar-item"
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
        >
          <option value="">All Disciplines</option>
          {disciplines.map((discipline, index) => (
            <option key={index} value={discipline}>
              {discipline}
            </option>
          ))}
        </select>
        {adminRoles.includes(role) && (
          <select
            className="sidebar-item"
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
        )}

        <button className="sidebar-item text-format-log log-but" onClick={() => navigate('/FrontendDMS/')}>
          Log Out
        </button>
      </div>

      <div className="main-box">
        <div className="top-section">
          <input
            className="search-input"
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="info-box">Number of Documents: {filteredFiles.length}</div>
          <div className="info-box">Number of Document Owners: {new Set(filteredFiles.map((file) => file.owner)).size}</div>

          {adminRoles.includes(role) && (
            <div className="burger-menu-icon" onClick={toggleMenu}>
              &#9776; {/* This is a simple burger menu icon */}
            </div>
          )}

          {isMenuOpen && (
            <div className="burger-menu">
              <button
                onClick={() => navigate("/FrontendDMS/upload")}
              >
                Upload Document
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
            </div>
          )}
        </div>
        <div className="table-container-file">
          <table>
            <thead>
              <tr>
                <th className="doc-num">Nr</th>
                <th className="col-name-dis">Discipline</th>
                <th className="col-name">File Name</th>
                <th className="col-type">Document Type</th>
                {(adminRoles.includes(role) || role === 'auditor') && (
                  <th className="col-stat">Status</th>
                )}
                <th className="col-own-tau">Author</th>
                <th className="col-dept-head">Department Head</th>
                <th className="col-dept">Doc ID</th>
                <th className="col-date">Review Date</th>
                {adminRoles.includes(role) && (
                  <th className="col-act">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr key={file._id} className={`${isTrashView ? "tr-trash" : ""}`}>
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
                  <td className="col">{file.owner}</td>
                  <td className="col">{file.departmentHead}</td>
                  <td className="col">{(file.docID)}</td>
                  <td className={`col ${isReviewSoon(file.reviewDate) ? " review-soon" : ""}`}>{formatDate(file.reviewDate)}</td>
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
                <button className="modal-button confirm" onClick={deleteFileFromTrash}>
                  Yes
                </button>
              )}
              {!isTrashView && (
                <button className="modal-button confirm" onClick={deleteFile}>
                  Yes
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
                <button className="modal-button cancel" onClick={confirmDownload}>
                  Yes
                </button>
                <button className="modal-button confirm" onClick={closeDownloadModal}>
                  No
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default FileInfo;
