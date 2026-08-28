import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCloudUploadAlt, faUsersCog, faSitemap, faCaretLeft, faCaretRight, faPersonChalkboard, faDownload, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { saveAs } from "file-saver";
import ImportSiteInfo from "../UploadPage/ImportSiteInfo";
import ExportSIDPopup from "../Popups/ExportSIDPopup";
import { getCurrentUser, can, isAdmin, canIn } from "../../utils/auth";
import ChangeReasonSGI from "./ChangeReasonSGI";

const SGIAdminPage = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const access = getCurrentUser();
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [exportLoad, setExportLoad] = useState(false);
    const [importSI, setImportSI] = useState(false);
    const [selectedImportFile, setSelectedImportFile] = useState(null);
    const [changeReasonOpen, setChangeReasonOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clearLoading, setClearLoading] = useState(false);
    const navigate = useNavigate();

    const exportSID = async () => {
        try {
            setExportLoad(true);

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
            setExportLoad(false);

            toast.success("Site General Information successfully exported.", { autoClose: "2000", closeButton: false })
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

    const clearSiteInfo = async () => {
        const confirmed = window.confirm(
            "This will permanently clear ALL Site General Information data (Abbreviations, PPE, Equipment, Sites, and every other section). This cannot be undone. Are you sure you want to continue?"
        );

        if (!confirmed) return;

        try {
            setClearLoading(true);

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/siteInfo/clear-site-info`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            let result = null;
            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok) {
                throw new Error(result?.message || result?.error || "Failed to clear Site General Information.");
            }

            toast.success("Site General Information has been cleared.", { autoClose: 2000, closeButton: false });
        } catch (error) {
            console.error("Error clearing Site General Information:", error);
            toast.error(
                error.message || "Error clearing Site General Information. Please try again.",
                { closeButton: false, autoClose: 1200, style: { textAlign: "center" } }
            );
        } finally {
            setClearLoading(false);
        }
    };

    const handleSubmitImport = async (reason) => {
        if (!selectedImportFile) {
            toast.error("No file selected for upload.", {
                closeButton: false,
                autoClose: 800,
                style: { textAlign: "center" }
            });
            return;
        }

        const formData = new FormData();
        formData.append("excel", selectedImportFile);
        formData.append("reason", reason);

        try {
            setLoading(true);

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/siteInfo/upload-single-sheet-excel/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: formData,
                }
            );

            let result = null;
            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (response.ok) {
                toast.success("Values have been successfully imported", {
                    closeButton: false,
                    autoClose: 800,
                    style: { textAlign: "center" }
                });

                setChangeReasonOpen(false);
                setSelectedImportFile(null);
            } else {
                console.error("Upload failed:", result);

                toast.error(
                    result?.message ||
                    "Upload failed. The Excel format may be incorrect or has been modified.",
                    {
                        closeButton: false,
                        autoClose: 1200,
                        style: { textAlign: "center" }
                    }
                );
            }
        } catch (error) {
            console.error("Upload error:", error);

            toast.error(
                "An error occurred while uploading. Please check your connection or try again.",
                {
                    closeButton: false,
                    autoClose: 1200,
                    style: { textAlign: "center" }
                }
            );
        } finally {
            setLoading(false);
        }
    };

    const openImportSI = () => {
        setImportSI(true);
    };

    const closeImportSI = () => {
        setImportSI(false);
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

    const handleImportFileSelected = (file) => {
        setSelectedImportFile(file);
        setImportSI(false);
        setChangeReasonOpen(true);
    };

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Admin Page</p>
                    </div>


                    <div className="sidebar-logo-dm-fi">
                        <img src={`/ddsAdmin2.svg`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"SGI Admin"}</p>
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
                {importSI && (<ImportSiteInfo onClose={closeImportSI} onFileSelected={handleImportFileSelected} />)}

                {changeReasonOpen && (
                    <ChangeReasonSGI
                        isOpen={changeReasonOpen}
                        onClose={() => setChangeReasonOpen(false)}
                        onSubmit={handleSubmitImport}
                        loading={loading}
                    />
                )}

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
                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home`} onClick={openImportSI}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/importSIDAdmin2.svg`} className={"icon-dept"} />
                                </div>
                                <h3 className="document-title-fi-home">Import Site General Information</h3>
                            </>
                        </div>
                    )}

                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home`} onClick={exportSID}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/exportSIDAdmin2.svg`} className={"icon-dept"} />
                                </div>
                                <h3 className="document-title-fi-home">Export Site General Information</h3>
                            </>
                        </div>
                    )}

                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/sgiBackups")}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/importSIDAdminHome2.svg`} className={"icon-dept"} />
                                </div>
                                <h3 className="document-title-fi-home">View Site General Information Backups</h3>
                            </>
                        </div>
                    )}

                    {(can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/sgiVersionHistory")}>
                            <>
                                <div className="icon-dept">
                                    <img src={`${process.env.PUBLIC_URL}/importSIDAdminHome2.svg`} className={"icon-dept"} />
                                </div>
                                <h3 className="document-title-fi-home">View Site General Information Version History</h3>
                            </>
                        </div>
                    )}

                    {false && (can(access, "RMS", "systemAdmin") || isAdmin(access) || can(access, "DDS", "systemAdmin")) && (
                        <div className={`document-card-fi-home`} onClick={clearLoading ? undefined : clearSiteInfo}>
                            <>
                                <div className="icon-dept">
                                    {clearLoading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="icon-dept" />
                                    ) : (
                                        <FontAwesomeIcon icon={faTrash} className="icon-dept" />
                                    )}
                                </div>
                                <h3 className="document-title-fi-home">Clear Site General Information</h3>
                            </>
                        </div>
                    )}
                </div>
            </div>
            {exportLoad && (<ExportSIDPopup />)}
            <ToastContainer />
        </div>
    );
};

export default SGIAdminPage;