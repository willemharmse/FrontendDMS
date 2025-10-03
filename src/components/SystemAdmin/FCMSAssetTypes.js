import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faFileCirclePlus, faSearch, faX } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import ManageSites from "../FlameproofDMS/Popups/ManageSites";
import ManageDeletedSites from "../FlameproofDMS/Popups/ManageDeletedSites";
import ManageAssetTypes from "../FlameproofDMS/Popups/ManageAssetTypes";
import AssetManageAssetComponents from "../FlameproofDMS/Popups/AssetManageAssetComponents";
import AddAssetType from "../FlameproofDMS/Popups/AddAssetType";

const FCMSAssetTypes = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [batch, setBatch] = useState(false);
    const [assets, setAssets] = useState(false);
    const [site, setSite] = useState(false);
    const [manageSite, setManageSite] = useState(false);
    const [manageDeletedSite, setManageDeletedSite] = useState(false);
    const [manageAsset, setManageAsset] = useState(false);
    const [template, setTemplate] = useState(false);
    const [files, setFiles] = useState([]);
    const [type, setType] = useState('');
    const [newAsset, setNewAsset] = useState(false);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const openManageAsset = (type) => {
        setType(type);
        setManageAsset(true);
    };

    const clearSearch = () => {
        setSearchQuery("");
    }

    const closeManageAsset = () => {
        setType("");
        setManageAsset(!manageAsset);
    };

    const openNewAsset = () => {
        setNewAsset(true);
    };

    const closeNewAsset = () => {
        setNewAsset(!newAsset);
        fetchValues();
    };

    const openManageSite = () => {
        setManageSite(true);
    };

    const closeManageSite = () => {
        setManageSite(!manageSite);
    };

    const openManageDeletedSite = () => {
        setManageDeletedSite(true);
    };

    const closeManageDeletedSite = () => {
        setManageDeletedSite(!manageDeletedSite);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
            setloggedInUserId(decodedToken.userId);
        }
    }, [navigate]);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/assetTypesCounts`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');
            const data = await response.json();
            const sorted = data.types.sort((a, b) => (a?.type || '').localeCompare(b?.type || ''));
            setFiles(sorted);
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const TOTAL_SLOTS = 12;
    const paddedDocs = [...files];
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const iconMap = {
        "all-assets": "/allDocumentsDMS.svg",
        "Continuous Miner": "/FCMS_CM.png",
        "Shuttle Car": "/FCMS_SC.png",
        "Roof Bolter": "/FCMS_RB.png",
        "Feeder Breaker": "/FCMS_FB.png",
        "Load Haul Dumper": "/FCMS_LHD.png",
        "Tractor": "/FCMS_T.png",
    }

    const getIcon = (type) => {
        return iconMap[type] || "/genericAssetType.svg";
    }

    const filteredFiles = files.filter((file) => {
        const q = searchQuery.toLowerCase();

        const matchesSearchQuery = (
            (file.type || "").toLowerCase().includes(q)
        );

        return matchesSearchQuery;
    });

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
                    <div className="filter-dm-fi-2">
                        <div className="button-container-dm-fi">
                            <button className="but-dm-fi" onClick={openNewAsset}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFileCirclePlus} className="button-logo-custom" />
                                    <span className="button-text">Register Asset Type</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/fmsManageAssets2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Manage Assets"}</p>
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
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    {filteredFiles.map((doc, index) => (
                        <div key={doc._id} className={`document-card-fi-home`} onClick={() => navigate(`/FrontendDMS/flameproofComponents/${doc.type}/${doc._id}`)} >
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}${getIcon(doc.type)}`} className={"icon-dept"} />
                                </div>
                                <h3 className="document-title-fi-home">{doc.type}</h3>
                            </>
                        </div>
                    ))}
                </div>
            </div>
            <ToastContainer />

            {newAsset && (<AddAssetType isOpen={true} onClose={closeNewAsset} />)}
        </div>
    );
};

export default FCMSAssetTypes;