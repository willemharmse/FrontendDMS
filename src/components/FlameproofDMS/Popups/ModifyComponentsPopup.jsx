import React, { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faDownLong, faSpinner, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";
import "./ModifyComponentsPopup.css";

const ModifyComponentsPopup = ({ onClose, asset, refresh }) => {
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState({});
    const [files, setFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [selectedArea, setSelectedArea] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [rows, setRows] = useState([]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            console.log(userID);
        }
    }, []);

    const fetchFiles = async () => {
        const route = `/api/flameproof/certificates/with-updates/${asset}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            setFiles(data.certificates);

            console.log(data.certificates);

            setRows(
                (data.certificates || []).map((c) => {
                    const originalISO = c.dateUpdated ? new Date(c.dateUpdated).toISOString() : null;
                    return {
                        _id: c._id,
                        component: c.component,
                        assetId: c.asset?._id,
                        originalISO,
                        dateUpdatedStr: toInputDate(c.dateUpdated),
                        changed: false,
                    };
                })
            );
        } catch (error) {
            setError(error.message);
        } finally {
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const onDateChange = (index, value) => {
        setRows((prev) => {
            const next = [...prev];
            const r = next[index];

            // Normalize form value to ISO (or null) for comparison
            const toISO = (s) => (s?.trim()
                ? new Date(`${s}T00:00:00.000Z`).toISOString()
                : null);

            const newISO = toISO(value);
            const changed = newISO !== r.originalISO;

            next[index] = { ...r, dateUpdatedStr: value, changed };
            return next;
        });
    };

    const filteredFiles = files;

    const toInputDate = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const submitUpdates = async () => {
        try {
            setLoading(true);
            if (!rows.length) return;

            const assetID = rows[0].assetId;

            // helper to create ISO from input date string (or null)
            const toISO = (s) => (s?.trim()
                ? new Date(`${s}T00:00:00.000Z`).toISOString()
                : null);

            const updates = rows.map((r) => {
                const changedTo = toISO(r.dateUpdatedStr);
                return {
                    component: r.component,
                    dateUpdated: changedTo,         // the value to persist
                    changedByUser: !!r.changed,     // did the user change it?
                    changedFrom: r.originalISO,     // previous ISO (or null)
                    changedTo,                      // new ISO (or null)
                };
            });

            const token = localStorage.getItem("token");

            await axios.put(
                `${process.env.REACT_APP_URL}/api/flameproof/modifyComponents/${assetID}/component-updates`,
                { updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Component dates updated.");

            await fetchFiles();
            refresh();
        } catch (e) {
            console.error(e);
            toast.error("Failed to update component dates.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modify-comp-popup-overlay">
            <div className="modify-comp-popup-content" style={{ minHeight: "0" }}>
                <div className="modify-comp-file-header">
                    <h2 className="modify-comp-file-title">Modify Asset Components</h2>
                    <button className="modify-comp-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="modify-comp-file-group">
                    <div className="modify-comp-table">
                        <table>
                            <thead>
                                <tr>
                                    <th className="modify-comp-comp-filter col">Component</th>
                                    <th className="modify-comp-date-filter col">Component Date Updated</th>
                                    <th className="modify-comp-user-filter col">User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => (
                                    <tr key={index} style={{ fontSize: "14px" }} className={`file-info-row-height`} onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                                        <td style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>{file.component}</td>
                                        <td>
                                            <input
                                                type="date"
                                                name="assetNr"
                                                value={(rows[index]?.dateUpdatedStr) ?? ""}
                                                onChange={(e) => onDateChange(index, e.target.value)}
                                                autoComplete="off"
                                                className="ump-input-select font-fam"
                                                placeholder="Select Asset Number"
                                            />
                                        </td>
                                        <td style={{ textAlign: "center", fontFamily: "Arial", fontSize: "14px" }}>
                                            {file?.updater}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="ump-form-footer">
                    <div className="ump-actions">
                        <button className="ump-upload-button" style={{ marginTop: "20px" }} onClick={submitUpdates} disabled={loading}>
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Modify Components'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ModifyComponentsPopup;