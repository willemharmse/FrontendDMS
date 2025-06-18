import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCertificate, faChalkboardTeacher, faClipboardCheck, faFileAlt, faFileSignature, faHardHat, faHome, faListOl, faScaleBalanced, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import FilterFileName from "./FileInfo/FilterFileName";
import "./FileInfo.css";
import Select from "react-select";
import ReviewDatePopup from "./FileInfo/ReviewDatePopup";
import UploadPopup from "./FileInfo/UploadPopup";
import UpdateFileModal from "./FileInfo/UpdateFileModal";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BurgerMenuFIMain from "./FileInfo/BurgerMenuFIMain";
import DeletePopup from "./FileInfo/DeletePopup";
import SortPopup from "./FileInfo/SortPopup";
import BatchUpload from "./FileInfo/BatchUpload";
import DownloadPopup from "./FileInfo/DownloadPopup";
import PopupMenu from "./FileInfo/PopupMenu";
import Notifications from "./Notifications/Notifications";
import RenameDocument from "./FileInfo/RenameDocument";

const FileInfo = () => {
  const { type } = useParams();
  const [files, setFiles] = useState([]); // State to hold the file data
  const [disciplines, setDisciplines] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
  const [upload, setUpload] = useState(false);
  const [update, setUpdate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const [batch, setBatch] = useState(false);
  const [updateID, setUpdateID] = useState(null);
  const [rename, setRename] = useState(false);
  const [documentRenameName, setDocumentRenameName] = useState("");
  const [filters, setFilters] = useState({
    author: '',
    deptHead: '',
    docID: '',
    startDate: '',
    endDate: ''
  });
  const [count, setCount] = useState(""); // Placeholder for unread notifications count

  useEffect(() => {
    const fetchNotificationCount = async () => {
      const route = `/api/notifications/count`;
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch notification count');
        }
        const data = await response.json();
        setCount(data.notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotificationCount();
  }, []);

  const openUpload = () => {
    setUpload(true);
  };

  const openRename = (fileName, fileID) => {
    setDocumentRenameName(fileName);
    setUpdateID(fileID);
    setRename(true);
  }

  const closeRename = () => {
    setRename(false);
    fetchFiles();
  }

  const openBatch = () => {
    setBatch(true);
  }

  const closeBatch = () => {
    setBatch(false);
    fetchFiles();
  }

  const closeUpload = () => {
    setUpload(!upload);
    fetchFiles();
  };

  const openUpdate = (fileID) => {
    setUpdateID(fileID);
    setUpdate(true);
  };

  const closeUpdate = () => {
    setUpdate(!update);
    fetchFiles();
  };

  const openRDPopup = () => setIsRDPopupOpen(true);
  const closeRDPopup = () => setIsRDPopupOpen(false);

  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  const handleFilterChange = (field, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: value,
    }));
  };

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
    const route = isTrashView ? `/api/file/trash/` : (type === "All Document" ? `/api/file/` : `/api/file/type/${type}`);
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

  const clearSearch = () => {
    setSearchQuery("");
  };

  const restoreFile = async (fileId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/restore/${fileId}`, {
        method: 'GET',
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

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/delete/${selectedFileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const iconMap = {
    "All Document": "allDocumentsDMS.svg",
    Audit: "auditsDMSInverted.svg",
    Guideline: "guidelinesDMSInverted.svg",
    "DMRE MCOP Guideline": "guidelinesDMSInverted.svg",
    "Industry Document": "guidelinesDMSInverted.svg",
    MCOP: faHardHat,
    Policy: "policiesDMSInverted.svg",
    Procedure: "proceduresDMSInverted.svg",
    "Risk Assessment": "riskAssessmentDMSInverted.svg",
    "Special Instruction": "guidelinesDMSInverted.svg",
    Standard: "standardsDMSInverted.svg",
    Training: "guidelinesDMSInverted.svg",
    Permit: "permitsDMSInverted.svg"
  }

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
    const matchesSearchQuery = (
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.owner.some(o => o.toLowerCase().includes(searchQuery.toLowerCase())) ||
      file.departmentHead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.docID.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const overdueCount = filteredFiles.filter(doc => {
    const reviewDate = new Date(doc.reviewDate);
    reviewDate.setHours(0, 0, 0, 0); // Normalize to date-only
    return !isNaN(reviewDate) && reviewDate < today;
  }).length;


  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-info-container">
      {upload && (<UploadPopup onClose={closeUpload} />)}
      {update && (<UpdateFileModal isModalOpen={update} closeModal={closeUpdate} fileID={updateID} />)}

      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
            <p className="logo-text-um">Document Management</p>
          </div>

          <div className="filter-dm-fi">
            <p className="filter-text-dm-fi">Filter</p>
            <div className="button-container-dm-fi">
              {(type === "All Document" || isTrashView) && (
                <Select options={docTypes.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedType(selected.map(s => s.value))} className="sidebar-select" placeholder="All Document Types" />
              )}
              <Select options={disciplines.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedDiscipline(selected.map(s => s.value))} className="sidebar-select" placeholder="All Discipline Types" />
              {adminRoles.includes(role) && (
                <Select options={docStatus.map(d => ({ value: d, label: formatStatus(d) }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select" placeholder="All Status Types" />
              )}
            </div>
          </div>
          {!isTrashView && (
            <div className="filter-dm-fi-2">
              <p className="filter-text-dm-fi">Upload</p>
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={openUpload}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                    <span className="button-text">Single Document</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={isTrashView ? `${process.env.PUBLIC_URL}/trash.png` : `${process.env.PUBLIC_URL}/${iconMap[type]}`} alt="Logo" className="logo-img-dept-view" />
            <p className="logo-text-dm-fi">{isTrashView ? `Trashed Files` : (type === "Policy" ? "Policies" : `${type}s`)}</p>
          </div>
        </div>
      )}

      {!isSidebarVisible && (
        <div className="sidebar-floating-toggle" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
          <FontAwesomeIcon icon={faChevronRight} />
        </div>
      )}

      <div className="main-box-file-info">
        <div className="top-section-um">
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

          <div className={isTrashView ? `info-box-fih trashed` : `info-box-fih`}>Number of Documents: {filteredFiles.length}</div>
          {!isTrashView && (
            <div className="info-box-fih">Review Overdue: {overdueCount}</div>
          )}

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          {/* Container for right-aligned icons */}
          <div className="icons-container">
            <div className="burger-menu-icon-um">
              <FontAwesomeIcon onClick={() => navigate('/FrontendDMS/home')} icon={faHome} title="Home" />
            </div>
            <div className="burger-menu-icon-um">
              <FontAwesomeIcon onClick={() => isTrashView ? toggleTrashView() : navigate(-1)} icon={faArrowLeft} title="Back" />
            </div>
            <div className="sort-menu-icon-um">
              <FontAwesomeIcon icon={faSort} onClick={openSortModal} title="Sort" />
            </div>
            <div className="burger-menu-icon-um notifications-bell-wrapper">
              <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
              {count != 0 && <div className="notifications-badge">{count}</div>}
            </div>
            <div className="burger-menu-icon-um">
              <FontAwesomeIcon icon={faCircleUser} onClick={() => setIsMenuOpen(!isMenuOpen)} title="Menu" />
            </div>
            {showNotifications && (<Notifications setClose={setShowNotifications} />)}
            {isMenuOpen && (<BurgerMenuFIMain role={role} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} toggleTrashView={toggleTrashView} isTrashView={isTrashView} openRDPopup={openRDPopup} />)}
          </div>
        </div>
        {batch && (<BatchUpload onClose={closeBatch} />)}
        {isRDPopupOpen && (<ReviewDatePopup isOpen={isRDPopupOpen} onClose={closeRDPopup} onUpdate={setReviewDateVal} currVal={reviewDateVal} />)}

        <div className="table-container-file">
          <table>
            <thead>
              <FilterFileName adminRoles={adminRoles} role={role} filters={filters} onFilterChange={handleFilterChange} trashed={isTrashView} />
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
                      <PopupMenu file={file} openUpdate={openUpdate} openRenameModal={openRename} handlePreview={handlePreview} isActionAvailable={isActionAvailable} isOpen={hoveredFileId === file._id} openDownloadModal={openDownloadModal} setHoveredFileId={setHoveredFileId} role={role} />
                    )}

                  </td>
                  <td className="col">{file.documentType}</td>
                  {(adminRoles.includes(role) || role === 'auditor') && (
                    <td className={`col ${getStatusClass(file.status)}`}>{formatStatus(file.status)}</td>
                  )}
                  <td className="col">
                    {Array.isArray(file.owner)
                      ? file.owner[0] // Show first author from array
                      : typeof file.owner === "string"
                        ? (() => {
                          try {
                            const parsed = JSON.parse(file.owner);
                            return Array.isArray(parsed) ? parsed[0] : file.owner;
                          } catch {
                            return file.owner;
                          }
                        })()
                        : "No Owners"}
                  </td>

                  <td className="col">{file.departmentHead}</td>
                  <td className="col">{(file.docID)}</td>
                  <td className={`col ${getReviewClass(file.reviewDate)}`}>{formatDate(file.reviewDate)}</td>
                  <td className="col">{file.userID.username ? (file.userID.username === "Willem" ? file.userID.username + " Harmse" : file.userID.username) : ""}</td>
                  <td className="col">{formatDate(file.uploadDate)}</td>
                  {adminRoles.includes(role) && (
                    <td className={isTrashView ? "col-act trashed" : "col-act"}>
                      <button
                        className={isTrashView ? "delete-button-fi col-but trashed-color" : "delete-button-fi col-but"}
                        onClick={() => openModal(file._id, file.fileName)}
                      >
                        <FontAwesomeIcon icon={faTrash} title="Delete Document" />
                      </button>

                      {isTrashView && (
                        <button
                          className={isTrashView ? "delete-button-fi col-but-res trashed-color" : "delete-button-fi col-but-res"}
                          onClick={() => restoreFile(file._id)}
                        >
                          <FontAwesomeIcon icon={faRotate} title="Restore Document" />
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

      {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} deleteFileFromTrash={deleteFileFromTrash} isTrashView={isTrashView} loading={loading} selectedFileName={selectedFileName} />)}
      {isSortModalOpen && (<SortPopup closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {rename && (<RenameDocument documentName={documentRenameName} isOpen={rename} onClose={closeRename} fileID={updateID} />)}
      <ToastContainer />
    </div >
  );
};

export default FileInfo;