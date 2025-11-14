import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faCirclePlus, faClipboardCheck, faDownload, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faScaleBalanced, faTableList, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
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

const DigitalWarehouseRemoved = () => {
  const { type, site } = useParams();
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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
    const route = `/api/flameWarehouse/getComponentsReplaced`;
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

      const uniqueAssets = [...new Set(data.replacedDocuments.map(file => file.asset.assetNr))].sort();
      const uniqueSites = [...new Set(data.replacedDocuments.map(file => file.asset.site.site))].sort();

      setAssets(uniqueAssets);
      setSites(uniqueSites);
      setFiles(data.replacedDocuments);
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

  const filteredFiles = files.filter((file) => {
    const matchesSearchQuery = (
      file.component.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const matchesFilters =
      (selectedSite.length === 0 || selectedSite.includes(file.asset.site.site)) &&
      (selectedAssetForComponent.length === 0 || selectedAssetForComponent.includes(file.asset.assetNr));

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
                <Select options={assetTypes.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedSite(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Site"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={areas.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedAssetForComponent(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Asset"
                  classNamePrefix="sb" />
              </div>
            </div>
          </div>
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/flameWarehouse2.svg`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{(`Removed Components`)}</p>
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
            <label className="risk-control-label">{"Removed Components"}</label>
            <FontAwesomeIcon
              icon={faDownload}
              title="Export to Excel"
              className="top-right-button-control-att"
              onClick={exportSID}
            />
            <FontAwesomeIcon
              icon={faSort}
              title="Select Columns to Display"
              className={`top-right-button-control-att-2`}
              onClick={openSortModal}
            />
          </div>
          <div className="table-container-file-flameproof-all-assets">
            <table>
              <thead>
                <tr className="trashed">
                  <th className="flame-num-filter col" style={{ width: "5%" }}>Nr</th>
                  <th className="flame-type-filter col" style={{ width: "20%" }}>Component Name</th>
                  <th className="flame-ass-nr-filter col" style={{ width: "20%" }}>Serial Number</th>
                  <th className="flame-area-filter col" style={{ width: "15%" }}>Site</th>
                  <th className="flame-owner-filter col" style={{ width: "15%" }}>Asset</th>
                  <th className={`flame-head-filter`} style={{ width: "20%" }}>Replacement Date</th>
                  <th className="flame-act-filter col" style={{ width: "5%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading repaired assets.
                    </td>
                  </tr>
                )}

                {!isLoadingTable && showNoAssets && (
                  <tr>
                    <td colSpan={
                      7
                    } style={{ textAlign: "center", padding: 20 }}>
                      No Assets Repaired.
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

      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {isSortModalOpen && (<SortPopupAsset closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
      <ToastContainer />
    </div >
  );
};

export default DigitalWarehouseRemoved;