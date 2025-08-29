import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faArrowLeft, faSearch, faFileCirclePlus, faCaretLeft, faCaretRight, faTruck, faIndustry, faHammer, faDrumSteelpan, faCogs, faTruckMonster, faTractor } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import ChangePassword from "../UserManagement/ChangePassword";
import { getCurrentUser, can, isAdmin, canIn } from "../../utils/auth";
import UploadChoiceFPM from "./Popups/UploadChoiceFPM";
import UploadMasterPopup from "./Popups/UploadMasterPopup";
import UploadComponentPopup from "./Popups/UploadComponentPopup";
import RegisterAssetPopup from "./Popups/RegisterAssetPopup";

const FlameProofHome = () => {
    const [error, setError] = useState(null);
    const site = useParams().site;
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const access = getCurrentUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(false);
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [popup, setPopup] = useState(null);
    const [uploadAssetNr, setUploadAssetNr] = useState("");
    const [register, setRegister] = useState(false);

    const getInitials = (str = "") =>
        str
            .trim()
            .split(/[\s\/\-_.()]+/)           // split on spaces & common separators
            .filter(Boolean)
            .map(w => w[0].toUpperCase())
            .join("");

    const formatAssetTypeLabel = (assetType = "", isAll = false) => {
        if (isAll) return assetType;        // no initials for the "All {sitename} Assets" row
        const initials = getInitials(assetType);
        return initials ? `${assetType} (${initials})` : assetType;
    };

    const isAllRow = (doc) =>
        doc?._id === "all-assets" || /^All\s/i.test(doc?.assetType || "");

    const closePopup = () => {
        setPopup(null);
    }

    const clearSearch = () => {
        setSearchQuery("");
    };

    const openUpload = () => {
        setUpload(true);
    };

    const closeUpload = () => {
        setUpload(!upload);
    };

    const openRegister = () => {
        setRegister(true);
    };

    const closeRegister = () => {
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

    const filteredDocs = paddedDocs.filter(file => file && file.assetType && file.assetType.toLowerCase().includes(searchQuery.toLowerCase()));

    const fetchCount = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getAssetCount/${site}`, {
                headers: {
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch count');
            }
            const data = await response.json();

            setCount(data.assets);
            console.log(data.assets);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId) {
            fetchCount();
        }
    }, [loggedInUserId]);

    const iconMap = {
        "all-assets": "/allDocumentsDMS.svg",
        "Continuous Miner": "/FCMS_CM.png",
        "Shuttle Car": "/FCMS_SC.png",
        "Roof Bolter": "/FCMS_RB.png",
        "Feeder Breaker": "/FCMS_FB.png",
        "Load Haul Dump": "/FCMS_LHD.png",
        "Tractor": "/FCMS_T.png",
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Flameproof Compliance Management</p>
                    </div>

                    {canIn(access, "FCMS", ["systemAdmin", "contributor"]) && (
                        <>
                            <div className="filter-fih">
                                <p className="filter-text-um">Upload</p>
                                <div className="button-container-fih">
                                    <button className="but-um" onClick={openUpload}>
                                        <div className="button-content">
                                            <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                                            <span className="button-text">Single Certificate</span>
                                        </div>
                                    </button>
                                    <button className="but-um" onClick={openRegister}>
                                        <div className="button-content">
                                            <FontAwesomeIcon icon={faFileCirclePlus} className="button-icon" />
                                            <span className="button-text">Register Single Asset</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <div className="sidebar-logo-dm-fi">
                                <div className="risk-button-container-create-bot">
                                    <button className="but-um" onClick={() => navigate("/FrontendDMS/fcmsAdmin")}>
                                        <div className="button-content">
                                            <img src={`${process.env.PUBLIC_URL}/dmsAdmin.svg`} className={"button-logo-custom"} />
                                            <span className="button-text">Manage FCMS</span>
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="info-box-fih">Number of Certificate Types: {filteredDocs.length}</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    {filteredDocs.map((doc, index) => (
                        <div key={index} className={`${isAllRow(doc) ? "document-card-fi-home-all" : "document-card-fi-home"} ${doc ? "" : "empty-card-fi-home"}`} onClick={() => navigate(`/FrontendDMS/flameManage/${doc.assetType}/${site}`)}>
                            {doc && (
                                <>
                                    <div className={`${isAllRow(doc) ? "all-icon-fi-home" : "icon-dept"}`}>
                                        <img src={`${process.env.PUBLIC_URL}${iconMap[isAllRow(doc) ? doc._id : doc.assetType]}`} className={`${isAllRow(doc) ? "all-icon-fi-home" : "icon-dept"}`} />
                                    </div>
                                    <h3 className="document-title-fi-home">{formatAssetTypeLabel(isAllRow(doc) ? doc.assetType : doc.assetType + "s", isAllRow(doc))}</h3>
                                    <p className="document-info-fi-home">Certificates: {doc.totalCertificates}</p>
                                    <p className="document-info-fi-home">Invalid Certificates: {doc.invalidCertificates}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <ToastContainer />
            {upload && (<UploadChoiceFPM setClose={closeUpload} setPopup={setPopup} setAsset={setUploadAssetNr} />)}
            {popup === "master" && (<UploadMasterPopup onClose={closePopup} assetNr={uploadAssetNr} />)}
            {popup === "component" && (<UploadComponentPopup onClose={closePopup} assetNr={uploadAssetNr} />)}
            {register && (<RegisterAssetPopup onClose={closeRegister} />)}
        </div>
    );
};

export default FlameProofHome;