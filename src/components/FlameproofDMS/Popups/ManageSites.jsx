import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash, faX, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import RenameSite from "./RenameSite";
import DeleteSitePopup from "./DeleteSitePopup";

const ManageSites = ({ closePopup }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [departments, setDepartments] = useState([]);
    const [deleteID, setDeleteID] = useState("");
    const [deleteName, setDeleteName] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [updateID, setUpdateID] = useState("");
    const [updateName, setUpdateName] = useState("");
    const [update, setUpdate] = useState(false);

    const closeConfirm = () => setConfirm(!confirm);
    const openConfirm = () => setConfirm(true);

    const openUpdateSiteName = (updateID, updateName) => {
        setUpdateID(updateID);
        setUpdateName(updateName);
        setUpdate(true);
    };

    const closeUpdateSiteName = () => {
        setUpdateID("");
        setUpdateName("");
        setUpdate(false);
        fetchValues();
    };

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadSites`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');

            const data = await response.json();

            // ⬇️ Filter out deleted sites; keep ones with no `deleted` field
            const visibleSites = (data?.sites ?? []).filter(s => s && s.deleted !== true);

            // single, safe sort (handles missing site names)
            const sorted = visibleSites.sort((a, b) => (a?.site || '').localeCompare(b?.site || ''));

            setDepartments(sorted);
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/removeSite/${deleteID}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (!response.ok) throw new Error('Failed to delete site');

            setConfirm(false);
            fetchValues();

            toast.success("Site deleted successfully.", {
                autoClose: 2000,
                closeButton: false,
                style: { textAlign: 'center' }
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    const clearSearch = () => setSearchTerm("");

    useEffect(() => {
        fetchValues();
    }, []);

    // Pre-compute filtered list for render (robust to missing names)
    const filteredDepartments = departments.filter(d =>
        (d?.site || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="popup-overlay-dept">
            <div className="popup-content-dept">
                <div className="review-date-header">
                    <h2 className="review-date-title">Manage Sites</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <div className="dept-input-container">
                        <input
                            className="search-input-dept"
                            type="text"
                            placeholder="Search site"
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
                                    <th className="dept-Name-delete">Site</th>
                                    <th className="dept-Act-delete">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDepartments.length > 0 ? (
                                    filteredDepartments.map(department => (
                                        <tr key={department._id} style={{ cursor: "pointer" }}>
                                            <td>{department.site || '(unnamed site)'}</td>
                                            <td className="dept-Act-icon-delete">
                                                <FontAwesomeIcon
                                                    icon={faEdit}
                                                    title="Edit Site"
                                                    onClick={() => openUpdateSiteName(department._id, department.site)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                    title="Remove Site"
                                                    onClick={() => {
                                                        setDeleteID(department._id);
                                                        setDeleteName(department.site);
                                                        openConfirm();
                                                    }}
                                                    style={{ marginLeft: '10px' }}
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
                <RenameSite
                    isOpen={true}
                    onClose={closeUpdateSiteName}
                    siteId={updateID}
                    siteName={updateName}
                />
            )}

            {confirm && (
                <DeleteSitePopup
                    setIsDeleteModalOpen={closeConfirm}
                    siteName={deleteName}
                    handleDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default ManageSites;
