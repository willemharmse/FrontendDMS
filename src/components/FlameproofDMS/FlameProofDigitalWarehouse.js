import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faCirclePlus, faClipboardCheck, faColumns, faDownload, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faScaleBalanced, faTableList, faTools, faTrash, faTriangleExclamation, faWrench } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, canIn } from "../../utils/auth";
import "./FlameProofMain.css"
import TopBarFP from "./Popups/TopBarFP";
import UpdateCertifierLicense from "./Popups/UpdateCertifierLicense";
import DownloadPopup from "../FileInfo/DownloadPopup";
import UploadWarehouseComponentPopup from "./WarehousePopups/UploadWarehouseComponentPopup";
import DeleteWarehouse from "./WarehousePopups/DeleteWarehouse";
import SortPopupWarehouse from "./WarehousePopups/SortPopupWarehouse";
import BatchRegisterComponentsWarehouse from "./WarehousePopups/BatchRegisterComponentsWarehouse";
import TopBarDigitalWarehouse from "./WarehousePopups/TopBarDigitalWarehouse";
import DatePicker from "react-multi-date-picker";
import { use } from "react";
import UpdateWarehouseComponentPopup from "./WarehousePopups/UpdateWarehouseComponentPopup";
import { saveAs } from 'file-saver';

const FlameProofDigitalWarehouse = () => {
  const { site } = useParams();
  const [files, setFiles] = useState([]);
  const scrollerRef = React.useRef(null);
  const dragRef = React.useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    hasDragged: false
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
  const [openHeader, setOpenHeader] = useState(null);
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

  useEffect(() => {
    if (site && site !== "digital-warehouse") {
      setUploadSite(site);
    }
  }, []);

  const [colFilters, setColFilters] = useState({
    site: "",
    assetType: "",
    component: "",
    serial: "",
    certAuth: "",
    certNr: "",
    statusText: "",     // text filter on status label (kept separate from sidebar status chips)
    issueFrom: "",      // yyyy-mm-dd
    issueTo: "",        // yyyy-mm-dd
    expiryFrom: "",     // yyyy-mm-dd
    expiryTo: ""        // yyyy-mm-dd
  });

  const setFilter = (field, val) =>
    setColFilters((f) => ({ ...f, [field]: val || "" }));

  const getComplianceColor = (status) => {
    if (status.toLowerCase() === "valid") return "status-good";
    if (status.toLowerCase() === "invalid") return "status-worst";
    if (status.toLowerCase() === "not uploaded") return "status-missing"
  };

  const [isDraggingX, setIsDraggingX] = useState(false);

  const DRAG_THRESHOLD = 5;

  const isInteractive = (el) =>
    !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');

  const onPointerDownX = (e) => {
    const el = scrollerRef.current;
    if (!el) return;

    // If the press is on an interactive element, don't start drag logic
    if (isInteractive(e.target)) return;

    dragRef.current.active = true;
    dragRef.current.hasDragged = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
    // IMPORTANT: do NOT set isDraggingX yet; wait until we cross threshold
  };

  const getReason = (status, file) => {
    switch ((status || "").toLowerCase()) {
      case "invalid":
        if (file.authInvalid) {
          return "Certifier Credentials Invalid";
        }
        if (file.authRemoved) {
          return "Certifier Credentials Removed";
        }
        return "Certificate Invalid";
      case "not uploaded":
        return "—";
      default:
        return "—";
    }
  };

  const exportSID = async () => {
    try {
      let route = ``;

      if (site && site !== "digital-warehouse") {
        route = `/api/flameproofExport/export-warehouse-site/${site}`;
      } else {
        route = `/api/flameproofExport/export-warehouse`;
      }
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

  const onPointerMoveX = (e) => {
    const el = scrollerRef.current;
    if (!el || !dragRef.current.active) return;

    const dx = e.clientX - dragRef.current.startX;

    if (!dragRef.current.hasDragged) {
      if (Math.abs(dx) >= DRAG_THRESHOLD) {
        dragRef.current.hasDragged = true;
        setIsDraggingX(true);
        try { el.setPointerCapture?.(e.pointerId); } catch { }
      } else {
        return; // still a click, do nothing
      }
    }

    el.scrollLeft = dragRef.current.startScrollLeft - dx;
    // prevent text selection while actually dragging
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

  // --- Column selector setup (similar to VisitorsInduction) ---

  // All possible columns for this table
  const allColumns = [
    { id: "nr", title: "Nr" },
    ...(site === "digital-warehouse"
      ? [{ id: "site", title: "Site" }]
      : []),
    { id: "assetType", title: "Asset Type" },
    { id: "component", title: "Component Name" },
    { id: "serial", title: "Component Serial Number" },
    { id: "certAuth", title: "Certification Body" },
    { id: "certNr", title: "Certificate Nr" },
    { id: "status", title: "Certification Status" },
    { id: "invalidReason", title: "Invalidity Reason" },   // treat this as the "extra" column
    { id: "issue", title: "Certificate Issue Date" },
    { id: "expiry", title: "Certificate Expiry Date" },
  ];

  if (canIn(access, "FCMS", ["systemAdmin", "contributor"])) {
    allColumns.push({ id: "action", title: "Action" });
  }

  // Base (no-scroll) columns – same idea as Visitors:
  // only these selected => no horizontal scroll;
  // as soon as you add one extra (e.g. Invalidity Reason) => scroll kicks in.
  const baseColumnIds = (() => {
    const base = site === "digital-warehouse"
      ? ["nr", "site", "assetType", "component", "serial", "certAuth", "status", "invalidReason"]
      : ["nr", "assetType", "component", "serial", "certAuth", "status", "invalidReason"];

    if (canIn(access, "FCMS", ["systemAdmin", "contributor"])) {
      base.push("action");
    }
    return base;
  })();

  // Which columns are currently shown
  const [showColumns, setShowColumns] = useState(() => baseColumnIds);

  const visibleColumns = allColumns.filter(c => showColumns.includes(c.id));
  const visibleCount = visibleColumns.length;

  // Same behaviour as Visitors: base count => no scroll; > base count => scroll
  const isWide = visibleCount > baseColumnIds.length;

  const toggleColumn = (id) => {
    setShowColumns(prev => {
      // Pin Nr + Action like in Visitors – they cannot be turned off
      if (id === "nr" || id === "action") return prev;
      return prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
    });
  };

  const toggleAllColumns = (selectAll) => {
    if (selectAll) {
      setShowColumns(allColumns.map(c => c.id));
    } else {
      setShowColumns(baseColumnIds);
    }
  };

  const areAllSelected = () => {
    const ids = allColumns.map(c => c.id);
    return ids.every(id => showColumns.includes(id));
  };

  const formatStatus = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
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

  const openBatch = () => {
    setBatch(true);
  }

  const closeBatch = () => {
    setBatch(false);
    fetchFiles();
  }

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
    const route = site === "digital-warehouse" ? `/api/flameWarehouse/getWarehouseDocs` : `/api/flameWarehouse/getWarehouseDocsSite/${site}`;
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

      const uniqueCertifiers = [...new Set(data.warehouseDocuments.map(file => file.certAuth))].sort();
      const uniqueStatus = [...new Set(data.warehouseDocuments.map(file => file.status))].sort();
      const uniqueAssetTypes = [
        ...new Set(
          data.warehouseDocuments
            .flatMap(file => file.assetTypes || []) // flatten nested arrays safely
            .map(type => type?.trim())              // clean up whitespace
            .filter(Boolean)                        // remove null/empty entries
        )
      ].sort();
      const uniqueSite = [...new Set(
        data.warehouseDocuments.map(file => file.site?.site).filter(Boolean)
      )].sort();

      setStatus(uniqueStatus);
      setAuthorities(uniqueCertifiers);
      setAssetTypes(uniqueAssetTypes);
      setSites(uniqueSite);

      setFiles(data.warehouseDocuments);
      setError(null);
    } catch (err) {
      setError(err?.message || "Network error");
      setShowNoAssets(false); // ensure table shows the mock rows
    } finally {
      setIsLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const asArray = (v) => Array.isArray(v) ? v : (v == null ? [] : [v]);
  const str = (s) => (s ?? "").toString().toLowerCase();
  const someIncludes = (arr, needle) => {
    if (!needle) return true; // no filter -> pass
    const n = str(needle);
    return asArray(arr).some(v => str(v).includes(n));
  };
  const someIn = (needles, haystackArr) => {
    if (!needles?.length) return true; // no selections -> pass
    const hay = asArray(haystackArr).map(str);
    return needles.map(str).some(n => hay.includes(n)); // intersection check
  };


  const filteredFiles = files.filter((file) => {
    const q = searchQuery.toLowerCase();
    const matchesSearchQuery = (file.component || "").toLowerCase().includes(q);

    // --- Sidebar multi-selects (keep existing behaviour)
    const matchesSidebar =
      (selectedStatus.length === 0 || selectedStatus.includes(file.status)) &&
      (selectedAuthority.length === 0 || selectedAuthority.includes(file.certAuth)) &&
      // ↓ Asset type is an array; pass if ANY selected asset type appears in the file’s assetType array
      someIn(selectedAssetType, file.assetTypes) &&
      (selectedSite.length === 0 || selectedSite.includes(file.site?.site));

    // --- Header text filters (case-insensitive, null-safe)
    const t = (s) => (s ?? "").toString().toLowerCase();
    const matchesText =
      (!colFilters.site || str(file.site?.site).includes(str(colFilters.site))) &&
      // ↓ Header filter: match if ANY asset type contains the typed text
      someIncludes(file.assetTypes, colFilters.assetType) &&
      (!colFilters.component || str(file.component).includes(str(colFilters.component))) &&
      (!colFilters.serial || str(file.serialNumber).includes(str(colFilters.serial))) &&
      (!colFilters.certAuth || str(file.certAuth).includes(str(colFilters.certAuth))) &&
      (!colFilters.certNr || str(file.certNr).includes(str(colFilters.certNr))) &&
      (!colFilters.statusText || str(file.status).includes(str(colFilters.statusText)));

    // --- Header date-range filters (issue/expiry)
    const issue = file.issueDate ? new Date(file.issueDate) : null;
    const expiry = file.expiryDate ? new Date(file.expiryDate) : null;
    const issueFromOK = colFilters.issueFrom ? (issue && issue >= new Date(colFilters.issueFrom)) : true;
    const issueToOK = colFilters.issueTo ? (issue && issue <= new Date(colFilters.issueTo)) : true;
    const expiryFromOK = colFilters.expiryFrom ? (expiry && expiry >= new Date(colFilters.expiryFrom)) : true;
    const expiryToOK = colFilters.expiryTo ? (expiry && expiry <= new Date(colFilters.expiryTo)) : true;

    return matchesSearchQuery && matchesSidebar && matchesText && issueFromOK && issueToOK && expiryFromOK && expiryToOK;
  });

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

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/downloadCertificate/${fileId}`, {
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

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/delete/${selectedFileId}`, {
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
    const v = filteredFiles.filter(f => f.status.toLowerCase() === "valid").length;
    const e = filteredFiles.filter(f => f.status.toLowerCase() === "invalid").length;
    const n = filteredFiles.filter(f => f.status.toLowerCase() === "not uploaded").length;
    return { validCount: v, expiredCount: e, notUploadedCount: n, invalidCount: e + n };
  }, [filteredFiles]);

  useEffect(() => {
    const getSiteName = async () => {
      if (!site || site === "digital-warehouse") {
        setSiteName("");
        return;
      }
      const route = `/api/flameproof/getSiteNameFromID/${site}`;
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
        setSiteName(data.siteName);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoadingTable(false);
      }
    }

    getSiteName();
  }, [site]);

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
              {site === "digital-warehouse" && (<div className="fi-info-popup-page-select-container">
                <Select options={sites.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedSite(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Site"
                  classNamePrefix="sb" />
              </div>)}
              <div className="fi-info-popup-page-select-container">
                <Select options={assetTypes.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedAssetType(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Asset Type"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={authorities.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedAuthority(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Certification Body"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={status.map(d => ({ value: d, label: formatStatus(d) }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Status"
                  classNamePrefix="sb" />
              </div>
            </div>
          </div>
          {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={() => openUpload()} style={{ paddingTop: "10px", paddingBottom: "10px" }}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Register Single Component</span>
                  </div>
                </button>
                <button className="but-dm-fi" style={{ paddingTop: "10px", paddingBottom: "10px" }} onClick={() => openBatch()}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Register Multiple Components</span>
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

          <div className={`info-box-fih`}>{`Valid Components: ${validCount}`}</div>
          <div className={`info-box-fih trashed`}>{`Invalid Components: ${invalidCount}`}</div>

          <div className="spacer"></div>

          <TopBarDigitalWarehouse openSort={openSortModal} />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">
              {site === "digital-warehouse"
                ? "Digital Warehouse"
                : `Digital Warehouse`}
            </label>

            {/* Column selector (new) */}
            <FontAwesomeIcon
              icon={faColumns}
              title="Select Columns to Display"
              className="top-right-button-control-att-4"
              onClick={() => setShowColumnSelector(v => !v)}
            />

            {/* Sort */}
            <FontAwesomeIcon
              icon={faDownload}
              title="Export to Excel"
              className="top-right-button-control-att-2"
              onClick={exportSID}
            />

            {/* Sort */}
            <FontAwesomeIcon
              icon={faSort}
              title="Sort Columns"
              className="top-right-button-control-att-3"
              onClick={openSortModal}
            />

            <FontAwesomeIcon
              icon={faWrench}
              title="View Removed Components"
              className="top-right-button-control-att"
              onClick={() => navigate("/FrontendDMS/flameReplacedComponents")}
            />

            {showColumnSelector && (
              <div
                className="column-selector-popup"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="column-selector-header">
                  <h4>Select Columns</h4>
                  <button
                    className="close-popup-btn"
                    onClick={() => setShowColumnSelector(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="column-selector-content">
                  <p className="column-selector-note">Select columns to display</p>

                  <div className="select-all-container">
                    <label className="select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={areAllSelected()}
                        onChange={(e) => toggleAllColumns(e.target.checked)}
                      />
                      <span className="select-all-text">Select All</span>
                    </label>
                  </div>

                  <div className="column-checkbox-container">
                    {allColumns.map(col => (
                      <div className="column-checkbox-item" key={col.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={showColumns.includes(col.id)}
                            disabled={col.id === "nr" || col.id === "action"} // pinned
                            onChange={() => toggleColumn(col.id)}
                          />
                          <span>{col.title}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="column-selector-footer">
                    <p>{visibleCount} columns selected</p>
                    <button
                      className="apply-columns-btn"
                      onClick={() => setShowColumnSelector(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="table-container-file-flameproof-all-assets">
            <div
              className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? "wide" : ""}`}
              ref={scrollerRef}
              onPointerDown={onPointerDownX}
              onPointerMove={onPointerMoveX}
              onPointerUp={endDragX}
              onPointerLeave={endDragX}
              onDragStart={(e) => e.preventDefault()}
              style={{ maxHeight: "calc(100% - 5px)" }}
            >
              <table className={`limit-table-height-warehouse ${isWide ? "wide" : ""}`}>
                <thead>
                  <tr>
                    {/* Nr (static) */}
                    {showColumns.includes("nr") && (
                      <th className="flame-warehouse-num-filter col">
                        <span className="fileinfo-title-filter-1">Nr</span>
                      </th>
                    )}

                    {/* Site (text) – only for "digital-warehouse" route */}
                    {site === "digital-warehouse" && showColumns.includes("site") && (
                      <th className={`flame-warehouse-site-filter col ${colFilters.site ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "site" ? null : "site"))}
                            title="Filter by Site"
                          >
                            Site {colFilters.site && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "site" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by site"
                                className="filter-input-file"
                                value={colFilters.site}
                                onChange={(e) => setFilter("site", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Asset Type (text) */}
                    {showColumns.includes("assetType") && (
                      <th className={`flame-warehouse-asset-filter col ${colFilters.assetType ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "assetType" ? null : "assetType"))}
                            title="Filter by Asset Type"
                          >
                            Asset Type {colFilters.assetType && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "assetType" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by asset type"
                                className="filter-input-file"
                                value={colFilters.assetType}
                                onChange={(e) => setFilter("assetType", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Component Name (text) */}
                    {showColumns.includes("component") && (
                      <th className={`flame-warehouse-component-filter col ${colFilters.component ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "component" ? null : "component"))}
                            title="Filter by Component Name"
                          >
                            Component Name {colFilters.component && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "component" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by component"
                                className="filter-input-file"
                                value={colFilters.component}
                                onChange={(e) => setFilter("component", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Serial (text) */}
                    {showColumns.includes("serial") && (
                      <th className={`flame-warehouse-serial-filter col ${colFilters.serial ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "serial" ? null : "serial"))}
                            title="Filter by Serial Number"
                          >
                            Component Serial Number {colFilters.serial && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "serial" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by serial"
                                className="filter-input-file"
                                value={colFilters.serial}
                                onChange={(e) => setFilter("serial", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Cert Body (text) */}
                    {showColumns.includes("certAuth") && (
                      <th className={`flame-warehouse-cert-filter col ${colFilters.certAuth ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "certAuth" ? null : "certAuth"))}
                            title="Filter by Certification Body"
                          >
                            Certification Body {colFilters.certAuth && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "certAuth" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by certification body"
                                className="filter-input-file"
                                value={colFilters.certAuth}
                                onChange={(e) => setFilter("certAuth", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Cert Nr (text) */}
                    {showColumns.includes("certNr") && (
                      <th className={`flame-warehouse-cert-nr-filter col ${colFilters.certNr ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "certNr" ? null : "certNr"))}
                            title="Filter by Certificate Number"
                          >
                            Certificate Nr {colFilters.certNr && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "certNr" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by certificate number"
                                className="filter-input-file"
                                value={colFilters.certNr}
                                onChange={(e) => setFilter("certNr", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Status (text filter) */}
                    {showColumns.includes("status") && (
                      <th className={`flame-warehouse-status-filter col ${colFilters.statusText ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "statusText" ? null : "statusText"))}
                            title="Filter by Status"
                          >
                            Certification Status {colFilters.statusText && <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />}
                          </span>
                          {openHeader === "statusText" && (
                            <div className="fileinfo-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              <input
                                type="text"
                                placeholder="Filter by status"
                                className="filter-input-file"
                                value={colFilters.statusText}
                                onChange={(e) => setFilter("statusText", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Invalidity Reason (static) */}
                    {showColumns.includes("invalidReason") && (
                      <th className="flame-warehouse-status-filter col">
                        <div className="fileinfo-container-filter">
                          <span className="fileinfo-title-filter" title="Invalidity Reason">
                            Invalidity Reason
                          </span>
                        </div>
                      </th>
                    )}

                    {/* Issue Date (date range) */}
                    {showColumns.includes("issue") && (
                      <th className={`flame-warehouse-issue-date-filter col ${colFilters.issueFrom || colFilters.issueTo ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "issue" ? null : "issue"))}
                            title="Filter by Certificate Issue Date"
                          >
                            Certificate Issue Date {(colFilters.issueFrom || colFilters.issueTo) && (
                              <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />
                            )}
                          </span>
                          {openHeader === "issue" && (
                            <div className="date-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              {/* From */}
                              <div className="date-filter-row">
                                <label className="date-label">From</label>
                                <DatePicker
                                  value={colFilters.issueFrom || ""}
                                  format="YYYY-MM-DD"
                                  onChange={(val) => setFilter("issueFrom", val?.format("YYYY-MM-DD"))}
                                  rangeHover={false}
                                  highlightToday={false}
                                  editable={false}
                                  inputClass="filter-input-date"
                                  placeholder="YYYY-MM-DD"
                                  hideIcon={false}
                                />
                                {colFilters.issueFrom && (
                                  <button
                                    type="button"
                                    onClick={() => setFilter("issueFrom", "")}
                                    className="no-drag"
                                    title="Clear"
                                  >
                                    <FontAwesomeIcon icon={faX} />
                                  </button>
                                )}
                              </div>
                              {/* To */}
                              <div className="date-filter-row">
                                <label className="date-label">To</label>
                                <DatePicker
                                  value={colFilters.issueTo || ""}
                                  format="YYYY-MM-DD"
                                  onChange={(val) => setFilter("issueTo", val?.format("YYYY-MM-DD"))}
                                  rangeHover={false}
                                  highlightToday={false}
                                  editable={false}
                                  inputClass="filter-input-date"
                                  placeholder="YYYY-MM-DD"
                                  hideIcon={false}
                                />
                                {colFilters.issueTo && (
                                  <button
                                    type="button"
                                    onClick={() => setFilter("issueTo", "")}
                                    className="no-drag"
                                    title="Clear"
                                  >
                                    <FontAwesomeIcon icon={faX} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Expiry Date (date range) */}
                    {showColumns.includes("expiry") && (
                      <th className={`flame-warehouse-exp-date-filter col ${colFilters.expiryFrom || colFilters.expiryTo ? "th-filter-active" : ""}`}>
                        <div className="fileinfo-container-filter">
                          <span
                            className="fileinfo-title-filter"
                            onClick={() => setOpenHeader(prev => (prev === "expiry" ? null : "expiry"))}
                            title="Filter by Certificate Expiry Date"
                          >
                            Certificate Expiry Date {(colFilters.expiryFrom || colFilters.expiryTo) && (
                              <FontAwesomeIcon icon={faSearch} className="th-filter-icon" />
                            )}
                          </span>
                          {openHeader === "expiry" && (
                            <div className="date-menu-filter" onMouseLeave={() => setOpenHeader(null)}>
                              {/* From */}
                              <div className="date-filter-row">
                                <label className="date-label">From</label>
                                <DatePicker
                                  value={colFilters.expiryFrom || ""}
                                  format="YYYY-MM-DD"
                                  onChange={(val) => setFilter("expiryFrom", val?.format("YYYY-MM-DD"))}
                                  rangeHover={false}
                                  highlightToday={false}
                                  editable={false}
                                  inputClass="filter-input-date"
                                  placeholder="YYYY-MM-DD"
                                  hideIcon={false}
                                />
                                {colFilters.expiryFrom && (
                                  <button
                                    type="button"
                                    onClick={() => setFilter("expiryFrom", "")}
                                    className="no-drag"
                                    title="Clear"
                                  >
                                    <FontAwesomeIcon icon={faX} />
                                  </button>
                                )}
                              </div>
                              {/* To */}
                              <div className="date-filter-row">
                                <label className="date-label">To</label>
                                <DatePicker
                                  value={colFilters.expiryTo || ""}
                                  format="YYYY-MM-DD"
                                  onChange={(val) => setFilter("expiryTo", val?.format("YYYY-MM-DD"))}
                                  rangeHover={false}
                                  highlightToday={false}
                                  editable={false}
                                  inputClass="filter-input-date"
                                  placeholder="YYYY-MM-DD"
                                  hideIcon={false}
                                />
                                {colFilters.expiryTo && (
                                  <button
                                    type="button"
                                    onClick={() => setFilter("expiryTo", "")}
                                    className="no-drag"
                                    title="Clear"
                                  >
                                    <FontAwesomeIcon icon={faX} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </th>
                    )}

                    {/* Action (static) */}
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) &&
                      showColumns.includes("action") && (
                        <th className="flame-warehouse-act-filter col">
                          <span className="fileinfo-title-filter-1">Action</span>
                        </th>
                      )}
                  </tr>
                </thead>
                <tbody>
                  {isLoadingTable && (
                    <tr>
                      <td
                        colSpan={visibleCount}
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading
                        Digital Warehouse.
                      </td>
                    </tr>
                  )}

                  {!isLoadingTable && showNoAssets && (
                    <tr>
                      <td
                        colSpan={visibleCount}
                        style={{ textAlign: "center", padding: 20 }}
                      >
                        No Components in Digital Warehouse.
                      </td>
                    </tr>
                  )}

                  {filteredFiles.map((file, index) => (
                    <tr key={index} className="file-info-row-height">
                      {showColumns.includes("nr") && (
                        <td className="col">{index + 1}</td>
                      )}

                      {site === "digital-warehouse" &&
                        showColumns.includes("site") && (
                          <td className="col" style={{ textAlign: "center" }}>
                            {file.site?.site || "-"}
                          </td>
                        )}

                      {showColumns.includes("assetType") && (
                        <td className="col" style={{ textAlign: "center" }}>
                          {file.assetTypes && file.assetTypes.length > 0
                            ? file.assetTypes.map((item, i) => (
                              <React.Fragment key={i}>
                                {item}
                                <br />
                              </React.Fragment>
                            ))
                            : "-"}
                        </td>
                      )}

                      {showColumns.includes("component") && (
                        <td className="col">{file.component || "-"}</td>
                      )}

                      {showColumns.includes("serial") && (
                        <td className="col">{file.serialNumber || "-"}</td>
                      )}

                      {showColumns.includes("certAuth") && (
                        <td className="col">{file.certAuth || "-"}</td>
                      )}

                      {showColumns.includes("certNr") && (
                        <td className="col">{file.certNr || "-"}</td>
                      )}

                      {showColumns.includes("status") && (
                        <td className={`col ${getComplianceColor(file.status)}`}>
                          {formatStatus(file.status)}
                        </td>
                      )}

                      {showColumns.includes("invalidReason") && (
                        <td className="col">
                          {getReason(file.status, file)}
                        </td>
                      )}

                      {showColumns.includes("issue") && (
                        <td className="col">{formatDate(file.issueDate)}</td>
                      )}

                      {showColumns.includes("expiry") && (
                        <td className="col">{formatDate(file.expiryDate)}</td>
                      )}

                      {canIn(access, "FCMS", ["systemAdmin", "contributor"]) &&
                        showColumns.includes("action") && (
                          <td className="col-act">
                            {file.status.toLowerCase() !== "not uploaded" && (
                              <button
                                className="flame-delete-button-fi-new col-but-res"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDownloadModal(file._id, file.fileName);
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faDownload}
                                  title="Download Certificate"
                                />
                              </button>
                            )}
                            <button
                              className="flame-delete-button-fi-new col-but-res"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModify(file);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                title="Modify Component"
                              />
                            </button>
                            <button
                              className="flame-delete-button-fi-new col-but"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(file._id, file.component);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                title="Delete Component"
                              />
                            </button>
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

      {isSortModalOpen && (<SortPopupWarehouse closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} assetType={false} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {modify && (<UpdateWarehouseComponentPopup onClose={closeModify} data={certifierEdit} />)}
      {isModalOpen && (<DeleteWarehouse closeModal={closeModal} deleteFile={deleteFile} loading={loading} selectedFileName={selectedFileName} />)}
      {upload && (<UploadWarehouseComponentPopup onClose={closeUpload} uploadSite={uploadSite} />)}
      {batch && (<BatchRegisterComponentsWarehouse onClose={closeBatch} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofDigitalWarehouse;