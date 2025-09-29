import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash, faX, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import RenameSite from "./RenameSite";
import DeleteSitePopup from "./DeleteSitePopup";
import ComponentManagePopup from "./ComponentManagePopup";

const ManageAssetTypes = ({ closePopup }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState([]);
    const [updateType, setUpdateType] = useState("");
    const [update, setUpdate] = useState(false);

    const openUpdateSiteName = (updateType) => {
        setUpdateType(updateType);
        setUpdate(true);
    };

    const closeUpdateSiteName = () => {
        setUpdateType("");
        setUpdate(false);
        fetchValues();
    };

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/assetTypesCounts`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');
            const data = await response.json();
            const sorted = data.types.sort((a, b) => (a?.type || '').localeCompare(b?.type || ''));
            setDepartments(sorted);
        } catch (error) {
            console.log(error.message);
        }
    };

    const clearSearch = () => setSearchTerm("");

    useEffect(() => {
        fetchValues();
    }, []);

    const filteredDepartments = departments.filter(d =>
        (d?.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="popup-overlay-dept" style={{ background: update ? "transparent" : "" }}>
            <div className="popup-content-dept" style={{ background: update ? "transparent" : "" }}>
                <div className="review-date-header">
                    <h2 className="review-date-title">Manage Asset Types</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <div className="dept-input-container">
                        <input
                            className="search-input-dept"
                            type="text"
                            placeholder="Search Asset Type"
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
                                    <th className="asset-types-name">Asset Type</th>
                                    <th className="asset-types-count">Base Components Count</th>
                                    <th className="asset-types-delete">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map(department => (
                                        <tr key={department._id} style={{ cursor: "pointer" }}>
                                            <td>{department.type || '(unnamed site)'}</td>
                                            <td style={{ textAlign: "center" }}>{department.componentCount || 'N/A'}</td>
                                            <td className="dept-Act-icon-delete">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                    title="Edit Asset Type"
                                                    onClick={() => openUpdateSiteName(department)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No sites found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {update && (
                <ComponentManagePopup
                    isOpen={true}
                    closePopup={closeUpdateSiteName}
                    assetType={updateType}
                />
            )}
        </div>
    );
};

export default ManageAssetTypes;
