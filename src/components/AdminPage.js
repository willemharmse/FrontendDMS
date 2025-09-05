import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, can, isAdmin } from "../utils/auth";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import "./AdminPage.css";
import "./FileInfoHome.css"
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadPopup from "./FileInfo/UploadPopup";
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCloudUploadAlt, faUsersCog, faSitemap, faCaretLeft, faCaretRight, faPersonChalkboard } from '@fortawesome/free-solid-svg-icons';
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import BatchUpload from "./FileInfo/BatchUpload";
import {
    faBuilding,
    faBriefcase,
    faUserMd,
    faGraduationCap,
    faGavel,
    faMicrochip,
    faChartLine,
    faFlask,
    faCog,
    faPencilRuler,
    faUsers,
    faBalanceScale,
    faPalette,
    faGlobe,
    faBook,
    faHeadset,
    faHandsHelping,
    faDollarSign,
    faServer,
    faUniversity, faChevronLeft, faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import ImportSiteInfo from "./UploadPage/ImportSiteInfo";
import ImportRiskSiteInfo from "./RiskRelated/ImportRiskSiteInfo";
import TopBar from "./Notifications/TopBar";
import { saveAs } from "file-saver";

const AdminPage = () => {
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [count, setCount] = useState([]);
    const access = getCurrentUser();
    const [importSI, setImportSI] = useState(false);
    const navigate = useNavigate();

    const exportSID = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/siteInfoExport/export-sid`,
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

    const openImportSI = () => {
        setImportSI(true);
    };

    const closeImportSI = () => {
        setImportSI(false);
    };

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    return (
        <div className="user-info-container">
            {importSI && (<ImportSiteInfo onClose={closeImportSI} />)}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src="CH_Logo.svg" alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-um">Admin Page</p>
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

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home-all`} onClick={openImportSI}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/importSIDAdmin.svg`} className={"all-icon-fi-home"} />
                                </div>
                                <h3 className="document-title-fi-home">Import Site General Information</h3>
                            </>
                        </div>
                    )}

                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home-all`} onClick={exportSID}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/exportSIDAdmin.svg`} className={"all-icon-fi-home"} />
                                </div>
                                <h3 className="document-title-fi-home">Export Site General Information</h3>
                            </>
                        </div>
                    )}

                    {isAdmin(access) && (
                        <>
                            <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/userManagement")}>
                                <>
                                    <div className="icon-dept">
                                        <img src={`${process.env.PUBLIC_URL}/adminUsers.svg`} className={"icon-dept"} />
                                    </div>
                                    <h3 className="document-title-fi-home">Manage Users</h3>
                                </>
                            </div>
                            <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/departmentManage")}>
                                <>
                                    <div className="icon-dept">
                                        <img src={`${process.env.PUBLIC_URL}/adminDepartments.svg`} className={"icon-dept"} />
                                    </div>
                                    <h3 className="document-title-fi-home">Manage Departments</h3>
                                </>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default AdminPage;