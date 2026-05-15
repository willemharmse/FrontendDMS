import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faCirclePlus, faClipboardCheck, faDownload, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faScaleBalanced, faTableList, faTrash, faTriangleExclamation, faFilter, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, canIn } from "../../utils/auth";
import "./FlameProofMain.css"
import TopBarFP from "./Popups/TopBarFP";
import UploadCertifierLicense from "./Popups/UploadCertifierLicense";
import UpdateCertifierLicense from "./Popups/UpdateCertifierLicense";
import DownloadPopup from "../FileInfo/DownloadPopup";
import DeleteCertifiers from "./Popups/DeleteCertifiers";
import SortPopupCertifiers from "./Popups/SortPopupCertifiers";
import TopBarFPC from "./Popups/TopBarFPC";
import TopBarCertifiers from "./Popups/TopBarCertifiers";
import PopupMenuOptionsCertifier from "./CertifiersPages/PopupMenuOptionsCertifier";

const FlameProofCertifiers = () => {
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const navigate = useNavigate();
  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [showNoAssets, setShowNoAssets] = useState(false);
  const [modify, setModify] = useState(false);
  const [certifierEdit, setCertifierEdit] = useState("");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileId, setDownloadFileId] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [hoveredFileId, setHoveredFileId] = useState(null);

  // --- EXCEL FILTER STATE ---
  const excelPopupRef = useRef(null);
  const [excelFilter, setExcelFilter] = useState({
    open: false,
    colId: null,
    anchorRect: null,
    pos: { top: 0, left: 0, width: 0 }
  });
  const [excelSearch, setExcelSearch] = useState("");
  const [excelSelected, setExcelSelected] = useState(new Set());
  const [filters, setFilters] = useState({});
  const DEFAULT_SORT = { colId: null, direction: "asc" };
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

  const getComplianceColor = (status) => {
    if (status.toLowerCase() === "valid" || status.toLowerCase() === "accredited") return "status-good";
    if (status.toLowerCase() === "expired" || status.toLowerCase() === "invalid") return "status-worst";
    if (status.toLowerCase() === "not uploaded") return "status-missing"
  };

  const openModify = (certifier) => {
    setCertifierEdit(certifier)
    setModify(true);
  };

  const closeModify = () => {
    setCertifierEdit("")
    setModify(false);
    fetchFiles();
  };

  const openUpload = () => {
    setUpload(true);
  };

  const closeUpload = () => {
    setUpload(false);
    fetchFiles();
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

  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      const decodedToken = jwtDecode(storedToken);
    }
  }, [navigate]);

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

  const statusOrder = {
    "not uploaded": 1,
    "invalid": 2,
    "accredited": 3,
  };

  const defaultStatusSort = (arr) => {
    return [...arr].sort((a, b) => {
      const aStatus = (a.status || "").toLowerCase();
      const bStatus = (b.status || "").toLowerCase();
      const aRank = statusOrder[aStatus] || 99; // unknown statuses go last
      const bRank = statusOrder[bStatus] || 99;
      return aRank - bRank;
    });
  };

  const getByPath = (obj, path) =>
    path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);

  const normalizeForSort = (raw) => {
    if (raw == null) return null;
    if (typeof raw === "number") return raw;

    const s = String(raw).trim();

    // percentage like "85%" or "85.5%"
    const pct = s.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
    if (pct) return parseFloat(pct[1]);

    // ISO-ish date or parseable date -> timestamp
    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) return ts;

    return s.toLowerCase(); // plain string
  };

  const makeComparator = (field, order) => (a, b) => {
    const av = normalizeForSort(getByPath(a, field));
    const bv = normalizeForSort(getByPath(b, field));
    const dir = order === "ascending" ? 1 : -1;

    // null/undefined last
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    // numbers (includes percentages + dates)
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;

    // strings
    return collator.compare(String(av), String(bv)) * dir;
  };

  const handleSort = () => {
    setFiles((prev) => [...prev].sort(makeComparator(sortField, sortOrder)));
    closeSortModal();
  };

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    const route = isTrashView ? `/api/flameProofCertifiers/getDeletedCerts` : `/api/flameProofCertifiers/getCerts`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch files (${response.status})`);
      }

      const data = await response.json();

      const uniqueCertifiers = [...new Set(data.certifiers.map(file => file.authority))].sort();
      const uniqueStatus = [...new Set(data.certifiers.map(file => file.status))].sort();

      setAuthorities(uniqueCertifiers);
      setStatus(uniqueStatus);

      // Initial Sort
      const sortedCertifiers = defaultStatusSort(data.certifiers);

      setFiles(Array.isArray(sortedCertifiers) ? sortedCertifiers : []);
      setError(null);
    } catch (err) {
      setError(err?.message || "Network error");
      setShowNoAssets(false);
    } finally {
      setIsLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token, isTrashView]);

  const toggleTrashView = () => {
    setIsTrashView(!isTrashView);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const formatDate = (dateString) => {
    if (dateString === null || !dateString) return "—"
    const date = new Date(dateString); // Convert to Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
    return `${year}-${month}-${day}`;
  };

  // --- Excel Filter Logic ---
  const BLANK = "(Blanks)";
  const getFilterValuesForCell = (row, colId) => {
    let val;
    if (colId === "authority") val = row.authority;
    else if (colId === "licenseNumber") val = row.licenseNumber;
    else if (colId === "issue") val = formatDate(row.licenseIssueDate);
    else if (colId === "expiry") val = formatDate(row.licenseExpiryDate);
    else if (colId === "status") val = row.status;
    else val = row[colId];

    const s = val == null ? "" : String(val).trim();
    return s === "" ? [BLANK] : [s];
  };

  const toggleSort = (colId, direction) => {
    setSortConfig(prev => {
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

    // CHANGE: Access filters[colId] directly instead of filters[colId]?.selected
    const existing = filters?.[colId];
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
      if (goingDown && atBottom) el.scrollTop = scrollHeight - clientHeight;
      else if (!goingDown && atTop) el.scrollTop = 0;
      return;
    }
  };

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

    if (popupRect.bottom > viewportH - margin) {
      const anchor = excelFilter.anchorRect;
      if (anchor) newTop = Math.max(margin, anchor.top - popupRect.height - 4);
    }
    if (popupRect.right > viewportW - margin) {
      const overflow = popupRect.right - (viewportW - margin);
      newLeft = Math.max(margin, newLeft - overflow);
    }
    if (popupRect.left < margin) newLeft = margin;

    if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
      setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } }));
    }
  }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (excelFilter.open && excelPopupRef.current && !excelPopupRef.current.contains(e.target)) {
        setExcelFilter(prev => ({ ...prev, open: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [excelFilter.open]);

  // --- End Excel Logic ---

  const filteredFiles = useMemo(() => {
    let current = [...files];

    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (
        file.authority.toLowerCase().includes(q)
      ));
    }

    // 2. Sidebar Filters
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(f.status));
    if (selectedAuthority.length > 0) current = current.filter(f => selectedAuthority.includes(f.authority));

    // 3. Excel Column Filters
    for (const [colId, selectedValues] of Object.entries(filters)) {
      if (!selectedValues || !Array.isArray(selectedValues)) continue;
      current = current.filter(row => {
        const cellValues = getFilterValuesForCell(row, colId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    // 4. Sort
    if (sortConfig.colId) {
      const { colId, direction } = sortConfig;
      const dir = direction === 'desc' ? -1 : 1;
      current.sort((a, b) => {
        const av = getFilterValuesForCell(a, colId)[0];
        const bv = getFilterValuesForCell(b, colId)[0];
        return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) * dir;
      });
    } else {
      // Fallback to default sort if no column sort is active
      current = defaultStatusSort(current);
    }

    return current;
  }, [files, searchQuery, selectedStatus, selectedAuthority, filters, sortConfig]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!isLoadingTable) {
      if (filteredFiles.length === 0) {
        const t = setTimeout(() => setShowNoAssets(true), 800);
        return () => clearTimeout(t);
      }
      setShowNoAssets(false);
    }
  }, [isLoadingTable, filteredFiles.length]);

  const downloadFile = async (fileId, fileName) => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameProofCertifiers/downloadLicense/${fileId}`, {
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
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameProofCertifiers/delete/${selectedFileId}`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameProofCertifiers/trashDelete/${selectedFileId}`, {
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

  const restoreFile = async (fileId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_URL}/api/flameProofCertifiers/restore/${fileId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, },
        }
      );

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;
      console.log(data)

      if (!res.ok) {
        const msg = data?.error || data?.message || `Restore failed`;
        toast.dismiss();
        toast.clearWaitingQueue();
        toast.error(msg, {
          closeButton: true,
          autoClose: 1500,
          style: { textAlign: "center" },
        });
        return;
      }

      const msg = data?.message || "Certifier restored successfully";
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.success(msg, {
        closeButton: true,
        autoClose: 1200,
        style: { textAlign: "center" },
      });

      fetchFiles();
    } catch (error) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error(error.message || "Error restoring the certifier. Please try again.", {
        closeButton: true,
        autoClose: 1500,
        style: { textAlign: "center" },
      });
    }
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

  const { validCount, expiredCount, notUploadedCount, invalidCount } = useMemo(() => {
    const v = filteredFiles.filter(f => f.status.toLowerCase() === "valid" || f.status.toLowerCase() === "accredited").length;
    const e = filteredFiles.filter(f => f.status.toLowerCase() === "expired" || f.status.toLowerCase() === "invalid").length;
    const n = filteredFiles.filter(f => f.status.toLowerCase() === "not uploaded").length;
    return { validCount: v, expiredCount: e, notUploadedCount: n, invalidCount: e + n };
  }, [filteredFiles]);

  const renderHeader = (colId, title) => {
    const isFiltered = Array.isArray(filters[colId]);
    const isSorted = sortConfig.colId === colId;

    return (
      <th className={`flame-certification-${colId === "authority" ? "auth" : colId === "licenseNumber" ? "license-nr" : colId === "status" ? "status" : "license-date"}-filter col cursor-pointer`} onClick={(e) => openExcelFilterPopup(colId, e)}>
        <div className="fileinfo-container-filter">
          <span className="fileinfo-title-filter" style={{ cursor: 'pointer' }}>
            {title}
            {(isFiltered || isSorted) && (
              <span style={{ marginLeft: "10px", fontSize: "12px" }}>
                {(isFiltered || isSorted) && <FontAwesomeIcon icon={faFilter} style={{ marginRight: isSorted ? "4px" : "0", color: "white" }} />}
              </span>
            )}
          </span>
        </div>
      </th>
    );
  };

  const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
  const filterMenuTimerRef = useRef(null);

  const hasActiveFilters = useMemo(() => {
    const hasColumnFilters = Object.keys(filters).length > 0;
    // Assuming default sort is nr/asc. Change if your default differs.
    const hasSort = sortConfig.colId !== null
    return hasColumnFilters || hasSort;
  }, [filters, sortConfig]);

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
    setFilters({});
    setSortConfig({ colId: null, direction: "asc" });
    setFilterMenu({ isOpen: false, anchorRect: null });
  };

  const getFilterBtnClass = () => {
    return "top-right-button-ibra";
  };

  const getAvailableOptions = (colId) => {
    let current = files;

    // 1. Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => file.authority.toLowerCase().includes(q));
    }

    // 2. Sidebar Filters
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(f.status));
    if (selectedAuthority.length > 0) current = current.filter(f => selectedAuthority.includes(f.authority));

    // 3. Apply filters from OTHER columns
    for (const [filterColId, selectedValues] of Object.entries(filters)) {
      if (filterColId === colId) continue;
      if (!selectedValues || !Array.isArray(selectedValues)) continue;
      current = current.filter(row => {
        const cellValues = getFilterValuesForCell(row, filterColId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    return Array.from(
      new Set(current.flatMap(r => getFilterValuesForCell(r, colId)))
    ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
  };

  return (
    <div className="file-info-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
            <p className="logo-text-um">EPA Management</p>
          </div>

          <div className="filter-dm-fi">
            <p className="filter-text-dm-fi">Filter</p>
            <div className="button-container-dm-fi">
              <div className="fi-info-popup-page-select-container">
                <Select options={authorities.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedAuthority(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Certification Body"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={status.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Status"
                  classNamePrefix="sb" />
              </div>
            </div>
          </div>
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2" >
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={() => setIsTrashView(true)}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                    <span className="button-text">Deleted Certification Bodies</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          {false && !isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={openUpload}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Add Certification Body</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/certifier2.svg`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{(`Manage Certification Bodies`)}</p>
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

      <div className="main-box-file-info">
        <div className="top-section-um">
          <div className="burger-menu-icon-um">
            <FontAwesomeIcon onClick={() => {
              if (isTrashView) { setIsTrashView(false) } else {
                navigate(-1)
              }
            }
            } icon={faArrowLeft} title="Back" />
          </div>
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <>
              <div className="burger-menu-icon-um">
                <FontAwesomeIcon icon={faFileCirclePlus} title="Add Certification Body" onClick={openUpload} />
              </div>
            </>
          )}

          <div className="um-input-container">
            <input
              className="search-input-um"
              type="text"
              placeholder="Search Certification Body"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          {!isTrashView && (
            <>
              <div className={`info-box-fih`}>{`Valid Certificates: ${validCount}`}</div>
              <div className={`info-box-fih trashed`}>{`Invalid Certificates: ${invalidCount}`}</div>
            </>
          )}

          {isTrashView && (
            <>
              <div className={`info-box-fih trashed`}>{`Deleted Certification Bodies: ${filteredFiles.length}`}</div>
            </>
          )}

          <div className="spacer"></div>

          <TopBarCertifiers toggleTrashView={toggleTrashView} isTrashView={isTrashView} openSort={openSortModal} canIn={canIn} access={access} />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">Certification Bodies</label>
          </div>

          <button
            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
            style={{
              cursor: hasActiveFilters ? "pointer" : "default",
              color: hasActiveFilters ? "#002060" : "gray"
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
          <div className="table-container-file-flameproof-all-assets">
            <table>
              <thead>
                <tr className={isTrashView ? 'trashed' : ""}>
                  <th className="flame-certification-num-filter col">Nr</th>
                  {renderHeader("authority", "Certification Body")}
                  {renderHeader("licenseNumber", "Accreditation Number")}
                  {renderHeader("issue", "Initial Accreditation Date")}
                  {renderHeader("expiry", "Expiry Date")}
                  {renderHeader("status", "Status")}
                  <th className="flame-certification-act-filter col">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading Certification Bodies.
                    </td>
                  </tr>
                )}

                {!isLoadingTable && showNoAssets && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      No Certification Bodies Registered.
                    </td>
                  </tr>
                )}

                {filteredFiles.map((file, index) => (
                  <tr key={index} style={{ cursor: "pointer" }} className={`file-info-row-height`} onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                    <td className="col">{index + 1}</td>
                    <td className="col" style={{ textAlign: "center", position: "relative" }}>
                      {file.authority}
                      {(hoveredFileId === file._id && !file.isPlaceholder) && (
                        <PopupMenuOptionsCertifier file={file} isOpen={hoveredFileId === file._id} setHoveredFileId={setHoveredFileId} />
                      )}
                    </td>
                    <td className="file-name-cell" style={{ textAlign: "center" }}>{(file.licenseNumber)}</td>
                    <td className="col">{formatDate(file.licenseIssueDate)}</td>
                    <td className={`col`}>{formatDate(file.licenseExpiryDate)}</td>
                    <td className={`col ${getComplianceColor(file.status)}`}>{file.status}</td>
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<td className={"col-act"}>
                      {!isTrashView && (
                        <>
                          <button
                            className={"flame-delete-button-fi-new col-but-res"}
                            onClick={(e) => {
                              e.stopPropagation();         // ⛔ prevent row click
                              openModify(file);
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} title="Modify Certifier" />
                          </button>
                          {file.status.toLowerCase() !== "not uploaded" && (<button
                            className={"flame-delete-button-fi-new col-but-res"}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDownloadModal(file._id, file.fileName)
                            }}
                          >
                            <FontAwesomeIcon icon={faDownload} title="Download License" />
                          </button>)}
                          <button
                            className={"flame-delete-button-fi-new col-but"}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(file._id, file.authority);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} title="Delete Certifier" />
                          </button>
                        </>
                      )}
                      {isTrashView && (
                        <>
                          <button
                            className={"flame-delete-button-fi-new col-but-res"}
                            onClick={(e) => {
                              e.stopPropagation();         // ⛔ prevent row click
                              restoreFile(file._id);
                            }}
                          >
                            <FontAwesomeIcon icon={faArrowsRotate} title="Restore Certifier" />
                          </button>
                          <button
                            className={"flame-delete-button-fi-new col-but"}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(file._id, file.authority);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} title="Delete Certifier From Trash" />
                          </button>
                        </>
                      )}
                    </td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EXCEL FILTER POPUP (From IBRATable) --- */}
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
          onWheel={(e) => e.stopPropagation()}
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
                if (checked) visibleValues.forEach(v => next.add(v));
                else visibleValues.forEach(v => next.delete(v));
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

              setFilters(prev => {
                const next = { ...prev };
                if (isTotalReset) delete next[colId];
                else next[colId] = selectedArr;
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
                    <span className="excel-filter-text">
                      {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                    </span>
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

      {upload && (<UploadCertifierLicense onClose={closeUpload} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {modify && (<UpdateCertifierLicense onClose={closeModify} certifierData={certifierEdit} />)}
      {isModalOpen && (<DeleteCertifiers closeModal={closeModal} deleteFile={deleteFile} loading={loading} selectedFileName={selectedFileName} deleteFromTrash={deleteFileFromTrash} isTrashView={isTrashView} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofCertifiers;