import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash, faRotate, faX, faFileCirclePlus, faSearch, faArrowLeft, faSpinner, faDownload, faSort } from '@fortawesome/free-solid-svg-icons';
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

const FlameProofSub = () => {
  const { type, assetId } = useParams();
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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

  const openReplace = (assetType, component, id) => {
    setReplaceID(id);
    setReplaceType(assetType);
    setReplaceComp(component);
    setReplace(true);
  };

  const closeReplace = () => {
    setReplace(false);
  };

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getAssetSite/${assetId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setSite(data.site._id);
        setSiteTitle(data.site.site);
        console.log(data.site._id);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchSite();
  }, []);


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
      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproofExport/export-certificates/${assetId}`,
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

  const closePopup = () => {
    setPopup(null);
  }

  const openUpload = () => {
    setUpload(true);
  };

  const closeUpload = (assetNr, id, nav) => {
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

  const openRegister = () => {
    setRegister(true);
  };

  const closeRegister = () => {
    setRegister(!register);
  };

  const openSortModal = () => setIsSortModalOpen(true);
  const closeSortModal = () => setIsSortModalOpen(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      const decodedToken = jwtDecode(storedToken);
      getAssetIconSrc();
    }
  }, [navigate, isTrashView]);

  useEffect(() => {
    if (token && hasRole(access, "DMS")) {
      fetchFiles();
    }
  }, [token]);

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

  const deleteFileFromTrash = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/trash/delete/${selectedFileId}`, {
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

  const replaceComponent = async (replacementID) => {
    if (!replaceType && !replaceComp) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/certificates/${replaceID}/${replacementID}/replace`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to delete file from trash');
      setReplace(false);
      setReplaceID(null);
      setReplaceType("");
      setReplaceComp("");

      toast.dismiss();
      toast.clearWaitingQueue();
      toast.success("Component Successfully moved from Digital Warehouse", {
        closeButton: true,
        autoClose: 2000,
        style: { textAlign: "center" },
      });


      fetchFiles();
    } catch (error) {
      console.error('Error deleting file from trash:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreFile = async (fileId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_URL}/api/flameproof/trash/restore/${fileId}`,
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

      const msg = data?.message || "Certificate restored successfully";
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
      toast.error(error.message || "Error restoring the file. Please try again.", {
        closeButton: true,
        autoClose: 1500,
        style: { textAlign: "center" },
      });
    }
  };

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    const route = isTrashView ? `/api/flameproof/trash/load` : `/api/flameproof/certificates/by-asset/${assetId}`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();

      const uniqueOpAreas = [...new Set(data.certificates.map(file => file.asset.operationalArea))].sort();
      const uniqueStatus = [...new Set(data.certificates.map(file => file.status))].sort();
      const uniqueTypes = [...new Set(data.certificates.map(file => file.asset.assetType))].sort();

      setAreas(uniqueOpAreas);
      setStatus(uniqueStatus);
      setTypes(uniqueTypes);

      setFiles(data.certificates);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoadingTable(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
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

  const deleteFile = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/delete/${selectedFileId}`, {
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

  const formatStatus = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (dateString === null || !dateString) return "—"
    const date = new Date(dateString); // Convert to Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
    return `${year}-${month}-${day}`;
  };

  const assetIconMap = {
    "all-assets": "/allDocumentsDMS.svg",
    "Continuous Miner": "/FCMS_CM2.png",
    "Shuttle Car": "/FCMS_SC2.png",
    "Roof Bolter": "/FCMS_RB2.png",
    "Feeder Breaker": "/FCMS_FB2.png",
    "Load Haul Dumper": "/FCMS_LHD2.png",
    "Tractor": "/FCMS_T2.png",
  }

  const versionAssetIconMap = {
    "all-assets": "allDocumentsDMS.svg",
    "Continuous Miner": "FCMS_CM2.png",
    "Shuttle Car": "FCMS_SC2.png",
    "Roof Bolter": "FCMS_RB2.png",
    "Feeder Breaker": "FCMS_FB2.png",
    "Load Haul Dumper": "FCMS_LHD2.png",
    "Tractor": "FCMS_T2.png",
  }

  const getFirstAssetType = () => {
    return (files?.[0]?.asset?.assetType || "").trim();
  }

  const getAssetIconSrc = async () => {
    if (isTrashView) {
      setIcon(`${process.env.PUBLIC_URL}/trashIcon.svg`);
      return;
    }

    const route = `/api/flameproof/getAsset/${type}`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setAssetType(data.assets.assetType);
      const key = data.assets.assetType.replace(/\s+/g, " ");
      setIcon(`${process.env.PUBLIC_URL}/${assetIconMap[key]}` || `${process.env.PUBLIC_URL}//genericAssetType2.svg`);
      setVersionIcon(`${process.env.PUBLIC_URL}/${versionAssetIconMap[key]}` || `${process.env.PUBLIC_URL}/genericAssetType2.svg`);
    } catch (error) {
      setError(error.message);
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

  const getComplianceColor = (status) => {
    if (status === "valid") return "status-good";
    if (status === "invalid") return "status-worst";
    if (status === "not uploaded") return "status-missing"
  };

  const getField = (file, field) => {
    switch (field) {
      case "assetNr": return file.asset?.assetNr ?? "";
      case "area": return file.asset?.operationalArea ?? "";
      case "owner": return file.asset?.assetOwner ?? "";
      case "certAuth": return file.certAuth ?? "";
      case "certNr": return file.certNr ?? "";
      case "component": return file.component ?? "";
      case "departmentHead": return file.asset?.departmentHead ?? "";
      case "status": return (file.status ?? "").toLowerCase() === "missing" ? "not uploaded" : (file.status ?? "");
      case "issueDate": return file.issueDate ? new Date(file.issueDate).getTime() : null;
      case "expiryDate": return file.certificateExipryDate ? new Date(file.certificateExipryDate).getTime() : null; // note your key is "Exipry" here
      default: return "";
    }
  };

  const filteredFiles = useMemo(() => {
    const normStatus = (s) => {
      const v = (s || "").toLowerCase();
      return v === "missing" ? "not uploaded" : v;
    };

    // 1) filter
    const fs = files.filter((file) => {
      const q = searchQuery.toLowerCase();
      const matchesSearchQuery =
        (file.certNr || "").toLowerCase().includes(q)

      const fileStatusNorm = normStatus(file.status);

      const matchesFilters =
        (selectedArea.length === 0 || selectedArea.includes(file.asset.operationalArea)) &&
        (selectedStatus.length === 0 || selectedStatus.includes(fileStatusNorm)) &&
        (selectedType.length === 0 || selectedType.includes(file.asset.assetType));

      return matchesSearchQuery && matchesFilters;
    });

    // 2) sort
    const arr = [...fs];

    // default grouping (as you had) if no explicit sort chosen
    if (!sortField) {
      const isMaster = (f) => {
        const c = (f.component || "").trim().toLowerCase();
        return c === "master" || c === "master component";
      };
      const statusPriority = (f) => (normStatus(f.status) === "not uploaded" ? 0 : 1);
      const componentPriority = (f) => (isMaster(f) ? 0 : 1);

      arr.sort((a, b) => {
        const sp = statusPriority(a) - statusPriority(b);
        if (sp) return sp;

        const cp = componentPriority(a) - componentPriority(b);
        if (cp) return cp;

        const byComp = (a.component || "").localeCompare((b.component || ""), undefined, { numeric: true, sensitivity: "base" });
        if (byComp) return byComp;

        return (a.asset?.assetNr || "").localeCompare((b.asset?.assetNr || ""), undefined, { numeric: true, sensitivity: "base" });
      });

      return arr;
    }

    const dir = sortOrder === "ascending" ? 1 : -1;

    arr.sort((a, b) => {
      const av = getField(a, sortField);
      const bv = getField(b, sortField);

      // null/undefined last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;

      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });

    return arr;
  }, [files, searchQuery, selectedArea, selectedStatus, sortField, sortOrder, selectedType]);

  const invalidCount = filteredFiles.filter(f => {
    const status = (f.status || "").toLowerCase();
    return status === "invalid" || status === "not uploaded";
  }).length;

  const validCount = filteredFiles.filter(f => {
    const status = (f.status || "").toLowerCase();
    return status === "valid";
  }).length;

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
              {isTrashView && (<div className="fi-info-popup-page-select-container">
                <Select options={types.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedType(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Asset Type"
                  classNamePrefix="sb" />
              </div>)}
              <div className="fi-info-popup-page-select-container">
                <Select options={areas.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedArea(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Area"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={status.map(d => ({ value: d, label: formatStatus(d) }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Status"
                  classNamePrefix="sb" />
              </div>
            </div>
          </div>
          {!isTrashView && canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2" >
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={openUpload}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                    <span className="button-text">Upload Single Certificate</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={icon} className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{isTrashView ? `Trashed Certificates` : (type)}</p>
            {!isTrashView && (<p className="logo-text-dm-fi" style={{ marginTop: "0px" }}>{siteTitle}</p>)}
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
              placeholder="Search Certificate Number"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          <div className={isTrashView ? `info-box-fih trashed` : `info-box-fih`}>Valid Certificates: {validCount}</div>
          {!isTrashView && (<div className={`info-box-fih ${invalidCount === 0 ? `no-invalid` : `trashed`}`} style={invalidCount === 0 ? { backgroundColor: '#002060' } : undefined}>Outstanding Certificates: {invalidCount}</div>)}

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          <TopBarFPC isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} toggleTrashView={toggleTrashView} isTrashView={isTrashView} canIn={canIn} access={access} openSort={openSortModal} />
        </div>

        <div className="table-flameproof-card">
          <div className="flameproof-table-header-label-wrapper">
            <label className="risk-control-label">{isTrashView ? `Trashed Certificates` : (type)}</label>
            {!isTrashView && (<FontAwesomeIcon
              icon={faDownload}
              title="Export to Excel"
              className="top-right-button-control-att"
              onClick={exportSID}
            />)}
            <FontAwesomeIcon
              icon={faSort}
              title="Select Columns to Display"
              className={isTrashView ? "top-right-button-control-att" : `top-right-button-control-att-2`}
              onClick={openSortModal}
            />
          </div>
          <div className="table-container-file-flameproof-all-assets">
            <table>
              <thead>
                <tr className={isTrashView ? 'trashed' : ""}>
                  <th className="flame-num-filter col" style={{ fontSize: "14px" }}>Nr</th>
                  <th className="flame-sub-cert-filter col" style={{ width: "10%" }}>Certificate Nr</th>
                  {isTrashView && (<th className="flame-sub-ass-nr-2-filter col" style={{ fontSize: "14px" }}>Asset Type</th>)}
                  <th className="flame-sub-owner-filter col">Asset Owner</th>
                  <th className="flame-sub-auth-filter col">Certification Body</th>
                  <th className="flame-sub-comp-filter col">Component</th>
                  <th className={`flame-sub-head-filter`}>Department Head</th>
                  <th className={`flame-sub-status-filter col`}>Status</th>
                  <th className={`flame-sub-status-filter col`} style={{ width: "9%" }}>Invalidity Reason</th>
                  <th className="flame-sub-date-filter col">Issue Date</th>
                  {!isTrashView && (<th className="flame-sub-date-filter col">Expiry Date</th>)}
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<th className="flame-sub-act-filter col" style={{ fontSize: "14px" }}>Action</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoadingTable && (
                  <tr>
                    <td colSpan={
                      10 + (isTrashView ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)
                    } style={{ textAlign: "center", padding: 20 }}>
                      <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading certificates.
                    </td>
                  </tr>
                )}

                {!isLoadingTable && showNoAssets && (
                  <tr>
                    <td colSpan={
                      10 + (isTrashView ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)
                    } style={{ textAlign: "center", padding: 20 }}>
                      No Certificates Uploaded.
                    </td>
                  </tr>
                )}

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
                    {!isTrashView && (<td className={`col`}>{formatDate(file.certificateExipryDate)}</td>)}
                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                      <td className={`col-act ${isTrashView ? "trashed" : ""}`}>

                        {isTrashView && (
                          <button
                            className={"delete-button-fi col-but-res trashed-color"}
                            onClick={() => restoreFile(file._id)}
                          >
                            <FontAwesomeIcon icon={faRotate} title="Restore Document" />
                          </button>
                        )}
                        {!file.isPlaceholder && (<button
                          className={`delete-button-fi col-but ${isTrashView ? "trashed-color" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();         // ⛔ prevent row click
                            openModal(file._id, file.fileName);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} title="Delete Document" />
                        </button>)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (<DeleteCertificate closeModal={closeModal} deleteFile={deleteFile} isTrashView={isTrashView} loading={loading} selectedFileName={selectedFileName} deleteFileFromTrash={deleteFileFromTrash} />)}
      {isSortModalOpen && (<SortPopupCertificates closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {upload && (<UploadComponentPopup onClose={closeUpload} refresh={fetchFiles} site={site} assetNumber={type} />)}
      {update && (<UpdateCertificateModal certificateID={updateID} closeModal={closeUpdate} isModalOpen={update} refresh={fetchFiles} />)}
      {replace && (<ReplaceComponentPopup onClose={closeReplace} isOpen={replace} assetType={replaceType} component={replaceComp} replaceComponent={replaceComponent} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofSub;