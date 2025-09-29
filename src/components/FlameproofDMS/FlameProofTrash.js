import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash, faRotate, faX, faFileCirclePlus, faSearch, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
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

const FlameProofTrash = () => {
  const [files, setFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const access = getCurrentUser();
  const [hoveredFileId, setHoveredFileId] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("ascending");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [status, setStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [showNoAssets, setShowNoAssets] = useState(false);

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
    if (token && hasRole(access, "DMS")) {
      fetchFiles();
    }
  }, [token]);

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

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    const route = `/api/flameproof/trash/load`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();

      console.log(data);

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

  const formatStatus = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString); // Convert to Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
    return `${year}-${month}-${day}`;
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

  const getComplianceColor = (status) => {
    if (status === "valid") return "status-good";
    if (status === "invalid") return "status-worst";
  };

  const filteredFiles = useMemo(() => {
    const fs = files.filter((file) => {
      const q = searchQuery.toLowerCase();
      const matchesSearchQuery = (
        file.asset.assetNr.toLowerCase().includes(q) ||
        file.asset.operationalArea.toLowerCase().includes(q) ||
        file.asset.assetOwner.toLowerCase().includes(q) ||
        file.certAuth.toLowerCase().includes(q) ||
        file.certNr.toLowerCase().includes(q) ||
        file.asset.departmentHead.toLowerCase().includes(q) ||
        (file.component || "").toLowerCase().includes(q)
      );

      const matchesFilters =
        (selectedArea.length === 0 || selectedArea.includes(file.asset.operationalArea)) &&
        (selectedStatus.length === 0 || selectedStatus.includes(file.status)) &&
        (selectedType.length === 0 || selectedType.includes(file.asset.assetType));

      return matchesSearchQuery && matchesFilters;
    });

    const isMaster = (f) => (f.component || "").toLowerCase() === "master";

    const cmp = (a, b) => {
      const ca = (a.component || "").toLowerCase();
      const cb = (b.component || "").toLowerCase();

      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;

      const byComponent = ca.localeCompare(cb, undefined, { numeric: true, sensitivity: "base" });
      if (byComponent !== 0) return byComponent;

      // tiebreaker: asset number (optional)
      const an = (a.asset?.assetNr || "").toLowerCase();
      const bn = (b.asset?.assetNr || "").toLowerCase();
      return an.localeCompare(bn, undefined, { numeric: true, sensitivity: "base" });
    };

    const masters = fs.filter(isMaster);
    const others = fs.filter((f) => !isMaster(f)).sort(cmp);

    return [...masters, ...others];
  }, [files, searchQuery, selectedArea, selectedStatus, selectedType]);

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
            <p className="logo-text-um">Flameproof Management</p>
          </div>

          <div className="filter-dm-fi">
            <p className="filter-text-dm-fi">Filter</p>
            <div className="button-container-dm-fi">
              <div className="fi-info-popup-page-select-container">
                <Select options={types.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedType(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Asset Type"
                  classNamePrefix="sb" />
              </div>
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
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/trashIcon.svg`} className="icon-risk-rm" />
            <p className="logo-text-dm-fi">Trash</p>
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
              autoComplete="off"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          <div className={`info-box-fih trashed`}>Number of Deleted Certificates: {filteredFiles.length}</div>

          <div className="spacer"></div>

          <TopBarFPC canIn={canIn} access={access} openSort={openSortModal} />
        </div>

        <div className="table-container-file">
          <table>
            <thead>
              <tr className={'trashed'}>
                <th className="flame-trash-num-filter col" style={{ fontSize: "14px" }}>Nr</th>
                <th className="flame-trash-site-filter col" style={{ fontSize: "14px" }}>Site</th>
                <th className="flame-trash-type-filter col" style={{ fontSize: "14px" }}>Asset Type</th>
                <th className="flame-trash-ass-nr-filter col">Asset Nr</th>
                <th className="flame-trash-area-filter col">Area</th>
                <th className="flame-trash-owner-filter col">Asset Owner</th>
                <th className="flame-trash-cert-filter col">Certificate Nr</th>
                <th className="flame-trash-comp-filter col">Component</th>
                <th className={`flame-trash-head-filter`}>Department Head</th>
                <th className={`flame-trash-status-filter col`}>Status</th>
                <th className="flame-trash-date-filter col">Issue Date</th>
                <th className="flame-trash-act-filter col" style={{ fontSize: "14px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTable && (
                <tr>
                  <td colSpan={
                    12
                  } style={{ textAlign: "center", padding: 20 }}>
                    <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading removed certificates.
                  </td>
                </tr>
              )}

              {!isLoadingTable && showNoAssets && (
                <tr>
                  <td colSpan={
                    12
                  } style={{ textAlign: "center", padding: 20 }}>
                    No Removed Certificates Found.
                  </td>
                </tr>
              )}

              {filteredFiles.map((file, index) => (
                <tr key={index} style={{ fontSize: "14px", cursor: "pointer" }} className={`tr-trash file-info-row-height`} onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                  <td className="col">{index + 1}</td>
                  <td
                    style={{ textAlign: "center" }}
                    className="col"
                  >
                    {(file.asset.site.site)}
                  </td>
                  <td

                    style={{ textAlign: "center" }}
                    className="col"
                  >
                    {(file.asset.assetType)}
                  </td>
                  <td
                    className="col" style={{ textAlign: "center", position: "relative" }}
                  >
                    {file.asset.assetNr}
                  </td>
                  <td
                    style={{ textAlign: "center" }}
                    className="col"
                  >
                    {(file.asset.operationalArea)}
                  </td>
                  <td className="col">{file.asset.assetOwner}</td>
                  <td className="col">{file.certNr}</td>
                  <td className="col">{formatStatus(file.component)}</td>
                  <td className="col">{file.asset.departmentHead}</td>
                  <td className={`col ${getComplianceColor(file.status)}`}>{formatStatus(file.status)}</td>
                  <td className={`col`}>{formatDate(file.issueDate)}</td>
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                    <td className={"col-act trashed"}>
                      <button
                        className={"delete-button-fi col-but trashed-color"}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(file._id, file.fileName);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} title="Delete Document" />
                      </button>

                      <button
                        className={"delete-button-fi col-but-res trashed-color"}
                        onClick={() => restoreFile(file._id)}
                      >
                        <FontAwesomeIcon icon={faRotate} title="Restore Document" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (<DeleteCertificate closeModal={closeModal} deleteFileFromTrash={deleteFileFromTrash} isTrashView={true} loading={loading} selectedFileName={selectedFileName} />)}
      {isSortModalOpen && (<SortPopupCertificates closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofTrash;