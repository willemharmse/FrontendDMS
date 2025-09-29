import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash, faX, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import RenameSite from "./RenameSite";
import DeleteSitePopup from "./DeleteSitePopup";
import ComponentManagePopup from "./ComponentManagePopup";
import AssetComponentManagePopup from "./AssetComponentManagePopup";

const AssetManageAssetComponents = ({ closePopup, type }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState([]);
    const [updateType, setUpdateType] = useState("");
    const [update, setUpdate] = useState(false);
    const [updateBase, setUpdateBase] = useState(false);
    const [originalComponents, setOriginalComponents] = useState([]);

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

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/assets/by-type/${type._id}`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');
            const data = await response.json();

            const assets = data.assets || [];
            const base = assets.find(d => d?.isBaseAsset || d?.isBaseComponent);
            const others = assets.filter(d => !(d?.isBaseAsset || d?.isBaseComponent));

            const sortedOthers = others.sort((a, b) =>
                (a?.assetNr || '').localeCompare(b?.assetNr || '')
            );

            const finalList = base ? [base, ...sortedOthers] : sortedOthers;

            setDepartments(finalList);
            setOriginalComponents(Array.isArray(base?.components) ? base.components : []);
        } catch (error) {
            console.log(error.message);
        }
    };

    const clearSearch = () => setSearchTerm("");

    useEffect(() => {
        fetchValues();
    }, []);

    // (Optional) also react if departments changes from elsewhere
    useEffect(() => {
        if (!departments.length) return;
        const base = departments.find(d => d?.isBaseAsset || d?.isBaseComponent);
        setOriginalComponents(Array.isArray(base?.components) ? base.components : []);
    }, [departments]);

    const filteredDepartments = departments.filter(d =>
        (d?.assetNr || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="popup-overlay-dept">
            <div className="popup-content-dept-add">
                <div className="review-date-header">
                    <h2 className="review-date-title">Manage {type.type}s</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <div className="dept-input-container">
                        <input
                            className="search-input-dept"
                            type="text"
                            placeholder="Search Asset"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== "" ? (
                            <i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>
                        ) : (
                            <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>
                        )}
                    </div>
                </div>

                <div className="dept-table-group-2">
                    <div className="popup-table-wrapper-dept-2">
                        <table className="popup-table font-fam">
                            <thead className="dept-headers">
                                <tr>
                                    <th className="asset-types-name" style={{ width: "35%" }}>Asset Number</th>
                                    <th className="asset-types-count" style={{ width: "15%" }}>Site</th>
                                    <th className="asset-types-count" style={{ width: "30%" }}>Number of Flameproof Components</th>
                                    <th className="asset-types-delete" style={{ width: "20%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map(department => (
                                        <tr key={department._id} style={{ cursor: "pointer" }}>
                                            <td>{`${department.assetNr}` || '(unnamed site)'}</td>
                                            <td style={{ textAlign: "center" }}>{department?.site?.site || '-'}</td>
                                            <td style={{ textAlign: "center" }}>{department.componentCount || 'N/A'}</td>
                                            <td className="dept-Act-icon-delete">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                    title={department.isBaseAsset || department.isBaseComponent ? "Edit Base Components" : "Edit Asset Components"}
                                                    onClick={() => openUpdateSiteName(department)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No assets found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
        </div>
    );
};

export default AssetManageAssetComponents;
