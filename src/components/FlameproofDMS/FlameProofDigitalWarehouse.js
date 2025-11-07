import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faCirclePlus, faClipboardCheck, faDownload, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faScaleBalanced, faTableList, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
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

const FlameProofDigitalWarehouse = () => {
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

  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [selectedAuthority, setSelectedAuthority] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState([]);

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
    const route = `/api/flameWarehouse/getWarehouseDocs`;
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
      const uniqueAssetTypes = [...new Set(data.warehouseDocuments.map(file => file.assetType))].sort();
      const uniqueSite = [...new Set(data.warehouseDocuments.map(file => file.site.site))].sort();

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

  const filteredFiles = files.filter((file) => {
    const q = searchQuery.toLowerCase();
    const matchesSearchQuery =
      (file.component || "").toLowerCase().includes(q);

    const matchesFilters =
      (selectedStatus.length === 0 || selectedStatus.includes(file.status)) &&
      (selectedAuthority.length === 0 || selectedAuthority.includes(file.certAuth)) &&
      (selectedAssetType.length === 0 || selectedAssetType.includes(file.assetType)) &&
      (selectedSite.length === 0 || selectedSite.includes(file.site.site));

    return matchesSearchQuery && matchesFilters;
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
                <Select options={sites.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedSite(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Site"
                  classNamePrefix="sb" />
              </div>
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

          <TopBarFP openSort={openSortModal} />
        </div>

        <div
          className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} wide`}
          ref={scrollerRef}
          onPointerDown={onPointerDownX}
          onPointerMove={onPointerMoveX}
          onPointerUp={endDragX}
          onPointerLeave={endDragX}
          onDragStart={(e) => e.preventDefault()}
        >
          <table className={`limit-table-height-warehouse wide`}>
            <thead>
              <tr>
                <th className="flame-warehouse-num-filter col">Nr</th>
                <th className="flame-warehouse-site-filter col">Site</th>
                <th className="flame-warehouse-asset-filter col">Asset Type</th>
                <th className="flame-warehouse-component-filter col">Component Name</th>
                <th className="flame-warehouse-serial-filter col">Component Serial Number</th>
                <th className="flame-warehouse-cert-filter col">Certification Body</th>
                <th className="flame-warehouse-cert-nr-filter col">Certificate Nr</th>
                <th className="flame-warehouse-status-filter col">Certification Status</th>
                <th className="flame-warehouse-issue-date-filter col">Certificate Issue Date</th>
                <th className="flame-warehouse-issue-date-filter col">Certificate Expiry Date</th>
                <th className="flame-warehouse-act-filter col">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTable && (
                <tr>
                  <td colSpan={
                    10
                  } style={{ textAlign: "center", padding: 20 }}>
                    <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading Digital Warehouse.
                  </td>
                </tr>
              )}

              {!isLoadingTable && showNoAssets && (
                <tr>
                  <td colSpan={
                    10
                  } style={{ textAlign: "center", padding: 20 }}>
                    No Components in Digital Warehouse.
                  </td>
                </tr>
              )}

              {filteredFiles.map((file, index) => (
                <tr key={index} className={`file-info-row-height`}>
                  <td className="col">{index + 1}</td>
                  <td className="col" style={{ textAlign: "center" }}>{file.site.site || "-"}</td>
                  <td className="col" style={{ textAlign: "center" }}>{file.assetType || "-"}</td>
                  <td className="col">{file.component || "-"}</td>
                  <td className={`col`}>{file.serialNumber || "-"}</td>
                  <td className={`col`}>{file.certAuth || "-"}</td>
                  <td className={`col`}>{file.certNr || "-"}</td>
                  <td className={`col ${getComplianceColor(file.status)}`}>{formatStatus(file.status)}</td>
                  <td className={`col`}>{formatDate(file.issueDate)}</td>
                  <td className={`col`}>{formatDate(file.expiryDate)}</td>
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<td className={"col-act"}>
                    {file.status.toLowerCase() !== "not uploaded" && (<button
                      className={"flame-delete-button-fi-new col-but-res"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDownloadModal(file._id, file.fileName)
                      }}
                    >
                      <FontAwesomeIcon icon={faDownload} title="Download Certificate" />
                    </button>)}
                    <button
                      className={"flame-delete-button-fi-new col-but"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(file._id, file.component);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} title="Delete Component" />
                    </button>
                  </td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSortModalOpen && (<SortPopupWarehouse closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} assetType={false} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {modify && (<UpdateCertifierLicense onClose={closeModify} certifierData={certifierEdit} />)}
      {isModalOpen && (<DeleteWarehouse closeModal={closeModal} deleteFile={deleteFile} loading={loading} selectedFileName={selectedFileName} />)}
      {upload && (<UploadWarehouseComponentPopup onClose={closeUpload} />)}
      {batch && (<BatchRegisterComponentsWarehouse onClose={closeBatch} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofDigitalWarehouse;