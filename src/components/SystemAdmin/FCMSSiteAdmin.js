import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCloudUploadAlt, faUsersCog, faSitemap, faCaretLeft, faCaretRight, faPersonChalkboard, faDownload } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import BatchUpload from "../FileInfo/BatchUpload";
import BatchCertificates from "../FlameproofDMS/Popups/BatchCertificates";
import BatchAssets from "../FlameproofDMS/Popups/BatchAssets";
import AddSite from "../FlameproofDMS/Popups/AddSite";
import FCMSTemplates from "../FlameproofDMS/Popups/FCMSTemplates";
import ManageSites from "../FlameproofDMS/Popups/ManageSites";
import ManageAssetTypes from "../FlameproofDMS/Popups/ManageAssetTypes";
import ManageDeletedSites from "../FlameproofDMS/Popups/ManageDeletedSites";

const FCMSSiteAdmin = () => {
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
    const navigate = useNavigate();

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

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    // Add placeholders if fewer than 12
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    if (error) {
        return <div>Error: {error}</div>;
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
                        <p className="logo-text-um">Manage FM Sites</p>
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
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    <div className={`document-card-fi-home`} onClick={openManageSite} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/fmsNewSite.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Active Sites</h3>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={openManageDeletedSite} >
                        <>
                            <div className="icon-dept-deleted-sites">
                                <img src={`${process.env.PUBLIC_URL}/fmsSiteDelete.svg`} className={"icon-dept-deleted-sites"} />
                            </div>
                            <h3 className="document-title-fi-home">Deleted Sites</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />

            {manageDeletedSite && (<ManageDeletedSites closePopup={closeManageDeletedSite} />)}
            {manageSite && (<ManageSites closePopup={closeManageSite} />)}
        </div>
    );
};

export default FCMSSiteAdmin;