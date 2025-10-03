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

const FCMSAdminPage = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [token, setToken] = useState('');
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [batch, setBatch] = useState(false);
    const [assets, setAssets] = useState(false);
    const [site, setSite] = useState(false);
    const [manageSite, setManageSite] = useState(false);
    const [template, setTemplate] = useState(false);
    const navigate = useNavigate();

    const openBatch = () => {
        setBatch(true);
    };

    const closeBatch = () => {
        setBatch(!batch);
    };

    const openTemplate = () => {
        setTemplate(true);
    };

    const closeTemplate = () => {
        setTemplate(!template);
    };

    const openManageSite = () => {
        setManageSite(true);
    };

    const closeManageSite = () => {
        setManageSite(!manageSite);
    };

    const openAssets = () => {
        setAssets(true);
    };

    const closeAssets = () => {
        setAssets(!assets);
    };

    const openSite = () => {
        setSite(true);
    };

    const closeSite = () => {
        setSite(!site);
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
            {batch && (<BatchCertificates onClose={closeBatch} />)}
            {assets && (<BatchAssets onClose={closeAssets} />)}
            {site && (<AddSite isOpen={site} onClose={closeSite} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">EPA Management</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um" onClick={openTemplate}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faDownload} className="button-logo-custom" />
                                <span className="button-text">Templates</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/fmsAdminPage.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Manage FMM"}</p>
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
                    <div className={`document-card-fi-home`} onClick={openSite} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/fmsNewSite.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Register New Site</h3>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={openAssets} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/fmsBatch.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Register Multiple Assets</h3>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={openBatch} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/adminBatchUpload.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Upload Batch Certificates</h3>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/flameSites")} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/fmsManageSites.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Manage Sites</h3>
                        </>
                    </div>

                    <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/flameAssets")} >
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/fmsManageAssets.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Manage Assets</h3>
                        </>
                    </div>
                </div>
            </div>
            <ToastContainer />

            {template && (<FCMSTemplates onClose={closeTemplate} />)}
            {manageSite && (<ManageSites closePopup={closeManageSite} />)}
        </div>
    );
};

export default FCMSAdminPage;