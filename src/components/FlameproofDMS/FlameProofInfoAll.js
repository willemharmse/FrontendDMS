import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faColumns, faDownload, faEdit, faFileExport, faHardHat, faMagnifyingGlass, faTableList, faTrash, faFilter, faSortUp, faSortDown, faSpinner, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faX, faFileCirclePlus, faSearch, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SortPopup from "../FileInfo/SortPopup";
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import TopBar from "../Notifications/TopBar";
import "./FlameProofMain.css"
import UploadChoiceFPM from "./Popups/UploadChoiceFPM";
import UploadMasterPopup from "./Popups/UploadMasterPopup";
import UploadComponentPopup from "./Popups/UploadComponentPopup";
import RegisterAssetPopup from "./Popups/RegisterAssetPopup";
import DeleteAsset from "./Popups/DeleteAsset";
import SortPopupAsset from "./Popups/SortPopupAsset";
import TopBarFP from "./Popups/TopBarFP";
import ModifyAsset from "./Popups/ModifyAsset";
import ModifyAssetPopup from "./Popups/ModifyAssetPopup";
import ModifyComponentsPopup from "./Popups/ModifyComponentsPopup";
import PopupMenuOptionsAssets from "./Popups/PopupMenuOptionsAssets";
import { saveAs } from "file-saver";
import RestoreAsset from "./Popups/RestoreAsset";

