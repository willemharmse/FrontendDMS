import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash, faRotate, faX, faFileCirclePlus, faSearch, faArrowLeft, faSpinner, faDownload, faSort, faEdit, faFilter, faSortUp, faSortDown, faClock } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeletePopup from "../FileInfo/DeletePopup";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import "./FlameProofMain.css"
import UploadChoiceFPM from "./Popups/UploadChoiceFPM";
import UploadMasterPopup from "./Popups/UploadMasterPopup";
import UploadComponentPopup from "./Popups/UploadComponentPopup";
import RegisterAssetPopup from "./Popups/RegisterAssetPopup";
import PopupMenuOptions from "./Popups/PopupMenuOptions";
import UpdateCertificateModal from "./Popups/UpdateCertificateModal";
import SortPopupCertificates from "./Popups/SortPopupCertificates";
import TopBarFPC from "./Popups/TopBarFPC";
import DeleteCertificate from "./Popups/DeleteCertificate";
import ReplaceComponentPopup from "./WarehousePopups/ReplaceComponentPopup";
import { saveAs } from "file-saver";
import ModifyCertificateDetailsPopup from "./Popups/ModifyCertificateDetailsPopup";
import CertExpiryDatePopup from "./Popups/CertExpiryDatePopup";

const FlameProofSub = () => {
  const { type, assetId, certIDs } = useParams();
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileId, setDownloadFileId] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const [update, setUpdate] = useState(false);
  const navigate = useNavigate();
  const [updateID, setUpdateID] = useState(null);
  const [register, setRegister] = useState(false);
  const [popup, setPopup] = useState(null);
  const [uploadAssetNr, setUploadAssetNr] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [icon, setIcon] = useState("");
  const [versionIcon, setVersionIcon] = useState("");
  const [site, setSite] = useState("");
  const [assetType, setAssetType] = useState("");
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [showNoAssets, setShowNoAssets] = useState(false);
  const [types, setTypes] = useState([]);
  const [siteTitle, setSiteTitle] = useState("");
  const [selectedType, setSelectedType] = useState([]);
  const [replace, setReplace] = useState(false);
  const [replaceType, setReplaceType] = useState("");
  const [replaceComp, setReplaceComp] = useState("");
  const [replaceID, setReplaceID] = useState("");
  const [modifyData, setModifyData] = useState([]);
  const [modifyPopup, setModifyPopup] = useState(false);
  const [expiryDateVal, setExpiryDateVal] = useState(30);
  const [isExpiryPopupOpen, setIsExpiryPopupOpen] = useState(false);

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

  const openReplace = (assetType, component, id) => {
    setReplaceID(id);
    setReplaceType(assetType);
    setReplaceComp(component);
    setReplace(true);
  };

  const closeReplace = () => { setReplace(false); };

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getAssetSite/${assetId}`);
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setSite(data.site._id);
        setSiteTitle(data.site.site);
      } catch (error) { setError(error.message); }
    };
    fetchSite();
  }, []);

  const getReason = (status, file) => {
    switch ((status || "").toLowerCase()) {
      case "invalid":
        if (file.authInvalid) return "Certifier Credentials Invalid";
        if (file.authRemoved) return "Certifier Credentials Removed";
        return "Certificate Invalid";
      case "not uploaded": return "—";
      default: return "—";
    }
  };

  const exportSID = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproofExport/export-certificates/${assetId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Failed to generate document");
      let filename = response.headers.get("X-Export-Filename");
      if (!filename) {
        const cd = response.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i);
        if (match) filename = decodeURIComponent(match[1] || match[2]);
      }
      const documentName = "SID Document VN/A";
      if (!filename) filename = `${documentName}.xlsx`;
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (error) { console.error("Error generating document:", error); }
  };

  const openModify = (data) => { setModifyData(data); setModifyPopup(true) }
  const closeModify = () => { setModifyData([]); setModifyPopup(false) }
  const closePopup = () => { setPopup(null); }
  const openUpload = () => { setUpload(true); };
  const closeUpload = (assetNr, id, nav) => { setUpload(!upload); fetchFiles(); };
  const openUpdate = (fileID) => { setUpdateID(fileID); setUpdate(true); };
  const closeUpdate = () => { setUpdate(!update); navigate(`/FrontendDMS/flameManageSub/${type}/${assetId}/new`, { replace: true }); };
  const openRegister = () => { setRegister(true); };
  const closeRegister = () => { setRegister(!register); };
  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) { setToken(storedToken); jwtDecode(storedToken); getAssetIconSrc(); }
  }, [navigate, isTrashView]);

  useEffect(() => {
    if (token && hasRole(access, "DMS")) fetchFiles();
  }, [token]);

  useEffect(() => { fetchFiles(); }, [isTrashView]);

  useEffect(() => {
    const saved = localStorage.getItem("highlightCertExpiryDates");
    if (saved && !isNaN(saved) && Number(saved) > 0) {
      setExpiryDateVal(Number(saved));
    } else {
      localStorage.setItem("highlightCertExpiryDates", "30");
      setExpiryDateVal(30);
    }
  }, []);


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

  const deleteFileFromTrash = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/trash/delete/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` }, method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete file from trash');
      setIsModalOpen(false); setSelectedFileId(null); fetchFiles();
    } catch (error) { console.error('Error deleting file from trash:', error); }
    finally { setLoading(false); }
  };

  const replaceComponent = async (replacementID) => {
    if (!replaceType && !replaceComp) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/certificates/${replaceID}/${replacementID}/replace`, {
        headers: { Authorization: `Bearer ${token}` }, method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to delete file from trash');
      setReplace(false); setReplaceID(null); setReplaceType(""); setReplaceComp("");
      toast.dismiss(); toast.clearWaitingQueue();
      toast.success("Component Successfully moved from Digital Warehouse", { closeButton: true, autoClose: 2000, style: { textAlign: "center" } });
      fetchFiles();
    } catch (error) { console.error('Error deleting file from trash:', error); }
    finally { setLoading(false); }
  };

  const restoreFile = async (fileId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/trash/restore/${fileId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;
      if (!res.ok) {
        const msg = data?.error || data?.message || `Restore failed`;
        toast.dismiss(); toast.clearWaitingQueue();
        toast.error(msg, { closeButton: true, autoClose: 1500, style: { textAlign: "center" } });
        return;
      }
      const msg = data?.message || "Certificate restored successfully";
      toast.dismiss(); toast.clearWaitingQueue();
      toast.success(msg, { closeButton: true, autoClose: 1200, style: { textAlign: "center" } });
      fetchFiles();
    } catch (error) {
      toast.dismiss(); toast.clearWaitingQueue();
      toast.error(error.message || "Error restoring the file. Please try again.", { closeButton: true, autoClose: 1500, style: { textAlign: "center" } });
    }
  };

  const fetchFiles = async () => {
    setIsLoadingTable(true);

    // Clear existing files immediately when swapping views
    setFiles([]);
    setShowNoAssets(false);

    const route = isTrashView
      ? `/api/flameproof/trash/load`
      : `/api/flameproof/certificates/by-asset/${assetId}`;

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();

      let certificates = Array.isArray(data.certificates)
        ? data.certificates
        : [];

      // Only show applicable deleted certificates
      if (isTrashView) {
        certificates = certificates.filter(file => {
          const fileAssetId =
            file?.asset?._id ||
            file?.assetId;

          return String(fileAssetId) === String(assetId);
        });
      }

      const uniqueOpAreas = [...new Set(
        certificates
          .map(file => file?.asset?.operationalArea)
          .filter(Boolean)
      )].sort();

      const uniqueStatus = [...new Set(
        certificates
          .map(file => file?.status)
          .filter(Boolean)
      )].sort();

      const uniqueTypes = [...new Set(
        certificates
          .map(file => file?.asset?.assetType)
          .filter(Boolean)
      )].sort();

      setAreas(uniqueOpAreas);
      setStatus(uniqueStatus);
      setTypes(uniqueTypes);
      setFiles(certificates);

    } catch (error) {
      setError(error.message);
      setFiles([]);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const clearSearch = () => setSearchQuery("");

  const downloadFile = async (fileId, fileName) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/downloadCertificate/${fileId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download the file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) { console.error('Error downloading file:', error); alert('Error downloading the file. Please try again.'); }
    finally { setLoading(false); }
  };

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/delete/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` }, method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete the file');
      setIsModalOpen(false); setSelectedFileId(null); fetchFiles();
    } catch (error) { console.error('Error deleting file:', error); }
    finally { setLoading(false); }
  };

  const formatStatus = (type) => type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  // --- Excel Filter Logic ---
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

  const getFilterValuesForCell = (row, colId) => {
    let val;
    if (colId === "certNr") val = row.certNr;
    else if (colId === "assetType") val = row.asset.assetType;
    else if (colId === "owner") val = row.asset.assetOwner;
    else if (colId === "certAuth") val = row.certAuth;
    else if (colId === "component") val = formatStatus(row.component);
    else if (colId === "deptHead") val = row.asset.departmentHead;
    else if (colId === "status") val = formatStatus(row.status);
    else if (colId === "invalidReason") val = getReason(row.status, row);
    else if (colId === "issue") val = formatDate(row.issueDate);
    else if (colId === "expiry") val = formatDate(row.certificateExipryDate);
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
    const values = Array.from(new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId)))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

    const existing = filters?.[colId];
    const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);
    setExcelSelected(initialSelected);
    setExcelSearch("");
    setExcelFilter({
      open: true,
      colId,
      anchorRect: rect,
      pos: { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(220, rect.width) },
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
      e.preventDefault(); e.stopPropagation();
      if (goingDown && atBottom) el.scrollTop = scrollHeight - clientHeight;
      else if (!goingDown && atTop) el.scrollTop = 0;
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
    if (popupRect.bottom > viewportH - margin) { const anchor = excelFilter.anchorRect; if (anchor) newTop = Math.max(margin, anchor.top - popupRect.height - 4); }
    if (popupRect.right > viewportW - margin) { const overflow = popupRect.right - (viewportW - margin); newLeft = Math.max(margin, newLeft - overflow); }
    if (popupRect.left < margin) newLeft = margin;
    if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) { setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } })); }
  }, [excelFilter.open, excelFilter.pos.top, excelFilter.pos.left, excelFilter.anchorRect, excelSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (excelFilter.open && excelPopupRef.current && !excelPopupRef.current.contains(e.target)) { setExcelFilter(prev => ({ ...prev, open: false })); } };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [excelFilter.open]);

  // --- End Excel Logic ---

  const assetIconMap = { "all-assets": "/allDocumentsDMS.svg", "Continuous Miner": "/FCMS_CM2.png", "Shuttle Car": "/FCMS_SC2.png", "Roof Bolter": "/FCMS_RB2.png", "Feeder Breaker": "/FCMS_FB2.png", "Load Haul Dumper": "/FCMS_LHD2.png", "Tractor": "/FCMS_T2.png", }
  const versionAssetIconMap = { "all-assets": "allDocumentsDMS.svg", "Continuous Miner": "FCMS_CM2.png", "Shuttle Car": "FCMS_SC2.png", "Roof Bolter": "FCMS_RB2.png", "Feeder Breaker": "FCMS_FB2.png", "Load Haul Dumper": "FCMS_LHD2.png", "Tractor": "FCMS_T2.png", }
  const getAssetIconSrc = async () => {
    if (isTrashView) { setIcon(`${process.env.PUBLIC_URL}/trashIcon.svg`); return; }
    const route = `/api/flameproof/getAsset/${type}`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setAssetType(data.assets.assetType);
      const key = data.assets.assetType.replace(/\s+/g, " ");
      setIcon(`${process.env.PUBLIC_URL}/${assetIconMap[key]}` || `${process.env.PUBLIC_URL}/genericAssetType2.svg`);
      setVersionIcon(`${process.env.PUBLIC_URL}/${versionAssetIconMap[key]}` || `${process.env.PUBLIC_URL}/genericAssetType2.svg`);
    } catch (error) { setError(error.message); }
  };

  const toggleTrashView = () => { setIsTrashView(!isTrashView); };
  const openModal = (fileId, fileName) => { setSelectedFileId(fileId); setSelectedFileName(fileName); setIsModalOpen(true); };
  const closeModal = () => { setSelectedFileId(null); setSelectedFileName(null); setIsModalOpen(false); };
  const openDownloadModal = (fileId, fileName) => { setDownloadFileId(fileId); setDownloadFileName(fileName); setIsDownloadModalOpen(true); };
  const closeDownloadModal = () => { setDownloadFileId(null); setDownloadFileName(null); setIsDownloadModalOpen(false); };
  const confirmDownload = () => { if (downloadFileId && downloadFileName) downloadFile(downloadFileId, downloadFileName); closeDownloadModal(); };
  const getComplianceColor = (status) => { if (status === "valid") return "status-good"; if (status === "invalid") return "status-worst"; if (status === "not uploaded") return "status-missing" };
  const getExpiryClass = (expiryDate) => {
    if (!expiryDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const timeDiff = expiry - today;
    if (timeDiff < 0) return "review-past";
    if (timeDiff <= expiryDateVal * 24 * 60 * 60 * 1000) return "review-soon";
    return "review-ongoing";
  };


  const filteredFiles = useMemo(() => {
    let current = [...files];

    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (file.certNr || "").toLowerCase().includes(q));
    }

    // 2. Sidebar Filters
    const normStatus = (s) => (s || "").toLowerCase() === "missing" ? "not uploaded" : (s || "").toLowerCase();
    if (selectedArea.length > 0) current = current.filter(f => selectedArea.includes(f.asset.operationalArea));
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(normStatus(f.status)));
    if (selectedType.length > 0) current = current.filter(f => selectedType.includes(f.asset.assetType));

    // 3. Excel Column Filters
    for (const [colId, selectedValues] of Object.entries(filters)) {
      if (!selectedValues || !Array.isArray(selectedValues)) continue;
      current = current.filter(row => {
        const cellValues = getFilterValuesForCell(row, colId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    // 4. Sort (Excel Popup or Global Sort)
    if (sortConfig.colId) {
      const { colId, direction } = sortConfig;
      const dir = direction === 'desc' ? -1 : 1;
      current.sort((a, b) => {
        const av = getFilterValuesForCell(a, colId)[0];
        const bv = getFilterValuesForCell(b, colId)[0];
        return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) * dir;
      });
    } else {
      // Default sort if no column sort active
      if (!sortField) {
        const isMaster = (f) => { const c = (f.component || "").trim().toLowerCase(); return c === "master" || c === "master component"; };
        const statusPriority = (f) => (normStatus(f.status) === "not uploaded" ? 0 : 1);
        const componentPriority = (f) => (isMaster(f) ? 0 : 1);
        current.sort((a, b) => {
          const sp = statusPriority(a) - statusPriority(b);
          if (sp) return sp;
          const cp = componentPriority(a) - componentPriority(b);
          if (cp) return cp;
          const byComp = (a.component || "").localeCompare((b.component || ""), undefined, { numeric: true, sensitivity: "base" });
          if (byComp) return byComp;
          return (a.asset?.assetNr || "").localeCompare((b.asset?.assetNr || ""), undefined, { numeric: true, sensitivity: "base" });
        });
      }
    }

    return current;
  }, [files, searchQuery, selectedArea, selectedStatus, sortField, sortOrder, selectedType, filters, sortConfig]);

  const invalidCount = filteredFiles.filter(f => { const status = (f.status || "").toLowerCase(); return status === "invalid" || status === "not uploaded"; }).length;
  const validCount = filteredFiles.filter(f => { const status = (f.status || "").toLowerCase(); return status === "valid"; }).length;

  useEffect(() => {
    if (!isLoadingTable) {
      if (filteredFiles.length === 0) { const t = setTimeout(() => setShowNoAssets(true), 800); return () => clearTimeout(t); }
      setShowNoAssets(false);
    }
  }, [isLoadingTable, filteredFiles.length]);

  const renderHeader = (colId, title) => {
    const isFiltered = Array.isArray(filters[colId]);
    const isSorted = sortConfig.colId === colId;

    return (
      <th className={`flame-sub-${colId}-filter col cursor-pointer`} onClick={(e) => openExcelFilterPopup(colId, e)}>
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
    if (isTrashView) return "top-right-button-control-att";
    return "top-right-button-control-att-2";
  };

  const getAvailableOptions = (colId) => {
    let current = files;

    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (
        file.certNr.toLowerCase().includes(q)
      ));
    }

    // 3. Other Column Filters
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

  useEffect(() => {
    console.log("fileIDs param changed:", certIDs);

    if (certIDs && certIDs !== "new") {
      setUpdateID(certIDs);
      setUpdate(true);
    } else {
      setUpdateID(null);
      setUpdate(false);
    }
  }, [certIDs]);

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

          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2" >
              <div className="button-container-dm-fi">
                {false && (<button className="but-dm-fi" onClick={openUpload}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Upload Single Certificate</span>
                  </div>
                </button>)}

                <button className="but-dm-fi" onClick={() => setIsTrashView(true)}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                    <span className="button-text">Deleted Certificates</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={icon} className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{isTrashView ? `Deleted Certificates` : (type)}</p>
            {!isTrashView && (<p className="logo-text-dm-fi" style={{ marginTop: "0px" }}>{siteTitle}</p>)}
          </div>
        </div>
      )}
      {!isSidebarVisible && (<div className="sidebar-hidden"><div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}><FontAwesomeIcon icon={faCaretRight} /></div></div>)}

      <div className="main-box-file-info">
        <div className="top-section-um">
          <div className="burger-menu-icon-um"><FontAwesomeIcon onClick={() => { if (isTrashView) { setIsTrashView(false) } else { navigate(-1) } }} icon={faArrowLeft} title="Back" />
          </div>
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <>
              <div className="burger-menu-icon-um">
                <FontAwesomeIcon icon={faFileCirclePlus} title="Upload Single Certificate" onClick={openUpload} />
              </div>
            </>
          )}
          <div className="um-input-container">
            <input className="search-input-um" type="text" placeholder="Search Certificate Number" autoComplete="off" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>
          <div className={isTrashView ? `info-box-fih trashed` : `info-box-fih`}>{isTrashView ? `Deleted Certificates: ${validCount}` : `Valid Certificates: ${validCount}`}</div>
          {!isTrashView && (<div className={`info-box-fih ${invalidCount === 0 ? `no-invalid` : `trashed`}`} style={invalidCount === 0 ? { backgroundColor: '#002060' } : undefined}>Outstanding Certificates: {invalidCount}</div>)}
          <div className="spacer"></div>
          <TopBarFPC isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} toggleTrashView={toggleTrashView} isTrashView={isTrashView} canIn={canIn} access={access} openSort={openSortModal} />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">{isTrashView ? `Deleted Certificates` : (type)}</label>
            {!isTrashView && (<FontAwesomeIcon icon={faDownload} title="Export to Excel" className="top-right-button-control-att" onClick={exportSID} />)}
            <FontAwesomeIcon
              icon={faFilter}
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
            />
            <button
              className="top-right-button-control-att-3"
              title="Highlight Certificate Expiry Dates"
              onClick={() => setIsExpiryPopupOpen(true)}
              style={{ cursor: "pointer", color: "gray", userSelect: "none", background: "none", border: "none", fontSize: "25px" }}
            >
              <FontAwesomeIcon icon={faClock} />
            </button>
          </div>
          <div className="table-container-file-flameproof-all-assets">
            <table>
              <thead>
                <tr className={isTrashView ? 'trashed' : ""}>
                  <th className="flame-num-filter col" style={{ fontSize: "14px" }}>Nr</th>
                  {renderHeader("certNr", "Certificate Nr")}
                  {isTrashView && renderHeader("assetType", "Asset Type")}
                  {renderHeader("owner", "Asset Owner")}
                  {renderHeader("certAuth", "Certification Body")}
                  {renderHeader("component", "Component")}
                  {renderHeader("deptHead", "Department Head")}
                  {renderHeader("status", "Status")}
                  {renderHeader("invalidReason", "Invalidity Reason")}
                  {renderHeader("issue", "Issue Date")}
                  {!isTrashView && renderHeader("expiry", "Expiry Date")}
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<th className="flame-sub-act-filter col" style={{ fontSize: "14px" }}>Action</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (<tr><td colSpan={10 + (isTrashView ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)} style={{ textAlign: "center", padding: 20 }}><FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading certificates.</td></tr>)}
                {!isLoadingTable && showNoAssets && (<tr><td colSpan={10 + (isTrashView ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)} style={{ textAlign: "center", padding: 20 }}>No Certificates Uploaded.</td></tr>)}
                {filteredFiles.map((file, index) => (
                  <tr key={index} style={{ fontSize: "14px", cursor: file.isPlaceholder ? "default" : "pointer" }} className={`${file.isPlaceholder ? "tr-placeholder" : ""} file-info-row-height`} onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                    <td className="col">{index + 1}</td>
                    <td className="col" style={{ textAlign: "center", position: "relative" }}>{file.certNr}
                      {(hoveredFileId === file._id && !file.isPlaceholder) && (
                        <PopupMenuOptions file={file} openUpdate={openUpdate} isOpen={hoveredFileId === file._id} openDownloadModal={openDownloadModal} setHoveredFileId={setHoveredFileId} canIn={canIn} access={access} img={versionIcon} txt={type} openReplace={openReplace} />
                      )}</td>
                    {isTrashView && (<th className="col" style={{ fontWeight: "normal" }}>{file.asset.assetType}</th>)}
                    <td className="col">{file.asset.assetOwner}</td>
                    <td className={`col`}>{(file.certAuth)}</td>
                    <td className="col">{formatStatus(file.component)}</td>
                    <td className="col">{file.asset.departmentHead}</td>
                    <td className={`col ${getComplianceColor(file.status)}`}>{formatStatus(file.status)}</td>
                    <td className={`col`}>{getReason(file.status, file)}</td>
                    <td className={`col`}>{formatDate(file.issueDate)}</td>
                    {!isTrashView && (<td className={`col ${getExpiryClass(file.certificateExipryDate)}`}>{formatDate(file.certificateExipryDate)}</td>)}
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                      <td className={`col-act ${isTrashView ? "trashed" : ""}`}>
                        {isTrashView && (<button className={"delete-button-fi col-but-res trashed-color"} onClick={() => restoreFile(file._id)}><FontAwesomeIcon icon={faRotate} title="Restore Document" /></button>)}
                        {!file.isPlaceholder && (
                          <>
                            {!isTrashView && (<button className={`delete-button-fi col-but-res col-but ${isTrashView ? "trashed-color" : ""}`} onClick={(e) => { e.stopPropagation(); openModify(file); }}><FontAwesomeIcon icon={faEdit} title="Modify Component" /></button>)}
                            <button className={`delete-button-fi col-but ${isTrashView ? "trashed-color" : ""}`} onClick={(e) => { e.stopPropagation(); openModal(file._id, file.fileName); }}><FontAwesomeIcon icon={faTrash} title="Delete Document" /></button>
                          </>
                        )}
                      </td>
                    )}
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

      {isExpiryPopupOpen && (<CertExpiryDatePopup isOpen={isExpiryPopupOpen} onClose={() => setIsExpiryPopupOpen(false)} onUpdate={setExpiryDateVal} currVal={expiryDateVal} />)}
      {isModalOpen && (<DeleteCertificate closeModal={closeModal} deleteFile={deleteFile} isTrashView={isTrashView} loading={loading} selectedFileName={selectedFileName} deleteFileFromTrash={deleteFileFromTrash} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {upload && (<UploadComponentPopup onClose={closeUpload} refresh={fetchFiles} site={site} assetNumber={type} />)}
      {update && (<UpdateCertificateModal certificateID={updateID} closeModal={closeUpdate} isModalOpen={update} refresh={fetchFiles} />)}
      {replace && (<ReplaceComponentPopup onClose={closeReplace} isOpen={replace} assetType={replaceType} component={replaceComp} replaceComponent={replaceComponent} />)}
      {modifyPopup && (<ModifyCertificateDetailsPopup data={modifyData} onClose={closeModify} refresh={fetchFiles} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofSub;