import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faColumns, faDownload, faEdit, faSearch, faTrash, faWrench, faSort, faFilter, faSortUp, faSortDown, faSpinner, faX, faFileCirclePlus, faArrowLeft, faTableList, faRotate } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, canIn } from "../../utils/auth";
import "./FlameProofMain.css"
import DownloadPopup from "../FileInfo/DownloadPopup";
import UploadWarehouseComponentPopup from "./WarehousePopups/UploadWarehouseComponentPopup";
import DeleteWarehouse from "./WarehousePopups/DeleteWarehouse";
import SortPopupWarehouse from "./WarehousePopups/SortPopupWarehouse";
import BatchRegisterComponentsWarehouse from "./WarehousePopups/BatchRegisterComponentsWarehouse";
import TopBarDigitalWarehouse from "./WarehousePopups/TopBarDigitalWarehouse";
import UpdateWarehouseComponentPopup from "./WarehousePopups/UpdateWarehouseComponentPopup";
import RestoreDocumentPopup from "../FileInfo/RestoreDocumentPopup";
import { saveAs } from 'file-saver';

const FlameProofDigitalWarehouse = () => {
  const { site } = useParams();
  const [files, setFiles] = useState([]);
  const scrollerRef = React.useRef(null);
  const dragRef = React.useRef({ active: false, startX: 0, startScrollLeft: 0, hasDragged: false });
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
  const [batch, setBatch] = useState();
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [showNoAssets, setShowNoAssets] = useState(false);
  const [modify, setModify] = useState(false);
  const [certifierEdit, setCertifierEdit] = useState("");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFileId, setDownloadFileId] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState([]);
  const [uploadSite, setUploadSite] = useState("");
  const [siteName, setSiteName] = useState("");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);
  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

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
  const [filters, setFilters] = useState({}); // { colId: { selected: [...] } }

  const DEFAULT_SORT = { colId: null, direction: "asc" };
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

  useEffect(() => {
    if (site && site !== "digital-warehouse") {
      setUploadSite(site);
    }
  }, []);

  const getComplianceColor = (status) => {
    if (status.toLowerCase() === "valid") return "status-good";
    if (status.toLowerCase() === "invalid") return "status-worst";
    if (status.toLowerCase() === "not uploaded") return "status-missing"
  };

  const [isDraggingX, setIsDraggingX] = useState(false);
  const DRAG_THRESHOLD = 5;

  const isInteractive = (el) => !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');

  const onPointerDownX = (e) => {
    const el = scrollerRef.current;
    if (!el || isInteractive(e.target)) return;
    dragRef.current.active = true;
    dragRef.current.hasDragged = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
  };

  const onPointerMoveX = (e) => {
    const el = scrollerRef.current;
    if (!el || !dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.hasDragged) {
      if (Math.abs(dx) >= DRAG_THRESHOLD) {
        dragRef.current.hasDragged = true;
        setIsDraggingX(true);
        try { el.setPointerCapture?.(e.pointerId); } catch { }
      } else { return; }
    }
    el.scrollLeft = dragRef.current.startScrollLeft - dx;
    e.preventDefault();
  };

  const endDragX = (e) => {
    const el = scrollerRef.current;
    if (dragRef.current.active && dragRef.current.hasDragged && e?.pointerId != null) {
      try { el?.releasePointerCapture?.(e.pointerId); } catch { }
    }
    dragRef.current.active = false;
    dragRef.current.hasDragged = false;
    setIsDraggingX(false);
  };

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
      let route = site && site !== "digital-warehouse" ? `/api/flameproofExport/export-warehouse-site/${site}` : `/api/flameproofExport/export-warehouse`;
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
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

  const formatStatus = (type) => type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  const getFilterValuesForCell = (row, colId) => {
    let val;
    if (colId === "site") val = row.site?.site;
    else if (colId === "assetType") val = row.assetTypes; // Array handled by consumer if strict, but let's flatten
    else if (colId === "component") val = row.component;
    else if (colId === "serial") val = row.serialNumber;
    else if (colId === "certAuth") val = row.certAuth;
    else if (colId === "certNr") val = row.certNr;
    else if (colId === "status") val = formatStatus(row.status);
    else if (colId === "invalidReason") val = getReason(row.status, row);
    else if (colId === "issue") val = formatDate(row.issueDate);
    else if (colId === "expiry") val = formatDate(row.expiryDate);
    else val = row[colId];

    if (Array.isArray(val)) {
      return val.map(v => v ? String(v).trim() : BLANK);
    }
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

  const allColumns = [
    { id: "nr", title: "Nr" },
    ...(site === "digital-warehouse" ? [{ id: "site", title: "Site" }] : []),
    { id: "assetType", title: "Asset Type" },
    { id: "component", title: "Component Name" },
    { id: "serial", title: "Component Serial Number" },
    { id: "certAuth", title: "Certification Body" },
    { id: "certNr", title: "Certificate Nr" },
    { id: "status", title: "Certification Status" },
    { id: "invalidReason", title: "Invalidity Reason" },
    { id: "issue", title: "Certificate Issue Date" },
    { id: "expiry", title: "Certificate Expiry Date" },
  ];
  if (isTrashView) {
    allColumns.push({ id: "deletedBy", title: "Deleted By" });
    allColumns.push({ id: "deletedOn", title: "Deleted On" });
  }
  if (canIn(access, "FCMS", ["systemAdmin", "contributor"])) allColumns.push({ id: "action", title: "Action" });

  const baseColumnIds = (() => {
    const base = site === "digital-warehouse"
      ? ["nr", "site", "assetType", "component", "serial", "certAuth", "status", "invalidReason"]
      : ["nr", "assetType", "component", "serial", "certAuth", "status", "invalidReason"];
    if (isTrashView) { base.push("deletedBy"); base.push("deletedOn"); }
    if (canIn(access, "FCMS", ["systemAdmin", "contributor"])) base.push("action");
    return base;
  })();

  const [showColumns, setShowColumns] = useState(() => baseColumnIds);
  useEffect(() => { setShowColumns(baseColumnIds); }, [isTrashView]);
  const visibleColumns = allColumns.filter(c => showColumns.includes(c.id));
  const visibleCount = visibleColumns.length;
  const isWide = visibleCount > baseColumnIds.length;

  const toggleColumn = (id) => {
    setShowColumns(prev => (id === "nr" || id === "action") ? prev : (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));
  };
  const toggleAllColumns = (selectAll) => setShowColumns(selectAll ? allColumns.map(c => c.id) : baseColumnIds);
  const areAllSelected = () => allColumns.map(c => c.id).every(id => showColumns.includes(id));

  const openModify = (certifier) => { setCertifierEdit(certifier); setModify(true); };
  const closeModify = () => { setCertifierEdit(""); setModify(false); fetchFiles(); };
  const openBatch = () => setBatch(true);
  const closeBatch = () => { setBatch(false); fetchFiles(); };
  const openUpload = () => setUpload(true);
  const closeUpload = () => { setUpload(false); fetchFiles(); };
  const openModal = (fileId, fileName) => { setSelectedFileId(fileId); setSelectedFileName(fileName); setIsModalOpen(true); };
  const closeModal = () => { setSelectedFileId(null); setSelectedFileName(null); setIsModalOpen(false); };
  const openRestoreModal = (fileId, fileName) => { setSelectedFileId(fileId); setSelectedFileName(fileName); setIsRestoreModalOpen(true); };
  const closeRestoreModal = () => { setSelectedFileId(null); setSelectedFileName(null); setIsRestoreModalOpen(false); };
  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) { setToken(storedToken); jwtDecode(storedToken); }
  }, [navigate]);

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const getByPath = (obj, path) => path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
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
    let route;
    if (isTrashView) {
      route = site === "digital-warehouse"
        ? `/api/flameWarehouse/getDeletedWarehouseDocs`
        : `/api/flameWarehouse/getDeletedWarehouseDocsSite/${site}`;
    } else {
      route = site === "digital-warehouse"
        ? `/api/flameWarehouse/getWarehouseDocs`
        : `/api/flameWarehouse/getWarehouseDocsSite/${site}`;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
      if (!response.ok) throw new Error(`Failed to fetch files (${response.status})`);
      const data = await response.json();
      const uniqueCertifiers = [...new Set(data.warehouseDocuments.map(file => file.certAuth))].sort();
      const uniqueStatus = [...new Set(data.warehouseDocuments.map(file => file.status))].sort();
      const uniqueAssetTypes = [...new Set(data.warehouseDocuments.flatMap(file => file.assetTypes || []).map(type => type?.trim()).filter(Boolean))].sort();
      const uniqueSite = [...new Set(data.warehouseDocuments.map(file => file.site?.site).filter(Boolean))].sort();
      setStatus(uniqueStatus);
      setAuthorities(uniqueCertifiers);
      setAssetTypes(uniqueAssetTypes);
      setSites(uniqueSite);
      setFiles(data.warehouseDocuments);
      setError(null);
    } catch (err) { setError(err?.message || "Network error"); setShowNoAssets(false); }
    finally { setIsLoadingTable(false); }
  };

  useEffect(() => { fetchFiles(); }, [token]);
  useEffect(() => { fetchFiles(); }, [isTrashView]);
  const clearSearch = () => setSearchQuery("");
  const asArray = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);
  const str = (s) => (s ?? "").toString().toLowerCase();
  const someIn = (needles, haystackArr) => {
    if (!needles?.length) return true;
    const hay = asArray(haystackArr).map(str);
    return needles.map(str).some(n => hay.includes(n));
  };

  const filteredFiles = useMemo(() => {
    let current = [...files];

    // 1. Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      current = current.filter(file => (file.component || "").toLowerCase().includes(q));
    }

    // 2. Sidebar Filters
    if (selectedStatus.length > 0) current = current.filter(f => selectedStatus.includes(f.status));
    if (selectedAuthority.length > 0) current = current.filter(f => selectedAuthority.includes(f.certAuth));
    if (selectedAssetType.length > 0) current = current.filter(f => someIn(selectedAssetType, f.assetTypes));
    if (selectedSite.length > 0) current = current.filter(f => selectedSite.includes(f.site?.site));

    // 3. Excel Column Filters
    for (const [colId, selectedValues] of Object.entries(filters)) {
      if (!selectedValues || !Array.isArray(selectedValues)) continue;
      current = current.filter(row => {
        const cellValues = getFilterValuesForCell(row, colId);
        return cellValues.some(v => selectedValues.includes(v));
      });
    }

    // 4. Sorting (Excel Popup Sort)
    if (sortConfig.colId) {
      const { colId, direction } = sortConfig;
      const dir = direction === 'desc' ? -1 : 1;
      current.sort((a, b) => {
        const av = getFilterValuesForCell(a, colId)[0];
        const bv = getFilterValuesForCell(b, colId)[0];
        // Simple string compare for now, as getFilterValues returns strings
        return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) * dir;
      });
    }

    return current;
  }, [files, searchQuery, selectedStatus, selectedAuthority, selectedAssetType, selectedSite, filters, sortConfig]);


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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/downloadCertificate/${fileId}`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/softDeleteCertificate/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to delete the file');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { console.error('Error deleting file:', error); }
    finally { setLoading(false); }
  };

  const deleteFileFromTrash = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/delete/${selectedFileId}`, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to permanently delete the file');
      setIsModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { console.error('Error permanently deleting file:', error); }
    finally { setLoading(false); }
  };

  const restoreFile = async () => {
    if (!selectedFileId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/restoreCertificate/${selectedFileId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to restore');
      setIsRestoreModalOpen(false);
      setSelectedFileId(null);
      fetchFiles();
    } catch (error) { alert('Error restoring the component.'); }
  };

  const toggleTrashView = () => {
    setFiles([]);
    setIsTrashView(prev => !prev);
  };

  const openDownloadModal = (fileId, fileName) => { setDownloadFileId(fileId); setDownloadFileName(fileName); setIsDownloadModalOpen(true); };
  const closeDownloadModal = () => { setDownloadFileId(null); setDownloadFileName(null); setIsDownloadModalOpen(false); };
  const confirmDownload = () => { if (downloadFileId && downloadFileName) downloadFile(downloadFileId, downloadFileName); closeDownloadModal(); };

  const { validCount, expiredCount, notUploadedCount, invalidCount } = useMemo(() => {
    const v = filteredFiles.filter(f => f.status.toLowerCase() === "valid").length;
    const e = filteredFiles.filter(f => f.status.toLowerCase() === "invalid").length;
    const n = filteredFiles.filter(f => f.status.toLowerCase() === "not uploaded").length;
    return { validCount: v, expiredCount: e, notUploadedCount: n, invalidCount: e + n };
  }, [filteredFiles]);

  useEffect(() => {
    const getSiteName = async () => {
      if (!site || site === "digital-warehouse") { setSiteName(""); return; }
      const route = `/api/flameproof/getSiteNameFromID/${site}`;
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {});
        if (!response.ok) throw new Error('Failed to fetch files');
        const data = await response.json();
        setSiteName(data.siteName);
      } catch (error) { setError(error.message); }
      finally { setIsLoadingTable(false); }
    }
    getSiteName();
  }, [site]);

  // Helper for Headers
  const renderHeader = (colId, title) => {
    const isFiltered = Array.isArray(filters[colId]);
    const isSorted = sortConfig.colId === colId;

    return (
      <th className={`flame-warehouse-${colId}-filter col cursor-pointer`} onClick={(e) => openExcelFilterPopup(colId, e)}>
        <div className="fileinfo-container-filter">
          <span className="fileinfo-title-filter" style={{ cursor: 'pointer' }}>
            {title}
            {(isFiltered || isSorted) && (
              <span style={{ marginLeft: "10px", fontSize: "12px" }}>
                {<FontAwesomeIcon icon={faFilter} style={{ marginRight: isSorted ? "4px" : "0", color: "white" }} />}
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
    return "top-right-button-control-att-4";
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
    if (selectedAuthority.length > 0) current = current.filter(f => selectedAuthority.includes(f.certAuth));
    if (selectedAssetType.length > 0) current = current.filter(f => someIn(selectedAssetType, f.assetTypes));
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
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">

                <button
                  className="but-dm-fi"
                  onClick={() => {
                    if (!isTrashView) toggleTrashView();
                  }}
                >
                  <div className="button-content">
                    <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                    <span className="button-text">Deleted Components</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/flameWarehouse2.svg`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{(`Digital Warehouse`)}</p>
            {site !== "digital-warehouse" && (<p className="logo-text-dm-fi" style={{ marginTop: "0px" }}>{siteName}</p>)}
          </div>
        </div>
      )}
      {!isSidebarVisible && (<div className="sidebar-hidden"><div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}><FontAwesomeIcon icon={faCaretRight} /></div></div>)}

      <div className="main-box-file-info">
        <div className="top-section-um">
          <div className="burger-menu-icon-um"><FontAwesomeIcon onClick={() => { if (isTrashView) toggleTrashView(); else navigate(-1) }} icon={faArrowLeft} title="Back" /></div>
          {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <>
              {!isTrashView && (<div className="burger-menu-icon-um"><FontAwesomeIcon onClick={openUpload} icon={faFileCirclePlus} title="Register Component" /></div>)}
              {!isTrashView && (<div className="burger-menu-icon-um"><FontAwesomeIcon onClick={openBatch} icon={faTableList} title="Batch Register Components" /></div>)}
            </>
          )}
          <div className="um-input-container">
            <input className="search-input-um" type="text" placeholder="Search Components" autoComplete="off" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>
          {!isTrashView && (<>          <div className={`info-box-fih`}>{`Valid Components: ${validCount}`}</div>
            <div className={`info-box-fih trashed`}>{`Invalid Components: ${invalidCount}`}</div></>)}
          <div className="spacer"></div>
          <TopBarDigitalWarehouse openSort={openSortModal} />
        </div>

        <div className="table-flameproof-card">
          <div className={`flameproof-table-header-label-wrapper`}>
            <label className="risk-control-label">{isTrashView ? "Deleted Components" : "Digital Warehouse"}</label>
            <FontAwesomeIcon icon={faColumns} title="Select Columns to Display" className="top-right-button-control-att-3" onClick={() => setShowColumnSelector(v => !v)} />
            <FontAwesomeIcon icon={faDownload} title="Export to Excel" className="top-right-button-control-att-2" onClick={exportSID} />
            <FontAwesomeIcon icon={faWrench} title="View Components Awaiting Repair" className="top-right-button-control-att" onClick={() => navigate("/FrontendDMS/flameReplacedComponents")} />

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

            {showColumnSelector && (
              <div className="column-selector-popup" onMouseDown={(e) => e.stopPropagation()}>
                <div className="column-selector-header"><h4>Select Columns</h4><button className="close-popup-btn" onClick={() => setShowColumnSelector(false)}>×</button></div>
                <div className="column-selector-content">
                  <p className="column-selector-note">Select columns to display</p>
                  <div className="select-all-container"><label className="select-all-checkbox"><input type="checkbox" checked={areAllSelected()} onChange={(e) => toggleAllColumns(e.target.checked)} /><span className="select-all-text">Select All</span></label></div>
                  <div className="column-checkbox-container">
                    {allColumns.map(col => (
                      <div className="column-checkbox-item" key={col.id}>
                        <label><input type="checkbox" checked={showColumns.includes(col.id)} disabled={col.id === "nr" || col.id === "action"} onChange={() => toggleColumn(col.id)} /><span>{col.title}</span></label>
                      </div>
                    ))}
                  </div>
                  <div className="column-selector-footer"><p>{visibleCount} columns selected</p><button className="apply-columns-btn" onClick={() => setShowColumnSelector(false)}>Apply</button></div>
                </div>
              </div>
            )}
          </div>

          <div className="table-container-file-flameproof-all-assets">
            <div className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? "wide" : ""}`} ref={scrollerRef} onPointerDown={onPointerDownX} onPointerMove={onPointerMoveX} onPointerUp={endDragX} onPointerLeave={endDragX} onDragStart={(e) => e.preventDefault()} style={{ maxHeight: "calc(100% - 5px)" }}>
              <table className={`limit-table-height-warehouse ${isWide ? "wide" : ""}`}>
                <thead>
                  <tr className={isTrashView ? "trashed" : ""}>
                    {showColumns.includes("nr") && (<th className="flame-warehouse-num-filter col"><span className="fileinfo-title-filter-1">Nr</span></th>)}
                    {site === "digital-warehouse" && showColumns.includes("site") && renderHeader("site", "Site")}
                    {showColumns.includes("assetType") && renderHeader("assetType", "Asset Type")}
                    {showColumns.includes("component") && renderHeader("component", "Component Name")}
                    {showColumns.includes("serial") && renderHeader("serial", "Component Serial Number")}
                    {showColumns.includes("certAuth") && renderHeader("certAuth", "Certification Body")}
                    {showColumns.includes("certNr") && renderHeader("certNr", "Certificate Nr")}
                    {showColumns.includes("status") && renderHeader("status", "Certification Status")}
                    {showColumns.includes("invalidReason") && (<th className="flame-warehouse-status-filter col"><div className="fileinfo-container-filter"><span className="fileinfo-title-filter" title="Invalidity Reason">Invalidity Reason</span></div></th>)}
                    {showColumns.includes("issue") && renderHeader("issue", "Certificate Issue Date")}
                    {showColumns.includes("expiry") && renderHeader("expiry", "Certificate Expiry Date")}
                    {isTrashView && showColumns.includes("deletedBy") && (<th className="flame-warehouse-status-filter col"><div className="fileinfo-container-filter"><span className="fileinfo-title-filter">Deleted By</span></div></th>)}
                    {isTrashView && showColumns.includes("deletedOn") && (<th className="flame-warehouse-status-filter col"><div className="fileinfo-container-filter"><span className="fileinfo-title-filter">Deleted On</span></div></th>)}
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && showColumns.includes("action") && (<th className={`flame-warehouse-act-filter col${isTrashView ? " trashed" : ""}`}><span className="fileinfo-title-filter-1">Action</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTable && (<tr><td colSpan={visibleCount} style={{ textAlign: "center", padding: 20 }}><FontAwesomeIcon icon={faSpinner} spin /> &nbsp; {isTrashView ? "Loading Deleted Components." : "Loading Digital Warehouse."}</td></tr>)}
                  {!isLoadingTable && showNoAssets && (<tr><td colSpan={visibleCount} style={{ textAlign: "center", padding: 20 }}>{isTrashView ? "No Deleted Components." : "No Components in Digital Warehouse."}</td></tr>)}
                  {filteredFiles.map((file, index) => (
                    <tr key={index} className="file-info-row-height">
                      {showColumns.includes("nr") && (<td className="col">{index + 1}</td>)}
                      {site === "digital-warehouse" && showColumns.includes("site") && (<td className="col" style={{ textAlign: "center" }}>{file.site?.site || "-"}</td>)}
                      {showColumns.includes("assetType") && (<td className="col" style={{ textAlign: "center" }}>{file.assetTypes && file.assetTypes.length > 0 ? file.assetTypes.map((item, i) => (<React.Fragment key={i}>{item}<br /></React.Fragment>)) : "-"}</td>)}
                      {showColumns.includes("component") && (<td className="col">{file.component || "-"}</td>)}
                      {showColumns.includes("serial") && (<td className="col">{file.serialNumber || "-"}</td>)}
                      {showColumns.includes("certAuth") && (<td className="col">{file.certAuth || "-"}</td>)}
                      {showColumns.includes("certNr") && (<td className="col">{file.certNr || "-"}</td>)}
                      {showColumns.includes("status") && (<td className={`col ${getComplianceColor(file.status)}`}>{formatStatus(file.status)}</td>)}
                      {showColumns.includes("invalidReason") && (<td className="col">{getReason(file.status, file)}</td>)}
                      {showColumns.includes("issue") && (<td className="col">{formatDate(file.issueDate)}</td>)}
                      {showColumns.includes("expiry") && (<td className="col">{formatDate(file.expiryDate)}</td>)}
                      {isTrashView && showColumns.includes("deletedBy") && (<td className="col">{file.deletedBy?.username || "-"}</td>)}
                      {isTrashView && showColumns.includes("deletedOn") && (<td className="col">{formatDate(file.deletedOn)}</td>)}
                      {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && showColumns.includes("action") && (
                        <td className={"col-act"}>
                          {!isTrashView && file.status.toLowerCase() !== "not uploaded" && (<button className="flame-delete-button-fi-new col-but-res" onClick={(e) => { e.stopPropagation(); openDownloadModal(file._id, file.fileName); }}><FontAwesomeIcon icon={faDownload} title="Download Certificate" /></button>)}
                          {!isTrashView && (<button className="flame-delete-button-fi-new col-but-res" onClick={(e) => { e.stopPropagation(); openModify(file); }}><FontAwesomeIcon icon={faEdit} title="Modify Component" /></button>)}
                          <button
                            className={"flame-delete-button-fi-new col-but"}
                            onClick={(e) => { e.stopPropagation(); openModal(file._id, file.component); }}
                          >
                            <FontAwesomeIcon icon={faTrash} title={isTrashView ? "Permanently Delete Component" : "Delete Component"} />
                          </button>
                          {isTrashView && (
                            <button
                              className="flame-delete-button-fi-new col-but-res"
                              onClick={(e) => { e.stopPropagation(); openRestoreModal(file._id, file.component); }}
                            >
                              <FontAwesomeIcon icon={faRotate} title="Restore Component" />
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

      {isSortModalOpen && (<SortPopupWarehouse closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} assetType={false} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {modify && (<UpdateWarehouseComponentPopup onClose={closeModify} data={certifierEdit} />)}
      {isModalOpen && (<DeleteWarehouse closeModal={closeModal} deleteFile={isTrashView ? deleteFileFromTrash : deleteFile} loading={loading} selectedFileName={selectedFileName} isTrashView={isTrashView} />)}
      {isRestoreModalOpen && (<RestoreDocumentPopup isFlame={true} closeModal={closeRestoreModal} restoreFile={restoreFile} selectedFileName={selectedFileName} loading={loading} />)}
      {upload && (<UploadWarehouseComponentPopup onClose={closeUpload} uploadSite={uploadSite} />)}
      {batch && (<BatchRegisterComponentsWarehouse onClose={closeBatch} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofDigitalWarehouse;