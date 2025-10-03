import React, { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faDownload, faDownLong, faEdit, faSpinner, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";
import TopBar from "../Notifications/TopBar";
import { useParams, useNavigate } from "react-router-dom";
import ModifySerialDate from "./Popups/ModifySerialDate";
import AssetComponentManagePopup from "./Popups/AssetComponentManagePopup";
import ComponentManagePopup from "./Popups/ComponentManagePopup";

const ManageComponentAssets = () => {
    const { type, id } = useParams();
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [updateType, setUpdateType] = useState("");
    const [update, setUpdate] = useState(false);
    const [updateBase, setUpdateBase] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [originalComponents, setOriginalComponents] = useState([]);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [showNoAssets, setShowNoAssets] = useState(false);
    const navigate = useNavigate();

    const openUpdateSiteName = (updateType) => {
        setUpdateType(updateType);
        if (updateType.isBaseAsset || updateType.isBaseComponent) {
            setUpdateBase(true);
        } else {
            setUpdate(true);
        }
    };

    const closeUpdateSiteName = () => {
        setUpdateType("");
        setUpdate(false);
        setUpdateBase(false);
        fetchValues();
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            console.log(userID);
        }
    }, []);

    const fetchValues = async () => {
        setIsLoadingTable(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/assets/by-type/${id}`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');
            const data = await response.json();

            const assets = data.assets || [];
            const base = assets.find(d => d?.isBaseAsset || d?.isBaseComponent);
            const others = assets.filter(d => !(d?.isBaseAsset || d?.isBaseComponent));

            const sortedOthers = others.sort((a, b) =>
                (a?.assetNr || '').localeCompare(b?.assetNr || '')
            );

            const finalList = base ? [base, ...sortedOthers] : sortedOthers;

            setFiles(finalList);
            setOriginalComponents(Array.isArray(base?.components) ? base.components : []);
        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoadingTable(false);
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const filteredFiles = files;

    useEffect(() => {
        if (!isLoadingTable) {
            if (filteredFiles.length === 0) {
                const t = setTimeout(() => setShowNoAssets(true), 800);
                return () => clearTimeout(t);
            }
            setShowNoAssets(false);
        }
    }, [isLoadingTable, filteredFiles.length]);

    const iconMap = {
        "all-assets": "/allDocumentsDMS.svg",
        "Continuous Miner": "/FCMS_CM2.png",
        "Shuttle Car": "/FCMS_SC2.png",
        "Roof Bolter": "/FCMS_RB2.png",
        "Feeder Breaker": "/FCMS_FB2.png",
        "Load Haul Dumper": "/FCMS_LHD2.png",
        "Tractor": "/FCMS_T2.png",
    }

    const getIcon = (t) => {
        return iconMap[t] || "/genericAssetType2.svg";
    };

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
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}${getIcon(type)}`} alt="Logo" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Manage " + type + "s"}</p>
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

                    <div className="spacer"></div>

                    <TopBar />
                </div>

                <div className="table-container-file">
                    <table>
                        <thead>
                            <tr>
                                <th className="col" style={{ width: "5%" }}>Nr</th>
                                <th className="col" style={{ width: "30%" }}>Asset Number</th>
                                <th className="col" style={{ width: "25%" }}>Site</th>
                                <th className="col" style={{ width: "35%" }}>Number of Flameproof Components</th>
                                <th className="col" style={{ width: "5%" }}>Action</th></tr>
                        </thead>
                        <tbody>
                            {isLoadingTable && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                                        <FontAwesomeIcon icon={faSpinner} spin /> &nbsp; Loading registered assets.
                                    </td>
                                </tr>
                            )}

                            {!isLoadingTable && showNoAssets && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                                        No Assets Registered.
                                    </td>
                                </tr>
                            )}

                            {filteredFiles.map((file, index) => (
                                <tr key={index} className={`file-info-row-height`}>
                                    <td className="col">{index + 1}</td>
                                    <td style={{ textAlign: "center" }} className="col">{(file.assetNr) ?? ""}</td>
                                    <td style={{ textAlign: "center" }} className="col">{file.site?.site ?? "-"}</td>
                                    <td style={{ textAlign: "center" }} className="col">{file.componentCount}</td>
                                    <td className={"col-act"}>
                                        <button
                                            className={"modify-asset-button-fi col-but-res"}
                                            title={file.isBaseAsset || file.isBaseComponent ? "Edit Standard Asset" : "Edit Asset Components"}
                                        >
                                            <FontAwesomeIcon icon={faEdit} onClick={() => openUpdateSiteName(file)} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {update && (
                <AssetComponentManagePopup
                    isOpen={true}
                    closePopup={closeUpdateSiteName}
                    asset={updateType}
                    originalComponents={originalComponents}
                />
            )}

            {updateBase && (
                <ComponentManagePopup
                    closePopup={closeUpdateSiteName}
                    assetType={updateType}
                />
            )}
            <ToastContainer />
        </div >
    );
};

export default ManageComponentAssets;