const FlameProofInfoAll = () => {
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState(false);
  const [update, setUpdate] = useState(false);
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [popup, setPopup] = useState(null);
  const [uploadAssetNr, setUploadAssetNr] = useState("");
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [modifyingAsset, setModifyingAsset] = useState("");
  const [modifyAsset, setModifyAsset] = useState(false);
  const [modifyDate, setModifyDate] = useState(false);
  const [assetID, setAssetID] = useState(null);
  const [hoveredFileId, setHoveredFileId] = useState("");
  const [openComponentUpdate, setOpenComponentUpdate] = useState(false);
  const [componentAssetUpdate, setComponentAssetUpdate] = useState("");
  const [showNoAssets, setShowNoAssets] = useState(false);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [isTrashView, setIsTrashView] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreAssetData, setRestoreAssetData] = useState(null);

  const openRestoreModal = (asset) => {
    setRestoreAssetData(asset);
    setIsRestoreModalOpen(true);
  };

  const closeRestoreModal = () => {
    setRestoreAssetData(null);
    setIsRestoreModalOpen(false);
  };

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

  const exportSID = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproofExport/export-sid`,
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

  const openComponentModify = (asset) => {
    setComponentAssetUpdate(asset)
    setOpenComponentUpdate(true);
  };

  const closeComponentModify = () => {
    setComponentAssetUpdate("")
    setOpenComponentUpdate(false);
  };

  const openModify = (asset) => {
    setModifyingAsset(asset)
    setModifyAsset(true);
  };

  const closeModify = () => {
    setModifyingAsset("")
    setModifyAsset(false);
  };

  const closePopup = () => {
    setPopup(null);
  };

  const openUpload = () => {
    setUpload(true);
  };

  const closeUpload = (assetNr, id, nav) => {
    setUpload(!upload);
    if (nav) {
      navigate(`/FrontendDMS/flameManageSub/${assetNr}/${id}/new`)
    }
  };

  const openModifyDate = (asset) => {
    setAssetID(asset._id);
    setModifyDate(true);
  };

  const closeModifyDate = () => {
    setModifyDate(!modifyDate);
  };

  const openRegister = () => {
    setRegister(true);
  };

  const closeRegister = (id, type) => {
    setRegister(!register);
    navigate(`/FrontendDMS/flameproofComponents/${type}/${id}`)
  };

  const exitRegister = () => {
    setRegister(!register);
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

  useEffect(() => {
    if (token && hasRole(access, "FCMS")) {
      fetchFiles();
    }
  }, [token, isTrashView]);

  // put these above handleSort (inside component is fine)
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

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

  // put this near the top (outside component) or inside the component before usage
  const natCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const sortByAssetNr = (arr) =>
    [...arr].sort((a, b) => natCompare.compare(a.assetNr || '', b.assetNr || ''));

  // Fetch files from the API
  const fetchFiles = async () => {
    setIsLoadingTable(true);
    setFiles([]);
    setShowNoAssets(false);

    const normalRoute = `/api/flameproof/assets/all-sites`;
    const trashRoute = `/api/flameproof/assets/trash/all-sites`;

    const route = isTrashView ? trashRoute : normalRoute;

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const sortedFiles = sortByAssetNr(assets);

      setFiles(sortedFiles);

      const uniqueOpAreas = [...new Set(assets.map(file => file.operationalArea).filter(Boolean))].sort();
      const uniqueSites = [...new Set(assets.map(file => file.siteName).filter(Boolean))].sort();
      const uniqueTypes = [...new Set(assets.map(file => file.assetType).filter(Boolean))].sort();

      setAreas(uniqueOpAreas);
      setSites(uniqueSites);
      setAssetTypes(uniqueTypes);
    } catch (error) {
      setError(error.message);
      setFiles([]);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const deleteAsset = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproof/assets/${selectedFileId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete asset');
      setIsModalOpen(false);
      setSelectedFileId(null);
      setSelectedAsset(null);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreAsset = async (assetId) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproof/assets/trash/restore/${assetId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to restore asset");
      setIsRestoreModalOpen(false);
      setRestoreAssetData(null);
      fetchFiles();
    } catch (error) {
      console.error("Error restoring asset:", error);
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDeleteAsset = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproof/assets/${selectedFileId}/permanent`,
        {
          headers: { Authorization: `Bearer ${token}` },
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to permanently delete asset');
      setIsModalOpen(false);
      setSelectedFileId(null);
      setSelectedAsset(null);
      fetchFiles();
    } catch (error) {
      console.error('Error permanently deleting asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

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
  const formatDeletedDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-ZA");
  };

  const getDeletedByName = (row) => {
    return row?.deletedBy?.username || row?.deletedBy?.name || "";
  };

  const getFilterValuesForCell = (row, colId) => {
    let val;
    if (colId === "site") val = row.siteName;
    else if (colId === "assetType") val = row.assetType;
    else if (colId === "assetNr") val = row.assetNr;
    else if (colId === "area") val = row.operationalArea;
    else if (colId === "owner") val = row.assetOwner;
    else if (colId === "deptHead") val = row.departmentHead;
    else if (colId === "status") val = row.complianceStatus;
    else if (colId === "deletedBy") val = getDeletedByName(row);
    else if (colId === "dateDeleted") val = formatDeletedDate(row.deletedAt || row.dateDeleted);
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

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => {
        const deletedBy = getDeletedByName(file).toLowerCase();
        const deletedDate = formatDeletedDate(file.deletedAt || file.dateDeleted).toLowerCase();

        return (
          (file.siteName || "").toLowerCase().includes(q) ||
          (file.assetType || "").toLowerCase().includes(q) ||
          (file.assetNr || "").toLowerCase().includes(q) ||
          (file.operationalArea || "").toLowerCase().includes(q) ||
          (file.assetOwner || "").toLowerCase().includes(q) ||
          (!isTrashView && (file.departmentHead || "").toLowerCase().includes(q)) ||
          (!isTrashView && (file.complianceStatus || "").toLowerCase().includes(q)) ||
          (isTrashView && deletedBy.includes(q)) ||
          (isTrashView && deletedDate.includes(q))
        );
      });
    }

    // 2. Sidebar Filters
    if (selectedArea.length > 0) current = current.filter(f => selectedArea.includes(f.operationalArea));
    if (selectedAssetType.length > 0) current = current.filter(f => selectedAssetType.includes(f.assetType));
    if (selectedSite.length > 0) current = current.filter(f => selectedSite.includes(f.siteName));

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
    }

    return current;
  }, [files, searchQuery, selectedArea, selectedAssetType, selectedSite, filters, sortConfig]);

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

  const renderHeader = (colId, title, className) => {
    const isFiltered = Array.isArray(filters[colId]);
    const isSorted = sortConfig.colId === colId;

    return (
      <th className={`${className} cursor-pointer`} onClick={(e) => openExcelFilterPopup(colId, e)}>
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

  // Add this helper
  const getAvailableOptions = (colId) => {
    let current = files;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => {
        const deletedBy = getDeletedByName(file).toLowerCase();
        const deletedDate = formatDeletedDate(file.deletedAt || file.dateDeleted).toLowerCase();

        return (
          (file.siteName || "").toLowerCase().includes(q) ||
          (file.assetType || "").toLowerCase().includes(q) ||
          (file.assetNr || "").toLowerCase().includes(q) ||
          (file.operationalArea || "").toLowerCase().includes(q) ||
          (file.assetOwner || "").toLowerCase().includes(q) ||
          (!isTrashView && (file.departmentHead || "").toLowerCase().includes(q)) ||
          (!isTrashView && (file.complianceStatus || "").toLowerCase().includes(q)) ||
          (isTrashView && deletedBy.includes(q)) ||
          (isTrashView && deletedDate.includes(q))
        );
      });
    }

    // 2. Sidebar Filters
    if (selectedArea.length > 0) current = current.filter(f => selectedArea.includes(f.operationalArea));
    if (selectedAssetType.length > 0) current = current.filter(f => selectedAssetType.includes(f.assetType));
    if (selectedSite.length > 0) current = current.filter(f => selectedSite.includes(f.siteName));

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

  const getDeletedTitle = () => {
    return `Deleted Assets`;
  };

  const getMainTitle = () => {
    if (isTrashView) return getDeletedTitle();
    return `All Organisation Assets`;
  };

  const getAssetCountLabel = () => {
    if (isTrashView) return `Deleted Assets: ${filteredFiles.length}`;
    return `Number of Assets: ${filteredFiles.length}`;
  };

  const getFilterBtnClass = () => {
    return isTrashView ? "top-right-button-control-att" : "top-right-button-control-att-2";
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

          {!isTrashView && (<div className="filter-dm-fi-2">
            <div className="button-container-dm-fi">
              <button className="but-dm-fi" onClick={() => setIsTrashView(true)}>
                <div className="button-content">
                  <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                  <span className="button-text">Deleted Assets</span>
                </div>
              </button>
            </div>
          </div>)}

          {false && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">
                <button className="but-dm-fi">
                  <div className="button-content" onClick={openUpload}>
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Upload Single Certificate</span>
                  </div>
                </button>
                <button className="but-dm-fi" onClick={openRegister}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faTableList} className="button-logo-custom" />
                    <span className="button-text">Register Single Asset</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/allDocumentsDMS.svg`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{getMainTitle()}</p>
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
            <div className="burger-menu-icon-um">
              <FontAwesomeIcon
                onClick={() => {
                  if (isTrashView) setIsTrashView(false);
                  else navigate(-1);
                }}
                icon={faArrowLeft}
                title="Back"
              />
            </div>
          </div>
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <>
              <div className="burger-menu-icon-um">
                <FontAwesomeIcon icon={faFileCirclePlus} title="Upload Single Certificate" onClick={openUpload} />
              </div>

              <div className="burger-menu-icon-um">
                <FontAwesomeIcon icon={faTableList} title="Register Single Asset" onClick={openRegister} />
              </div>
            </>
          )}

          <div className="um-input-container">
            <input
              className="search-input-um"
              type="text"
              placeholder="Search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          <div className={isTrashView ? "info-box-fih trashed" : "info-box-fih"}>
            {getAssetCountLabel()}
          </div>

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          <TopBar />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">{getMainTitle()}</label>
            {!isTrashView && (<FontAwesomeIcon
              icon={faDownload}
              title="Export to Excel"
              className="top-right-button-control-att"
              onClick={exportSID}
            />)}

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
              <thead className={`${isTrashView ? "trashed" : ""}`}>
                <tr>
                  <th className="flame-num-filter col">Nr</th>
                  {renderHeader("site", "Site", "flame-all-site col")}
                  {renderHeader("assetType", "Asset Type", "flame-all-type col")}
                  {renderHeader("assetNr", "Asset Nr", "flame-all-ass-nr col")}
                  {renderHeader("area", "Area", "flame-all-area col")}
                  {renderHeader("owner", "Asset Owner", "flame-all-owner col")}

                  {!isTrashView ? (
                    <>
                      {renderHeader("deptHead", "Department Head", "flame-all-head")}
                      {renderHeader("status", "Compliance Status", "flame-all-status col")}
                    </>
                  ) : (
                    <>
                      {renderHeader("deletedBy", "Deleted By", "flame-all-head")}
                      {renderHeader("dateDeleted", "Date Deleted", "flame-all-status col")}
                    </>
                  )}

                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                    <th className="flame-all-act col" style={{ fontSize: "14px" }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: "center", padding: 20 }}
                    >
                      <FontAwesomeIcon icon={faSpinner} spin /> &nbsp;
                      {isTrashView ? "Loading deleted assets." : "Loading assets."}
                    </td>
                  </tr>
                )}
                {!isLoadingTable && showNoAssets && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: "center", padding: 20 }}
                    >
                      {isTrashView ? "No deleted assets found." : "No assets found."}
                    </td>
                  </tr>
                )}

                {filteredFiles.map((asset, index) => (
                  <tr key={index} style={{ fontSize: "14px", textAlign: "center", cursor: "pointer" }} className={`file-info-row-height`}
                    onClick={() => setHoveredFileId(hoveredFileId === asset._id ? null : asset._id)}>
                    <td className="col" style={{ textAlign: "center" }}>{index + 1}</td>
                    <td className="col" style={{ textAlign: "center" }}>{asset.siteName}</td>
                    <td
                      style={{ textAlign: "left", textAlign: "center" }}
                      className="col"
                    >
                      {(asset.assetType)}
                    </td>
                    <td className="col" style={{ textAlign: "center", position: "relative" }}
                    >
                      {asset.assetNr}

                      {!isTrashView && hoveredFileId === asset._id && (
                        <PopupMenuOptionsAssets file={asset} isOpen={hoveredFileId === asset._id} setHoveredFileId={setHoveredFileId} canIn={canIn} access={access} openModifyModal={openComponentModify} />
                      )}
                    </td>
                    <td className={`col`} style={{ textAlign: "center" }}>{(asset.operationalArea)}</td>
                    <td className="col" style={{ textAlign: "center" }}>{asset.assetOwner}</td>
                    {!isTrashView ? (
                      <>
                        <td className="col">{asset.departmentHead}</td>
                        <td className={`col ${getComplianceColor(asset.complianceStatus)}`}>
                          {asset.complianceStatus}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="col">{getDeletedByName(asset) || "—"}</td>
                        <td className="col">{formatDeletedDate(asset.deletedAt || asset.dateDeleted) || "—"}</td>
                      </>
                    )}
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                      <td className="col-act">
                        {!isTrashView ? (
                          <>
                            <button
                              className="flame-delete-button-fi col-but-res"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModify(asset);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} title="Modify Asset" />
                            </button>

                            <button
                              className="flame-delete-button-fi col-but"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(asset._id, asset);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} title="Delete Asset" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="flame-delete-button-fi col-but-res"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRestoreModal(asset);
                              }}
                            >
                              <FontAwesomeIcon icon={faArrowsRotate} title="Restore Asset" />
                            </button>

                            <button
                              className="flame-delete-button-fi col-but"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(asset._id, asset);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} title="Permanently Delete Asset" />
                            </button>
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

      {isModalOpen && (
        <DeleteAsset
          closeModal={closeModal}
          deleteAsset={isTrashView ? permanentlyDeleteAsset : deleteAsset}
          asset={selectedAsset}
          permanent={isTrashView}
        />
      )}

      {isRestoreModalOpen && (
        <RestoreAsset
          closeModal={closeRestoreModal}
          restoreAsset={() => restoreAsset(restoreAssetData._id)}
          asset={restoreAssetData}
        />
      )}
      {upload && (<UploadComponentPopup onClose={closeUpload} refresh={fetchFiles} />)}
      {register && (<RegisterAssetPopup onClose={closeRegister} refresh={fetchFiles} exit={exitRegister} />)}
      {modifyAsset && (<ModifyAssetPopup onClose={closeModify} asset={modifyingAsset} refresh={fetchFiles} />)}
      {openComponentUpdate && (<ModifyComponentsPopup asset={componentAssetUpdate} onClose={closeComponentModify} refresh={fetchFiles} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofInfoAll;