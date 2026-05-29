import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faCirclePlus, faClipboardCheck, faDownload, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faRotate, faScaleBalanced, faTableList, faTrash, faTriangleExclamation, faFilter, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../../utils/auth";
import "../FlameProofMain.css"
import UploadComponentPopup from "../Popups/UploadComponentPopup";
import RegisterAssetPopup from "../Popups/RegisterAssetPopup";
import DeleteAsset from "../Popups/DeleteAsset";
import SortPopupAsset from "../Popups/SortPopupAsset";
import TopBarFP from "../Popups/TopBarFP";
import ModifyAssetPopup from "../Popups/ModifyAssetPopup";
import ModifyComponentsPopup from "../Popups/ModifyComponentsPopup";
import PopupMenuOptionsAssets from "../Popups/PopupMenuOptionsAssets";
import DownloadPopup from "../../FileInfo/DownloadPopup";
import { saveAs } from 'file-saver';
import TopBar from "../../Notifications/TopBar";
import MoveRepairedComponent from "../Popups/MoveRepairedComponent";
import NewComponentCertificateDigitalWarehouse from "../Popups/NewComponentCertificateDigitalWarehouse";
import MoveComponentWarehousePopup from "../WarehousePopups/MoveComponentWarehousePopup";

const DigitalWarehouseRemoved = () => {
  const { type, site } = useParams();
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [popup, setPopup] = useState(null);
  const [uploadAssetNr, setUploadAssetNr] = useState("");
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState([]);
  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [modifyingAsset, setModifyingAsset] = useState("");
  const [modifyAsset, setModifyAsset] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [showNoAssets, setShowNoAssets] = useState(false);
  const [modifyDate, setModifyDate] = useState(false);
  const [assetID, setAssetID] = useState(null);
  const [siteName, setSiteName] = useState("");
  const [openComponentUpdate, setOpenComponentUpdate] = useState(false);
  const [componentAssetUpdate, setComponentAssetUpdate] = useState("");
  const [assets, setAssets] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedAssetForComponent, setSelectedAssetForComponent] = useState("");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileId, setDownloadFileId] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState(null);
  const [showMovePopup, setShowMovePopup] = useState(false);
  const [selectedMoveFile, setSelectedMoveFile] = useState(null);
  const [selectedMoveSite, setSelectedMoveSite] = useState(null);
  const [showNew, setShowNew] = useState(false);

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

  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

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

  const openNew = () => {
    setShowMovePopup(false);
    setShowNew(true);
  }

  const openMoveModal = (file, site) => {
    setSelectedMoveFile(file);
    setSelectedMoveSite(site);
    setShowMovePopup(true);
  };

  const closeMoveModal = () => {
    setSelectedMoveFile(null);
    setSelectedMoveSite(null);
    setShowMovePopup(false);
  };

  const confirmDownload = () => {
    if (downloadFileId && downloadFileName) {
      downloadFile(downloadFileId, downloadFileName);
    }
    closeDownloadModal();
  };

  const formatDate = (dateString) => {
    if (dateString === null || !dateString) return "—"
    const date = new Date(dateString); // Convert to Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
    return `${year}-${month}-${day}`;
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/downloadCertificate/${fileId}`, {
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

  const moveNormal = async () => {
    if (!selectedMoveFile) return;

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_URL}/api/flameWarehouse/certificates/moveToWarehouseRepaired/${selectedMoveFile._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rollback failed");

      toast.success("Component moved to digital warehouse.", { autoClose: 1500, closeButton: false });

      closeMoveModal();
      fetchFiles();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportSID = async () => {
    try {
      let route = `/api/flameproofExport/export-warehouse-repairs`;
      const response = await fetch(
        `${process.env.REACT_APP_URL}${route}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

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
    } catch (error) {
      console.error("Error generating document:", error);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      const decodedToken = jwtDecode(storedToken);
    }
  }, [navigate]);

  useEffect(() => {
    if (token && hasRole(access, "FCMS")) {
      fetchFiles();
    }
  }, [token]);

  const deleteAsset = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof`, {
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
      setLoading(false);
    }
  };

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

  const getByPath = (obj, path) =>
    path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);

  const normalizeForSort = (raw) => {
    if (raw == null) return null;
    if (typeof raw === "number") return raw;

    const s = String(raw).trim();

    const pct = s.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
    if (pct) return parseFloat(pct[1]);

    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) return ts;

    return s.toLowerCase();
  };

  const makeComparator = (field, order) => (a, b) => {
    const av = normalizeForSort(getByPath(a, field));
    const bv = normalizeForSort(getByPath(b, field));
    const dir = order === "ascending" ? 1 : -1;

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;

    return collator.compare(String(av), String(bv)) * dir;
  };

  const handleSort = () => {
    setFiles((prev) => [...prev].sort(makeComparator(sortField, sortOrder)));
    closeSortModal();
  };

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    setError(null);

    const route = `/api/flameWarehouse/getComponentsReplaced`;

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`);

      if (!response.ok) {
        // clear stale UI state so it doesn't show old data
        setFiles([]);
        setAssets([]);
        setSites([]);

        // optional: read server message if it exists
        let msg = `Request failed (${response.status})`;
        try {
          const body = await response.json();
          msg = body?.error || body?.message || msg;
        } catch (_) { }

        throw new Error(msg);
      }

      const data = await response.json();

      const uniqueAssets = [...new Set(data.replacedDocuments.map(f => f.asset.assetNr))].sort();
      const uniqueSites = [...new Set(data.replacedDocuments.map(f => f.asset.site.site))].sort();

      setAssets(uniqueAssets);
      setSites(uniqueSites);
      setFiles(data.replacedDocuments || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const getSiteName = async () => {
    const route = `/api/flameproof/getSiteNameFromID/${site}`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setSiteName(data.siteName);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingTable(false);
    }
  }

  const clearSearch = () => {
    setSearchQuery("");
  };

  const iconMap = {
    "all-assets": "/allDocumentsDMS.svg",
    "Continuous Miner": "/FCMS_CM2.png",
    "Shuttle Car": "/FCMS_SC2.png",
    "Roof Bolter": "/FCMS_RB2.png",
    "Feeder Breaker": "/FCMS_FB2.png",
    "Load Haul Dumper": "/FCMS_LHD2.png",
    "Tractor": "/FCMS_T2.png",
  }

  const openModal = (fileId, asset) => {
    setSelectedFileId(fileId);
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFileId(null);
    setSelectedAsset(null);
    setIsModalOpen(false);
  };

  const getComplianceColor = (status) => {
    const value = parseInt(status.replace("%", ""), 10);
    let className = "";
    if (value === 100) return "status-good";
    if (value >= 80) return "status-bad";
    if (value < 79) return "status-worst";

    return className;
  };

  // --- Excel Filter Logic ---
  const BLANK = "(Blanks)";
  const getFilterValuesForCell = (row, colId) => {
    let val;
    if (colId === "component") val = row.component;
    else if (colId === "serial") val = row.serialNumber;
    else if (colId === "site") val = row.asset.site.site;
    else if (colId === "asset") val = row.asset.assetNr;
    else if (colId === "date") val = formatDate(row.warehouseReplaceDate);
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

    // 1. Search Query (Existing)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (
        file.component.toLowerCase().includes(q)
      ));
    }

    // 2. Sidebar Filters (Existing)
    if (selectedSite.length > 0) current = current.filter(f => selectedSite.includes(f.asset.site.site));
    if (selectedAssetForComponent.length > 0) current = current.filter(f => selectedAssetForComponent.includes(f.asset.assetNr));

    // 3. Excel Column Filters (New)
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
    }

    return current;
  }, [files, searchQuery, selectedSite, selectedAssetForComponent, filters, sortConfig]);

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

  const renderHeader = (colId, title) => {
    const isFiltered = Array.isArray(filters[colId]);
    const isSorted = sortConfig.colId === colId;

    return (
      <th className={`flame-${colId}-filter col cursor-pointer`} onClick={(e) => openExcelFilterPopup(colId, e)}>
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
    return "top-right-button-control-att-2";
  };

  const getAvailableOptions = (colId) => {
    let current = files;

    // 1. Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (file.component || "").toLowerCase().includes(q));
    }

    // 2. Sidebar Filters
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(f.status));
    if (selectedSite.length > 0) current = current.filter(f => selectedSite.includes(f.site?.site));

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

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/flameWarehouse2.svg`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{(`Components Awaiting Repair`)}</p>
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
            <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
          </div>

          <div className="um-input-container">
            <input
              className="search-input-um"
              type="text"
              placeholder="Search Components"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          <div className="spacer"></div>

          <TopBar />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">{"Components Awaiting Repair"}</label>
            <FontAwesomeIcon
              icon={faDownload}
              title="Export to Excel"
              className="top-right-button-control-att"
              onClick={exportSID}
            />
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
          </div>
          <div className="table-container-file-flameproof-all-assets">
            <table>
              <thead>
                <tr className="">
                  <th className="flame-num-filter col" style={{ width: "5%" }}>Nr</th>
                  {renderHeader("component", "Component Name")}
                  {renderHeader("serial", "Serial Number")}
                  {renderHeader("site", "Site")}
                  {renderHeader("asset", "Asset")}
                  {renderHeader("date", "Replacement Date")}
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<th className="flame-act-filter col" style={{ width: "5%" }}>Action</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading components.
                    </td>
                  </tr>
                )}

                {!isLoadingTable && showNoAssets && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      No Components Removed.
                    </td>
                  </tr>
                )}

                {filteredFiles.map((file, index) => (
                  <tr key={index} className={`file-info-row-height`} style={{ cursor: "pointer" }}>
                    <td className="col">{index + 1}</td>
                    <td className="col" style={{ textAlign: "center" }}>{file.component}</td>
                    <td className="file-name-cell" style={{ textAlign: "center" }}>{file.serialNumber || "-"}</td>
                    <td className="col">{file.asset.site.site}</td>
                    <td className={`col`}>{(file.asset.assetNr)}</td>
                    <td className="col">{formatDate(file.warehouseReplaceDate)}</td>
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<td className={"col-act"}>
                      <button
                        className={"flame-delete-button-fi col-but-res"}
                        onClick={() => openMoveModal(file, file.asset.site)}
                      >
                        <FontAwesomeIcon icon={faRotate} title="Move to Digital Warehouse" />
                      </button>
                      <button
                        className={"flame-delete-button-fi col-but-res"}
                        onClick={() => openDownloadModal(file._id, file.fileName)}
                      >
                        <FontAwesomeIcon icon={faDownload} title="Download Certificate" />
                      </button>
                    </td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showMovePopup && (<MoveRepairedComponent refresh={fetchFiles} closeModal={closeMoveModal} file={selectedMoveFile} moveNormal={moveNormal} newCertificate={openNew} />)}
      {showNew && (<MoveComponentWarehousePopup onClose={() => setShowNew(false)} data={selectedMoveFile} refresh={fetchFiles} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}

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

      <ToastContainer />
    </div >
  );
};

export default DigitalWarehouseRemoved;