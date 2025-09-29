import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-toastify';
import { faTrash, faX, faSearch, faEdit, faRefresh } from '@fortawesome/free-solid-svg-icons';
import RenameSite from "./RenameSite";
import DeleteSitePopup from "./DeleteSitePopup";
import RestoreCertificates from "./RestoreCertificates";
import RestoreCertificatesClose from "./RestoreCertificatesClose";
import DeleteSitePerm from "./DeleteSitePerm";

const ManageDeletedSites = ({ closePopup }) => {
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

    const closeRestoreCerts = async () => {
        setUpdate(false);

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/sites/${updateID}/restore`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Site restored without certificates.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" },
            });

            fetchValues();
        } catch (err) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(err.message || "Failed to restore site.", {
                closeButton: true,
                autoClose: 1800,
                style: { textAlign: "center" },
            });
        }
    };

    const restoreSiteAndCertificates = async () => {
        setUpdate(false);

        try {
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/sites/${updateID}/restore-active-certificates`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const isJson = res.headers.get("content-type")?.includes("application/json");
            const data = isJson ? await res.json() : null;

            if (!res.ok && res.status !== 207) {
                const msg = data?.error || data?.message || `Request failed (${res.status})`;
                throw new Error(msg);
            }

            // success or partial success
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Certificates restored with site.",
                { closeButton: true, autoClose: 1800, style: { textAlign: "center" } }
            );

            fetchValues();
        } catch (err) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(err.message || "Failed to restore site and certificates.", {
                closeButton: true,
                autoClose: 1800,
                style: { textAlign: "center" },
            });
        }
    };

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadSites`, { headers: {} });
            if (!response.ok) throw new Error('Failed to fetch sites');

            const data = await response.json();

            // ⬇️ Filter out deleted sites; keep ones with no `deleted` field
            const visibleSites = (data?.sites ?? []).filter(s => s && s.deleted === true);

            // single, safe sort (handles missing site names)
            const sorted = visibleSites.sort((a, b) => (a?.site || '').localeCompare(b?.site || ''));

            setDepartments(sorted);
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/sites/${deleteID}/permanent`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (!response.ok) throw new Error('Failed to delete site');

            setConfirm(false);
            fetchValues();

            toast.success("Site and all certificates deleted successfully.", {
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
                    <h2 className="review-date-title">Manage Deleted Sites</h2>
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
                                                    icon={faRefresh}
                                                    title="Restore Site"
                                                    onClick={() => openUpdateSiteName(department._id, department.site)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <FontAwesomeIcon
                                                    icon={faTrash}
                                                    title="Delete Site"
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
                <RestoreCertificatesClose
                    isOpen={true}
                    closeModal={closeUpdateSiteName}
                    restoreCertificates={restoreSiteAndCertificates}
                    restoreSite={closeRestoreCerts}
                />
            )}

            {confirm && (
                <DeleteSitePerm
                    setIsDeleteModalOpen={closeConfirm}
                    siteName={deleteName}
                    handleDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default ManageDeletedSites;
