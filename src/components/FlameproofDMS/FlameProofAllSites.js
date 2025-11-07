import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faArrowLeft, faSearch, faFileCirclePlus, faCaretLeft, faCaretRight, faTruck, faIndustry, faHammer, faDrumSteelpan, faCogs, faTruckMonster, faTractor, faBuilding, faBars, faCirclePlus, faTableList } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import ChangePassword from "../UserManagement/ChangePassword";
import { getCurrentUser, can, isAdmin, canIn } from "../../utils/auth";
import UploadChoiceFPM from "./Popups/UploadChoiceFPM";
import UploadMasterPopup from "./Popups/UploadMasterPopup";
import UploadComponentPopup from "./Popups/UploadComponentPopup";
import RegisterAssetPopup from "./Popups/RegisterAssetPopup";
import UpdateCertificateModal from "./Popups/UpdateCertificateModal";

const FlameProofAllSites = () => {
    const [error, setError] = useState(null);
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const access = getCurrentUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(false);
    const [register, setRegister] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [popup, setPopup] = useState(null);
    const [uploadAssetNr, setUploadAssetNr] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showDelayedLoading, setShowDelayedLoading] = useState(false);
    const [warehouseCount, setWarehouseCount] = useState([])

    useEffect(() => {
        let timer;
        if (isLoading) {
            // show overlay only if loading exceeds 400ms
            timer = setTimeout(() => setShowDelayedLoading(true), 400);
        } else {
            setShowDelayedLoading(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);

    const goToNextPage = (name, id) => {
        if (name === "All Organisation Assets") {
            navigate("/FrontendDMS/flameAllMineAsset");
        }
        else {
            navigate(`/FrontendDMS/flameManageHome/${id}`);
        }
    }

    const closePopup = () => {
        setPopup(null);
    }

    const clearSearch = () => {
        setSearchQuery("");
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

    const closeRegister = (id, type) => {
        setRegister(!register);
        navigate(`/FrontendDMS/flameproofComponents/${type}/${id}`)
    };

    const exitRegister = () => {
        setRegister(!register);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setloggedInUserId(decodedToken.userId);

        }
    }, [navigate]);

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    const filteredDocs = paddedDocs.filter(file => file && file.site && file.site.toLowerCase().includes(searchQuery.toLowerCase()));

    const fetchCount = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getSites`, {
                headers: {
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            setCount(data.sites);
            setIsLoading(false);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchWarehouse = async () => {
        const route = `/api/flameWarehouse/getWarehouseDocs`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch files (${response.status})`);
            }

            const data = await response.json();

            setWarehouseCount(data.warehouseDocuments);
        } catch (err) {
            setError(err?.message || "Network error");
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchCount();
            fetchWarehouse();
        }
    }, [loggedInUserId]);

    const { validCount, expiredCount, notUploadedCount, invalidCount } = useMemo(() => {
        const v = warehouseCount.filter(f => f.status.toLowerCase() === "valid").length;
        const e = warehouseCount.filter(f => f.status.toLowerCase() === "invalid").length;
        const n = warehouseCount.filter(f => f.status.toLowerCase() === "Not Uploaded").length;
        return { validCount: v, expiredCount: e, notUploadedCount: n, invalidCount: e + n };
    }, [warehouseCount]);

    const iconMap = {
        "All Organisation Assets": "allDocumentsDMS.svg",
        default: "fmsSiteIcon.svg"
    }

    const getIcon = (site) => `/${iconMap[site] ?? iconMap.default}`;

    const ALL_SITE_LABEL = "All Organisation Assets";

    // use the raw data (not padded) to avoid null placeholders affecting the count
    const siteCount = count
        .filter(d => d && d.site && d.site.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(d => d.site !== ALL_SITE_LABEL)
        .length;

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">EPA Management</p>
                    </div>

                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                        <>
                            <div className="button-container-create">
                                <button className="but-um" onClick={openUpload}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                                        <span className="button-text">Upload Single Certificate</span>
                                    </div>
                                </button>
                                <button className="but-um" onClick={openRegister}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faTableList} className="button-logo-custom" />
                                        <span className="button-text">Register Single Asset</span>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                    {canIn(access, "FCMS", ["systemAdmin"]) && (<>
                        <div className="sidebar-logo-dm-fi">
                            <div className="risk-button-container-create-bot">
                                <button className="but-um" onClick={() => navigate("/FrontendDMS/fcmsAdmin")}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faBars} src={`${process.env.PUBLIC_URL}/dmsAdmin.svg`} size="xs" className={"button-logo-custom"} />
                                        <span className="button-text">Manage FMM</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                    )}
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-fih">Number of Sites: {siteCount}</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    {showDelayedLoading && (
                        <div className="file-info-loading" role="status" aria-live="polite" aria-label="Loading">
                            <div className="file-info-loading__spinner" />
                            <div className="file-info-loading__text">Loading Sites</div>
                        </div>
                    )}

                    {filteredDocs.map((doc, index) => (
                        <div key={index} className={`${doc.site === "All Organisation Assets" ? "document-card-fi-home-all" : "document-card-fi-home"} ${doc ? "" : "empty-card-fi-home"}`} onClick={() => goToNextPage(doc.site, doc._id)}>
                            {doc && (
                                <>
                                    <div className={`${doc.site === "All Organisation Assets" ? "all-icon-fi-home" : "flame-ph-icon"}`}>
                                        <img src={`${process.env.PUBLIC_URL}${getIcon(doc.site)}`} className={`${doc.site === "All Organisation Assets" ? "all-icon-fi-home" : "icon-dept"}`} />
                                    </div>
                                    <h3 className="document-title-fi-home">{doc.site}</h3>
                                    <p className="document-info-fi-home">Certificates: {doc.totalCertificates}</p>
                                    <p className="document-info-fi-home">Invalid Certificates: {doc.invalidCertificates}</p>
                                </>
                            )}
                        </div>
                    ))}
                    {false && !isLoading && (<div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/flameDigitalWarehouse")}>
                        <div className={`flame-ph-icon`} >
                            <img src={`${process.env.PUBLIC_URL}/flameWarehouse1.svg`} className={`icon-dept`} />
                        </div>
                        <h3 className="document-title-fi-home">Digital Warehouse</h3>
                        <p className="document-info-fi-home">Certificates: {warehouseCount.length}</p>
                        <p className="document-info-fi-home">Invalid Certificates: {invalidCount}</p>
                    </div>)}
                </div>
            </div>
            <ToastContainer />
            {upload && (<UploadComponentPopup onClose={closeUpload} refresh={fetchCount} />)}
            {register && (<RegisterAssetPopup onClose={closeRegister} refresh={fetchCount} exit={exitRegister} />)}
        </div>
    );
};

export default FlameProofAllSites;