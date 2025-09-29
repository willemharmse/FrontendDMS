import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faBook, faBookOpen, faCaretLeft, faCaretRight, faCertificate, faChalkboardTeacher, faClipboardCheck, faEdit, faFileAlt, faFileSignature, faHardHat, faHome, faIndustry, faListOl, faMagnifyingGlass, faScaleBalanced, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faFileCirclePlus, faFolderOpen, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser, can, isAdmin, hasRole, canIn } from "../../utils/auth";
import TopBar from "../Notifications/TopBar";
import "./FlameProofMain.css"
import UploadChoiceFPM from "./Popups/UploadChoiceFPM";
import UploadComponentPopup from "./Popups/UploadComponentPopup";
import UploadMasterPopup from "./Popups/UploadMasterPopup";
import RegisterAssetPopup from "./Popups/RegisterAssetPopup";
import DeleteAsset from "./Popups/DeleteAsset";
import SortPopupAsset from "./Popups/SortPopupAsset";
import TopBarFP from "./Popups/TopBarFP";
import ModifyAsset from "./Popups/ModifyAsset";
import ModifyAssetPopup from "./Popups/ModifyAssetPopup";
import ModifyComponentsPopup from "./Popups/ModifyComponentsPopup";
import PopupMenuOptions from "./Popups/PopupMenuOptions";
import PopupMenuOptionsAssets from "./Popups/PopupMenuOptionsAssets";

const FlameProofMain = () => {
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

  const openModify = (asset) => {
    setModifyingAsset(asset)
    setModifyAsset(true);
  };

  const closeModify = () => {
    setModifyingAsset("")
    setModifyAsset(false);
  };

  const openComponentModify = (asset) => {
    setComponentAssetUpdate(asset)
    setOpenComponentUpdate(true);
  };

  const closeComponentModify = () => {
    setComponentAssetUpdate("")
    setOpenComponentUpdate(false);
  };

  const closePopup = () => {
    setPopup(null);
  }

  const getInitials = (str = "") =>
    str
      .trim()
      .split(/[\s\/\-_.()]+/)
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .join("");

  const formatAssetTypeLabel = (assetType = "", isAll = false) => {
    if (isAll) return assetType;
    const initials = getInitials(assetType);
    return initials ? `${assetType}` : assetType;
  };

  const formatAssetTypeLabel2 = (assetType = "", isAll = false) => {
    if (isAll) return assetType;
    const initials = getInitials(assetType);
    return initials ? `${assetType} (${initials})` : assetType;
  };

  const openUpload = () => {
    setUpload(true);
  };

  const closeUpload = (assetNr, id, nav) => {
    setUpload(!upload);
    if (nav) {
      navigate(`/FrontendDMS/flameManageSub/${assetNr}/${id}`)
    }
  };

  const openRegister = () => {
    setRegister(true);
  };

  const closeRegister = () => {
    setRegister(!register);
  };

  const openModifyDate = (asset) => {
    setAssetID(asset._id);
    setModifyDate(true);
  };

  const closeModifyDate = () => {
    setModifyDate(!modifyDate);
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
      if (!type.includes("All")) {
        getSiteName();
      }
    }
  }, [token]);

  const deleteAsset = async () => {
    if (!selectedFileId) return;
    try {
      setLoading(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/assets/${selectedFileId}/permanent`, {
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

  // put this near the top (outside component) or inside the component before usage
  const natCompare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const sortByAssetNr = (arr) =>
    [...arr].sort((a, b) => natCompare.compare(a.assetNr || '', b.assetNr || ''));

  const fetchFiles = async () => {
    setIsLoadingTable(true);
    const route = `/api/flameproof/assets/${site}/type/${type}`;
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
      const sortedFiles = sortByAssetNr(data.assets);
      setFiles(sortedFiles);

      const uniqueOpAreas = [...new Set(data.assets.map(file => file.operationalArea))].sort();
      const uniqueStatus = [...new Set(data.assets.map(file => file.complianceStatus))].sort();
      const uniqueTypes = [...new Set(data.assets.map(file => file.assetType))].sort();

      setAreas(uniqueOpAreas);
      setStatus(uniqueStatus);
      setAssetTypes(uniqueTypes);
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

  const isAll = typeof type === "string" && type.includes("All");

  const getIcon = (t) => {
    if (isAll) return iconMap["all-assets"];
    return iconMap[t] || "/genericAssetType2.svg";
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

  const filteredFiles = files.filter((file) => {
    const matchesSearchQuery = (
      file.assetNr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.operationalArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.assetOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.departmentHead.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const matchesFilters =
      (selectedArea.length === 0 || selectedArea.includes(file.operationalArea)) &&
      (selectedAssetType.length === 0 || selectedAssetType.includes(file.assetType)) &&
      (selectedStatus.length === 0 || selectedStatus.includes(file.complianceStatus));

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
            <p className="logo-text-um">Flameproof Management</p>
          </div>

          <div className="filter-dm-fi">
            <p className="filter-text-dm-fi">Filter</p>
            <div className="button-container-dm-fi">
              {type.includes("All") && (<div className="fi-info-popup-page-select-container">
                <Select options={assetTypes.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedAssetType(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Asset Type"
                  classNamePrefix="sb" />
              </div>)}
              <div className="fi-info-popup-page-select-container">
                <Select options={areas.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedArea(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Area"
                  classNamePrefix="sb" />
              </div>
              <div className="fi-info-popup-page-select-container">
                <Select options={status.map(d => ({ value: d, label: d }))} isMulti onChange={(selected) => setSelectedStatus(selected.map(s => s.value))} className="sidebar-select remove-default-styling" placeholder="Compliance Status"
                  classNamePrefix="sb" />
              </div>
            </div>
          </div>
          {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
            <div className="filter-dm-fi-2">
              <div className="button-container-dm-fi">
                <button className="but-dm-fi" onClick={openUpload}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                    <span className="button-text">Upload Single Certificate</span>
                  </div>
                </button>
                <button className="but-dm-fi" onClick={openRegister}>
                  <div className="button-content">
                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                    <span className="button-text">Register Single Asset</span>
                  </div>
                </button>
              </div>
            </div>
          )}
          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}${getIcon(type)}`} alt="Logo" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{(`${type.includes("All") ? type : type + "s"}`)}</p>
            {!type.includes("All") && (<p className="logo-text-dm-fi" style={{ marginTop: "0px" }}>{siteName}</p>)}
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
              placeholder="Search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
            {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
          </div>

          <div className={`info-box-fih`}>{type.includes("All") ? `Number of Assets: ${filteredFiles.length}` : `Number of ${formatAssetTypeLabel(type + "s", type.includes("All"))}: ${filteredFiles.length}`}</div>

          <div className="spacer"></div>

          <TopBarFP openSort={openSortModal} />
        </div>

        <div className="table-container-file">
          <table>
            <thead>
              <tr>
                <th className="flame-num-filter col">Nr</th>
                {type.includes("All") && (<th className="flame-type-filter col">Asset Type</th>)}
                <th className="flame-ass-nr-filter col">Asset Nr</th>
                <th className="flame-area-filter col">Area</th>
                <th className="flame-owner-filter col">Asset Owner</th>
                <th className={`flame-head-filter`}>Department Head</th>
                <th className={`flame-status-filter col`}>Compliance Status</th>
                {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<th className="flame-act-filter col">Action</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoadingTable && (
                <tr>
                  <td colSpan={
                    6 + (type.includes("All") ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)
                  } style={{ textAlign: "center", padding: 20 }}>
                    <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading assets.
                  </td>
                </tr>
              )}

              {!isLoadingTable && showNoAssets && (
                <tr>
                  <td colSpan={
                    6 + (type.includes("All") ? 1 : 0) + (canIn(access, "FCMS", ["systemAdmin", "contributor"]) ? 1 : 0)
                  } style={{ textAlign: "center", padding: 20 }}>
                    No Assets Registered.
                  </td>
                </tr>
              )}

              {filteredFiles.map((file, index) => (
                <tr key={index} className={`file-info-row-height`} style={{ cursor: "pointer" }}
                  onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                  <td className="col">{index + 1}</td>
                  {type.includes("All") && (<td className="col" style={{ textAlign: "center" }}>{file.assetType}</td>)}
                  <td
                    className="file-name-cell"
                    style={{ textAlign: "center" }}
                  >
                    {(file.assetNr)}

                    {(hoveredFileId === file._id) && (
                      <PopupMenuOptionsAssets file={file} isOpen={hoveredFileId === file._id} setHoveredFileId={setHoveredFileId} canIn={canIn} access={access} openModifyModal={openComponentModify} />
                    )}
                  </td>
                  <td className="col">{file.operationalArea}</td>
                  <td className={`col`}>{(file.assetOwner)}</td>
                  <td className="col">{file.departmentHead}</td>

                  <td className={`col ${getComplianceColor(file.complianceStatus)}`}>{(file.complianceStatus)}</td>
                  {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (<td className={"col-act"}>
                    <button
                      className={"flame-delete-button-fi col-but-res"}
                      onClick={(e) => {
                        e.stopPropagation();         // ⛔ prevent row click
                        openModify(file);
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} title="Modify Asset" />
                    </button>
                    {false && (<button
                      className={"flame-delete-button-fi col-but-res"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModifyDate(file);
                      }}
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} title="Modify Components" />
                    </button>)}
                    <button
                      className={"flame-delete-button-fi col-but"}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(file._id, file);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} title="Delete Asset" />
                    </button>
                  </td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (<DeleteAsset closeModal={closeModal} deleteAsset={deleteAsset} asset={selectedAsset} />)}
      {isSortModalOpen && (<SortPopupAsset closeSortModal={closeSortModal} handleSort={handleSort} setSortField={setSortField} setSortOrder={setSortOrder} sortField={sortField} sortOrder={sortOrder} />)}
      {upload && (<UploadComponentPopup onClose={closeUpload} refresh={fetchFiles} site={site} assetType={type.includes("All") ? "" : type} />)}
      {register && (<RegisterAssetPopup onClose={closeRegister} refresh={fetchFiles} preSelectedSite={site} assetType={type} />)}
      {modifyAsset && (<ModifyAssetPopup onClose={closeModify} asset={modifyingAsset} refresh={fetchFiles} />)}
      {modifyDate && <ModifyComponentsPopup onClose={closeModifyDate} asset={assetID} />}
      {openComponentUpdate && (<ModifyComponentsPopup asset={componentAssetUpdate} onClose={closeComponentModify} refresh={fetchFiles} />)}
      <ToastContainer />
    </div >
  );
};

export default FlameProofMain;