import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTrash, faSearch, faArrowLeft, faBell, faCircleUser, faCaretLeft, faCaretRight, faFileCirclePlus, faX, faSort, faFilter, faCopy, faPlusCircle, faTableColumns, faDownload, faArrowsLeftRight, faArrowsRotate, faFlag, faUser, faArrowRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
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
import BatchUpload from "./FileInfo/BatchUpload";
import DownloadPopup from "./FileInfo/DownloadPopup";
import PopupMenu from "./FileInfo/PopupMenu";
import Notifications from "./Notifications/Notifications";
import RenameDocument from "./FileInfo/RenameDocument";
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../utils/auth";
import RestoreDocumentPopup from "./FileInfo/RestoreDocumentPopup";
import MigrateOwnership from "./FileInfo/MigrateOwnership";
import TopBar from "./Notifications/TopBar";

const FileInfo = () => {
  const { type, fileIds } = useParams();
  const [files, setFiles] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [docTypes, setDocTypes] = useState([]);
  const [docStatus, setDocStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
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
  const isActionAvailable = !isTrashView && canIn(access, "DMS", ["systemAdmin", "contributor"]);
  const [reviewDateVal, setReviewDateVal] = useState(30);
  const [isRDPopupOpen, setIsRDPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const [update, setUpdate] = useState(false);
  const navigate = useNavigate();
  const [batch, setBatch] = useState(false);
  const [updateID, setUpdateID] = useState(null);
  const [rename, setRename] = useState(false);
  const [documentRenameName, setDocumentRenameName] = useState("");
  const excelPopupRef = useRef(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [migrate, setMigrate] = useState(false);
  const [isSwitchingView, setIsSwitchingView] = useState(false);

  // --- EXCEL FILTER & SORT STATE ---
  const DEFAULT_SORT = { colId: null, direction: null };
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
  const [columnFilters, setColumnFilters] = useState({}); // { colId: { selected: ["Val1", "Val2"] } }

  const [excelFilter, setExcelFilter] = useState({
    open: false,
    colId: null,
    anchorRect: null,
    pos: { top: 0, left: 0, width: 0 }
  });
  const [excelSearch, setExcelSearch] = useState("");
  const [excelSelected, setExcelSelected] = useState(new Set());

  const openUpload = () => setUpload(true);
  const closeUpload = () => { setUpload(false); fetchFiles(); };

  const openMigrate = () => {
    setMigrate(true);
  };

  const closeMigrate = () => {
    setMigrate(!migrate);
  };

  const openRename = (fileName, fileID) => {
    setDocumentRenameName(fileName);
    setUpdateID(fileID);
    setRename(true);
  }
  const closeRename = () => { setRename(false); fetchFiles(); }

  const openBatch = () => setBatch(true);
  const closeBatch = () => { setBatch(false); fetchFiles(); }

  const openUpdate = (fileID) => { setUpdateID(fileID); setUpdate(true); };
  const closeUpdate = () => {
    setUpdate(false);
    setUpdateID(null);
    fetchFiles();

    navigate(`/FrontendDMS/documentManage/${type}/new`, { replace: true });
  };

  const openRDPopup = () => setIsRDPopupOpen(true);
  const closeRDPopup = () => setIsRDPopupOpen(false);

  // --- EXCEL FILTER HELPERS ---
  const BLANK = "(Blanks)";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper moved up so it can be used in filtering logic
  const formatStatus = (type) => {
    if (!type) return "";
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getFilterValuesForCell = (row, colId) => {
    let val;

    if (colId === "uploader") {
      val = row.userID?.username || "";
    } else if (colId === "owner") {
      // Owner can be array or JSON string of array
      let raw = row.owner;
      if (typeof raw === 'string' && (raw.startsWith('[') || raw.includes(','))) {
        try { raw = JSON.parse(raw); } catch { }
      }
      if (Array.isArray(raw)) {
        return raw.map(v => v ? String(v).trim() : BLANK);
      }
      val = raw;
    } else if (colId === "reviewDate" || colId === "uploadDate") {
      // Format date for the filter list (YYYY-MM-DD)
      val = formatDate(row[colId]);
    } else if (colId === "status") {
      // Format Status (e.g., "in_review" -> "In Review")
      val = formatStatus(row[colId]);
    } else if (colId === "fileName") {
      val = removeFileExtension(row[colId]);
    }
    else {
      val = row[colId];
    }

    const s = val == null ? "" : String(val).trim();
    return s === "" ? [BLANK] : [s];
  };

  const toggleSort = (colId, direction) => {
    setSortConfig(prev => {
      // If clicking the same sort active now, reset to default
      if (prev?.colId === colId && prev?.direction === direction) {
        return DEFAULT_SORT;
      }
      return { colId, direction };
    });
  };

  const openExcelFilterPopup = (colId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const th = e.target.closest("th");
    const rect = th.getBoundingClientRect();

    // Build unique values
    const values = Array.from(
      new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId)))
    ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

    const existing = columnFilters?.[colId];
    const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

    setExcelSelected(initialSelected);
    setExcelSearch("");

    setExcelFilter({
      open: true,
      colId,
      anchorRect: rect,
      pos: {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(220, rect.width),
      },
    });
  };

  // Logic to reposition popup if it goes offscreen
  useEffect(() => {
    if (!excelFilter.open) return;
    const el = excelPopupRef.current;
    if (!el) return;

    const popupRect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 8;

    let newTop = excelFilter.pos.top;
    let newLeft = excelFilter.pos.left;

    // if bottom off-screen -> place above header if possible
    if (popupRect.bottom > viewportH - margin) {
      const anchor = excelFilter.anchorRect;
      if (anchor) {
        const desiredTop = anchor.top - popupRect.height - 4;
        newTop = Math.max(margin, desiredTop);
      }
    }

    // keep within left/right bounds
    if (popupRect.right > viewportW - margin) {
      const overflow = popupRect.right - (viewportW - margin);
      newLeft = Math.max(margin, newLeft - overflow);
    }
    if (popupRect.left < margin) newLeft = margin;

    if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
      setExcelFilter(prev => ({
        ...prev,
        pos: { ...prev.pos, top: newTop, left: newLeft }
      }));
    }
  }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

  // Handle clicking outside popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (excelFilter.open && excelPopupRef.current && !excelPopupRef.current.contains(e.target)) {
        setExcelFilter(prev => ({ ...prev, open: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [excelFilter.open]);

  const handleInnerScrollWheel = (e) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const delta = e.deltaY;
    const goingDown = delta > 0;

    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((goingDown && atBottom) || (!goingDown && atTop)) {
      e.preventDefault();
      e.stopPropagation();

      if (goingDown && atBottom) {
        el.scrollTop = scrollHeight - clientHeight;
      } else if (!goingDown && atTop) {
        el.scrollTop = 0;
      }
      return;
    }
  };


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      jwtDecode(storedToken);
    }
  }, [navigate]);

  useEffect(() => {
    const savedReviewDateVal = localStorage.getItem("highlightReviewDates");
    if (savedReviewDateVal && !isNaN(savedReviewDateVal) && Number(savedReviewDateVal) > 0) {
      setReviewDateVal(Number(savedReviewDateVal));
    } else {
      localStorage.setItem("highlightReviewDates", "30");
      setReviewDateVal(30);
    }
  }, []);

  const handlePreview = (fileId) => {
    navigate(`/FrontendDMS/preview/${fileId}`);
  };

  useEffect(() => {
    if (token && hasRole(access, "DMS")) fetchFiles();
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [isTrashView]);

  const fetchFiles = async () => {
    const route = isTrashView
      ? `/api/file/trash/`
      : (type === "All Document" ? `/api/file/` : `/api/file/type/${type}`);

    try {
      setIsSwitchingView(true);
      setFiles([]); // clears current rows immediately while switching

      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();

      let fetchedFiles = data.files || [];

      // Filter trash by current type unless viewing All Document
      if (isTrashView && type !== "All Document") {
        fetchedFiles = fetchedFiles.filter(
          file =>
            String(file.documentType || "").toLowerCase() === String(type).toLowerCase()
        );
      }

      // Initial sort by review date
      const sortedFiles = fetchedFiles.sort(
        (a, b) => new Date(a.reviewDate) - new Date(b.reviewDate)
      );

      setFiles(sortedFiles);

      const uniqueDiscipline = [...new Set(fetchedFiles.map(file => file.discipline))].sort();
      const uniqueTypes = [...new Set(fetchedFiles.map(file => file.documentType))].sort();
      const uniqueDocStatus = [...new Set(fetchedFiles.map(file => file.status))].sort();

      setDocStatus(uniqueDocStatus);
      setDisciplines(uniqueDiscipline);
      setDocTypes(uniqueTypes);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSwitchingView(false);
    }
  };

  const getDeletedTitle = () => {
    if (type === "All Document") return "Deleted Documents";
    return `Deleted ${type === "Policy"
      ? "Policies"
      : type === "Training"
        ? "Training"
        : `${type}s`
      }`;
  };

  const clearSearch = () => setSearchQuery("");

  const restoreFile = async (fileId) => {
    if (!selectedFileId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/restore/${selectedFileId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed');
      setIsRestoreModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { alert('Error restoring the file.'); }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/download/${fileId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) { console.error(error); alert('Error downloading.'); }
    finally { setLoading(false); }
  };

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/delete/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const deleteFileFromTrash = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/file/trash/delete/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const removeFileExtension = (fileName) => fileName.replace(/\.[^/.]+$/, "");

  const getReviewClass = (reviewDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(reviewDate);
    review.setHours(0, 0, 0, 0);
    const timeDiff = review - today;
    if (timeDiff < 0) return "review-past";
    else if (timeDiff <= reviewDateVal * 24 * 60 * 60 * 1000) return "review-soon";
    return "review-ongoing";
  };

  const iconMap = {
    "All Document": "allDocumentsDMS.svg",
    Audit: "auditsDMSInverted.svg",
    Guideline: "guidelinesDMSInverted.svg",
    "DMPR MCOP Guideline": "guidelinesDMSInverted.svg",
    "Industry Document": "guidelinesDMSInverted.svg",
    MCOP: "guidelinesDMSInverted.svg",
    Policy: "policiesDMSInverted.svg",
    Procedure: "proceduresDMSInverted.svg",
    "Risk Assessment": "riskAssessmentDMSInverted.svg",
    "Special Instruction": "guidelinesDMSInverted.svg",
    Standard: "standardsDMSInverted.svg",
    Training: "guidelinesDMSInverted.svg",
    Permit: "permitsDMSInverted.svg"
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'in_review': return 'status-rejected';
      case 'in_approval': return 'status-pending';
      default: return 'status-default';
    }
  };

  const toggleTrashView = () => {
    setIsTrashView(prev => !prev);
  };

  const openModal = (fileId, fileName) => { setSelectedFileId(fileId); setSelectedFileName(fileName); setIsModalOpen(true); };
  const closeModal = () => { setSelectedFileId(null); setSelectedFileName(null); setIsModalOpen(false); };
  const openRestoreModal = (fileId, fileName) => { setSelectedFileId(fileId); setSelectedFileName(fileName); setIsRestoreModalOpen(true); };
  const closeRestoreModal = () => { setSelectedFileId(null); setSelectedFileName(null); setIsRestoreModalOpen(false); };
  const openDownloadModal = (fileId, fileName) => { setDownloadFileId(fileId); setDownloadFileName(fileName); setIsDownloadModalOpen(true); };
  const closeDownloadModal = () => { setDownloadFileId(null); setDownloadFileName(null); setIsDownloadModalOpen(false); };
  const confirmDownload = () => { if (downloadFileId && downloadFileName) downloadFile(downloadFileId, downloadFileName); closeDownloadModal(); };

  // --- FILTERED AND SORTED FILES ---
  const filteredFiles = useMemo(() => {
    let current = [...files];

    // 1. Search Query
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      current = current.filter(file => (
        file.fileName.toLowerCase().includes(lower) ||
        file.discipline.toLowerCase().includes(lower) ||
        file.documentType.toLowerCase().includes(lower) ||
        (Array.isArray(file.owner) ? file.owner.some(o => o.toLowerCase().includes(lower)) : String(file.owner).toLowerCase().includes(lower)) ||
        file.departmentHead.toLowerCase().includes(lower) ||
        file.docID.toLowerCase().includes(lower)
      ));
    }

    // 2. Sidebar Filters
    if (selectedType.length > 0) current = current.filter(f => selectedType.includes(f.documentType));
    if (selectedDiscipline.length > 0) current = current.filter(f => selectedDiscipline.includes(f.discipline));
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(f.status));


    // 3. Excel Column Filters (Handles Dates & Status formatting internally via getFilterValuesForCell)
    // 3. Excel Column Filters
    for (const [colId, selectedValues] of Object.entries(columnFilters)) {
      // Direct array access (matches ControlAttributes.js)
      if (!selectedValues || !Array.isArray(selectedValues)) continue;

      current = current.filter(row => {
        const cellValues = getFilterValuesForCell(row, colId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    // 4. Viewer Only Restriction
    const isViewerOnly = canIn(access, "DMS", ["viewer"]) && !canIn(access, "DMS", ["systemAdmin", "contributor"]);
    if (isViewerOnly) {
      current = current.filter(f => f.status.toLowerCase() === "approved");
    }

    // 5. Sorting
    const colId = sortConfig?.colId || "reviewDate";
    const dir = sortConfig?.direction === "desc" ? -1 : 1;

    current.sort((a, b) => {
      let av, bv;

      if (colId === "uploader") {
        av = a.userID?.username || "";
        bv = b.userID?.username || "";
      } else if (colId === "owner") {
        // sort by first owner if array
        let rawA = a.owner; try { if (typeof rawA === 'string' && rawA.startsWith('[')) rawA = JSON.parse(rawA); } catch { }
        let rawB = b.owner; try { if (typeof rawB === 'string' && rawB.startsWith('[')) rawB = JSON.parse(rawB); } catch { }
        av = Array.isArray(rawA) ? rawA[0] : rawA;
        bv = Array.isArray(rawB) ? rawB[0] : rawB;
      } else {
        av = a[colId];
        bv = b[colId];
      }

      // Handle Date objects if sorting by date columns
      if (colId === "reviewDate" || colId === "uploadDate") {
        const da = new Date(av).getTime();
        const db = new Date(bv).getTime();
        return (da - db) * dir;
      }

      // Handle Strings
      const sa = String(av || "").toLowerCase();
      const sb = String(bv || "").toLowerCase();
      return sa.localeCompare(sb) * dir;
    });

    return current;
  }, [files, searchQuery, selectedType, selectedDiscipline, selectedStatus, columnFilters, sortConfig, access]);


  const overdueCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredFiles.filter(doc => {
      const d = new Date(doc.reviewDate);
      d.setHours(0, 0, 0, 0);
      return !isNaN(d) && d < today;
    }).length;
  }, [filteredFiles]);

  const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
  const filterMenuTimerRef = useRef(null);

  const hasActiveFilters = useMemo(() => {
    const hasColumnFilters = Object.keys(columnFilters).length > 0;
    // Assuming default sort is nr/asc. Change if your default differs.
    const hasSort = sortConfig.colId !== null || sortConfig.direction !== null;

    return hasColumnFilters || hasSort;
  }, [columnFilters, sortConfig]);

  const openFilterMenu = (e) => {
    if (!hasActiveFilters) return;
    if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterMenu({ isOpen: true, anchorRect: rect });
  };

  const closeFilterMenuWithDelay = () => {
    filterMenuTimerRef.current = setTimeout(() => {
      setFilterMenu(prev => ({ ...prev, isOpen: false }));
    }, 200);
  };

  const cancelCloseFilterMenu = () => {
    if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
  };

  const handleClearFilters = () => {
    setColumnFilters({});
    setSortConfig({ colId: null, direction: null });
    setFilterMenu({ isOpen: false, anchorRect: null });
  };

  const getFilterBtnClass = () => {
    return "top-right-button-control-att";
  };

  const getAvailableOptions = (colId) => {
    // Start with all files
    let filtered = files;

    // 1. Apply Global Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.fileName.toLowerCase().includes(lowerQ));
    }

    // --- NEW: Apply Sidebar Filters (So options match what is potentially visible) ---
    if (selectedType.length > 0) filtered = filtered.filter(f => selectedType.includes(f.documentType));
    if (selectedDiscipline.length > 0) filtered = filtered.filter(f => selectedDiscipline.includes(f.discipline));
    if (selectedStatus.length > 0) filtered = filtered.filter(f => selectedStatus.includes(f.status));
    // --------------------------------------------------------------------------------

    // 2. Apply filters from ALL OTHER active columns
    for (const [filterColId, selectedValues] of Object.entries(columnFilters)) {
      if (filterColId === colId) continue;
      if (!selectedValues || !Array.isArray(selectedValues)) continue;

      filtered = filtered.filter((row) => {
        const cellValues = getFilterValuesForCell(row, filterColId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    // 3. Extract unique values
    const uniqueValues = Array.from(
      new Set(filtered.flatMap((r) => getFilterValuesForCell(r, colId)))
    ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

    return uniqueValues;
  };

  useEffect(() => {
    console.log("fileIDs param changed:", fileIds);

    if (fileIds && fileIds !== "new") {
      setUpdateID(fileIds);
      setUpdate(true);
    } else {
      setUpdateID(null);
      setUpdate(false);
    }
  }, [fileIds]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-info-container" style={{ paddingLeft: "10px" }}>
      {upload && (<UploadPopup onClose={closeUpload} />)}
      {update && (<UpdateFileModal isModalOpen={update} closeModal={closeUpdate} fileID={updateID} />)}

      {isSidebarVisible ? (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
            <p className="logo-text-um">Document Management</p>
          </div>
          {!isTrashView && canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">
                {false && (
                  <button className="but-dm-fi" onClick={openUpload}>
                    <div className="button-content">
                      <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                      <span className="button-text">Upload Single Document</span>
                    </div>
                  </button>)}

                <button
                  className="but-dm-fi"
                  onClick={() => {
                    if (!isTrashView) toggleTrashView();
                  }}
                >
                  <div className="button-content">
                    <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                    <span className="button-text">Deleted Documents</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={isTrashView ? `${process.env.PUBLIC_URL}/trashIcon.svg` : `${process.env.PUBLIC_URL}/${iconMap[type] || `guidelinesDMSInverted.svg`}`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">
              {isTrashView
                ? getDeletedTitle()
                : type === "Policy"
                  ? "Policies"
                  : type === "Training"
                    ? "Training"
                    : `${type}s`}
            </p>
          </div>
        </div>
      ) : (
        <div className="sidebar-hidden">
          <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
            <FontAwesomeIcon icon={faCaretRight} />
          </div>
        </div>
      )}

      <div className="main-box-file-info">
        <div className="top-section-um">
          <div className="burger-menu-icon-um">
            <FontAwesomeIcon
              onClick={() => {
                if (isTrashView) {
                  toggleTrashView();
                } else {
                  navigate(-1);
                }
              }}
              icon={faArrowLeft}
              title="Back"
            />
          </div>
          {!isTrashView && canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
            <div className="burger-menu-icon-um">
              <FontAwesomeIcon icon={faFileCirclePlus} title="Upload Single Document" onClick={openUpload} />
            </div>
          )}

          {false && (<div className="burger-menu-icon-um">
            <span
              className="fa-layers fa-fw user-migrate-icon"
              onClick={openMigrate}
              title="Batch Migrate Documents"
            >
              <FontAwesomeIcon icon={faUser} transform="left-7 shrink-3" />
              <FontAwesomeIcon icon={faUser} transform="right-7 shrink-3" />

              {/* White outline */}
              <FontAwesomeIcon
                icon={faArrowRight}
                transform="shrink-7 down-1"
                style={{ color: "white" }}
              />

              {/* Arrow */}
              <FontAwesomeIcon
                icon={faArrowRight}
                transform="shrink-8 down-1"
              />
            </span>
          </div>)}

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

          <div className={isTrashView ? `info-box-fih trashed` : `info-box-fih`}>Number of Documents: {filteredFiles.length}</div>
          {!isTrashView && (
            <div className="info-box-fih">Review Overdue: {overdueCount}</div>
          )}

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          <TopBar />
        </div>
        {batch && (<BatchUpload onClose={closeBatch} />)}
        {isRDPopupOpen && (<ReviewDatePopup isOpen={isRDPopupOpen} onClose={closeRDPopup} onUpdate={setReviewDateVal} currVal={reviewDateVal} />)}

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">
              {isTrashView
                ? getDeletedTitle()
                : type === "Policy"
                  ? "Policies"
                  : type === "Training"
                    ? "Training"
                    : `${type}s`}
            </label>
            <button
              className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
              title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
              style={{
                cursor: hasActiveFilters ? "pointer" : "default",
                color: hasActiveFilters ? "#002060" : "gray",
                userSelect: "none"
              }}
              onMouseEnter={(e) => {
                if (hasActiveFilters) openFilterMenu(e);
              }}
              onMouseLeave={closeFilterMenuWithDelay}
              onDoubleClick={handleClearFilters}
            >
              <FontAwesomeIcon
                icon={faFilter}
                className="icon-um-search"
                style={{ color: hasActiveFilters ? "#002060" : "inherit" }}
              />
            </button>

            <button
              className={`${getFilterBtnClass()}-2`}
              title="Highlight Review Dates"
              onClick={openRDPopup}
              style={{
                cursor: "pointer",
                color: "#002060",
                userSelect: "none"
              }}
            >
              <FontAwesomeIcon
                icon={faClock}
                className="icon-um-search"
              />
            </button>
          </div>
          <div className="table-container-file">
            <table>
              <thead>
                <FilterFileName
                  access={access}
                  canIn={canIn}
                  onHeaderClick={openExcelFilterPopup}
                  sortConfig={sortConfig}
                  excelFilters={columnFilters}
                  trashed={isTrashView}
                  all={type === "All Document"}
                />
              </thead>
              <tbody>
                {isSwitchingView ? (
                  <tr>
                    <td
                      colSpan={
                        9 +
                        (type === "All Document" ? 1 : 0) +
                        (canIn(access, "DMS", ["systemAdmin", "contributor"]) ? 1 : 0) +
                        (canIn(access, "DMS", ["systemAdmin"]) ? 1 : 0)
                      }
                      className="col"
                      style={{
                        textAlign: "center",
                        padding: "18px",
                        fontStyle: "italic",
                        color: "#666"
                      }}
                    >
                      Loading documents...
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        9 +
                        (type === "All Document" ? 1 : 0) +
                        (canIn(access, "DMS", ["systemAdmin", "contributor"]) ? 1 : 0) +
                        (canIn(access, "DMS", ["systemAdmin"]) ? 1 : 0)
                      }
                      className="col"
                      style={{
                        textAlign: "center",
                        padding: "18px",
                        fontStyle: "italic",
                        color: "#666"
                      }}
                    >
                      {isTrashView ? `No deleted documents` : `No documents found`}
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file, index) => (
                    <tr key={file._id} className={`${isTrashView ? "tr-trash" : ""} file-info-row-height`}>
                      <td className="col">{index + 1}</td>
                      <td className="col">{file.discipline}</td>
                      <td
                        onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}
                        className="file-name-cell"
                      >
                        {removeFileExtension(file.fileName)}

                        {(hoveredFileId === file._id && !isTrashView) && (
                          <PopupMenu
                            file={file}
                            openUpdate={openUpdate}
                            openRenameModal={openRename}
                            handlePreview={handlePreview}
                            isActionAvailable={isActionAvailable}
                            isOpen={hoveredFileId === file._id}
                            openDownloadModal={openDownloadModal}
                            setHoveredFileId={setHoveredFileId}
                            canIn={canIn}
                            access={access}
                          />
                        )}
                      </td>
                      {type === "All Document" && (<td className="col">{file.documentType}</td>)}
                      {canIn(access, "DMS", ["systemAdmin", "contributor"]) && (
                        <td className={`col ${getStatusClass(file.status)}`}>{formatStatus(file.status)}</td>
                      )}
                      <td className="col">
                        {Array.isArray(file.owner)
                          ? file.owner[0]
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
                      <td className="col">{file.docID}</td>
                      <td className={`col ${getReviewClass(file.reviewDate)}`}>{formatDate(file.reviewDate)}</td>
                      <td className="col">
                        {file.userID?.username
                          ? (file.userID.username === "Willem"
                            ? file.userID.username + " Harmse"
                            : file.userID.username)
                          : ""}
                      </td>
                      <td className="col">{formatDate(file.uploadDate)}</td>
                      {canIn(access, "DMS", ["systemAdmin"]) && (
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
                              onClick={() => openRestoreModal(file._id, file.fileName)}
                            >
                              <FontAwesomeIcon icon={faRotate} title="Restore Document" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EXCEL FILTER POPUP (EXACT COPY OF STRUCTURE) --- */}
      {excelFilter.open && (
        <div
          className="excel-filter-popup"
          ref={excelPopupRef}
          style={{
            position: "fixed",
            top: excelFilter.pos.top,
            left: excelFilter.pos.left,
            width: excelFilter.pos.width,
            zIndex: 9999,
          }}
          onWheel={handleInnerScrollWheel}
        >
          <div className="excel-filter-sortbar">
            <button
              type="button"
              className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                sortConfig.direction === "asc" ? "active" : ""
                }`}
              onClick={() => toggleSort(excelFilter.colId, "asc")}
            >
              Sort Acsending
            </button>

            <button
              type="button"
              className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                sortConfig.direction === "desc" ? "active" : ""
                }`}
              onClick={() => toggleSort(excelFilter.colId, "desc")}
            >
              Sort Descending
            </button>
          </div>

          <input
            type="text"
            className="excel-filter-search"
            placeholder="Search"
            value={excelSearch}
            onChange={(e) => setExcelSearch(e.target.value)}
          />

          {(() => {
            const colId = excelFilter.colId;

            const allValues = getAvailableOptions(colId);

            const visibleValues = allValues.filter(v =>
              String(v).toLowerCase().includes(excelSearch.toLowerCase())
            );

            const isAllVisibleSelected =
              visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

            const toggleAll = (checked) => {
              setExcelSelected(prev => {
                const next = new Set(prev);
                if (checked) {
                  visibleValues.forEach(v => next.add(v));
                } else {
                  visibleValues.forEach(v => next.delete(v));
                }
                return next;
              });
            };

            const toggleValue = (v) => {
              setExcelSelected(prev => {
                const next = new Set(prev);
                if (next.has(v)) next.delete(v);
                else next.add(v);
                return next;
              });
            };

            const onOk = () => {
              let finalSelection = new Set(excelSelected);
              if (excelSearch.trim() !== "") {
                const visibleSet = new Set(visibleValues);
                finalSelection = new Set(
                  Array.from(excelSelected).filter(v => visibleSet.has(v))
                );
              }

              const selectedArr = Array.from(finalSelection);
              const isTotalReset = allValues.length > 0 &&
                allValues.length === selectedArr.length &&
                selectedArr.every(v => finalSelection.has(v));

              setColumnFilters(prev => {
                const next = { ...prev };
                if (isTotalReset) {
                  delete next[colId];
                } else {
                  next[colId] = selectedArr;
                }
                return next;
              });

              setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            };

            const onCancel = () => {
              setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            };

            return (
              <>
                <div className="excel-filter-list">
                  <label className="excel-filter-item">
                    <span className="excel-filter-checkbox">
                      <input
                        type="checkbox"
                        className="checkbox-excel-attend"
                        checked={isAllVisibleSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                    </span>
                    {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                  </label>

                  {visibleValues.map(v => (
                    <label className="excel-filter-item" key={String(v)}>
                      <span className="excel-filter-checkbox">
                        <input
                          type="checkbox"
                          className="checkbox-excel-attend"
                          checked={excelSelected.has(v)}
                          onChange={() => toggleValue(v)}
                        />
                      </span>
                      <span className="excel-filter-text">{v}</span>
                    </label>
                  ))}

                  {visibleValues.length === 0 && (
                    <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                      No matches found
                    </div>
                  )}
                </div>

                <div className="excel-filter-actions">
                  <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                  <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} deleteFileFromTrash={deleteFileFromTrash} isTrashView={isTrashView} loading={loading} selectedFileName={selectedFileName} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {isRestoreModalOpen && (<RestoreDocumentPopup closeModal={closeRestoreModal} restoreFile={restoreFile} selectedFileName={selectedFileName} loading={loading} />)}
      {migrate && (<MigrateOwnership onClose={closeMigrate} />)}
      <ToastContainer />
    </div >
  );
};

export default FileInfo;