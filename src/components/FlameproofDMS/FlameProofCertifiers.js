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
import UploadCertifierLicense from "./Popups/UploadCertifierLicense";
import UpdateCertifierLicense from "./Popups/UpdateCertifierLicense";
import DownloadPopup from "../FileInfo/DownloadPopup";
import DeleteCertifiers from "./Popups/DeleteCertifiers";
import SortPopupCertifiers from "./Popups/SortPopupCertifiers";

const FlameProofCertifiers = () => {
  const [files, setFiles] = useState([]);
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

  // put this near the top (outside component) or inside the component before usage
  const natCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const sortByAssetNr = (arr) =>
    [...arr].sort((a, b) => natCompare.compare(a.assetNr || '', b.assetNr || ''));

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    const route = `/api/flameProofCertifiers/getCerts`;
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
  }, [token]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const filteredFiles = defaultStatusSort(
    files.filter((file) => {
      const q = searchQuery.toLowerCase();
      const matchesSearchQuery = (file.authority || "").toLowerCase().includes(q);
      const matchesFilters =
        (selectedStatus.length === 0 || selectedStatus.includes(file.status)) &&
        (selectedAuthority.length === 0 || selectedAuthority.includes(file.authority));
      return matchesSearchQuery && matchesFilters;
    })
  );

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
          {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
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
            <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
          </div>

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

          <div className={`info-box-fih`}>{`Valid Certificates: ${validCount}`}</div>
          <div className={`info-box-fih trashed`}>{`Invalid Certificates: ${invalidCount}`}</div>

          <div className="spacer"></div>

          <TopBarFP openSort={openSortModal} />
        </div>

        <div className="table-container-file">
          <table>
            <thead>
              <tr>
                <th className="flame-certification-num-filter col">Nr</th>
                <th className="flame-certification-auth-filter col">Certification Body</th>
                <th className="flame-certification-license-nr-filter col">Accreditation Number</th>
                <th className="flame-certification-license-date-filter col">Initial Accreditation Date</th>
                <th className="flame-certification-license-date-filter col">Expiry Date</th>
                <th className="flame-certification-status-filter col">Status</th>
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
                <tr key={index} className={`file-info-row-height`}>
                  <td className="col">{index + 1}</td>
                  <td className="col" style={{ textAlign: "center" }}>{file.authority}</td>
                  <td className="file-name-cell" style={{ textAlign: "center" }}>{(file.licenseNumber)}</td>
                  <td className="col">{formatDate(file.licenseIssueDate)}</td>
                  <td className={`col`}>{formatDate(file.licenseExpiryDate)}</td>
                  <td className={`col ${getComplianceColor(file.status)}`}>{file.status}</td>
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<td className={"col-act"}>
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
                  </td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSortModalOpen && (<SortPopupCertifiers closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} assetType={false} />)}
      {upload && (<UploadCertifierLicense onClose={closeUpload} />)}
      {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={downloadFileName} loading={loading} />)}
      {modify && (<UpdateCertifierLicense onClose={closeModify} certifierData={certifierEdit} />)}
      {isModalOpen && (<DeleteCertifiers closeModal={closeModal} deleteFile={deleteFile} loading={loading} selectedFileName={selectedFileName} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofCertifiers;