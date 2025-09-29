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
    const todayStr = new Date().toISOString().split("T")[0]; // e.g. "2025-09-25"

    const isValidDateObj = (d) => d instanceof Date && !Number.isNaN(d.getTime());

    const parseMaybeDate = (v) => {
        if (!v) return null;
        if (v instanceof Date) return isValidDateObj(v) ? v : null;
        if (typeof v === 'string') {
            const s = v.trim();
            if (!s || s === '—') return null;
            const d = new Date(s);
            return isValidDateObj(d) ? d : null;
        }
        return null;
    };

    const toInputDate = (v) => {
        const d = parseMaybeDate(v);
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const normalizeLooseDate = (s) => {
        if (!s) return null;
        const m = String(s).trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
        if (!m) return null;
        let [, yStr, moStr, dStr] = m;
        const y = Number(yStr);
        const mo = Number(moStr);
        const d = Number(dStr);
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

        const dt = new Date(Date.UTC(y, mo - 1, d));
        if (!isValidDateObj(dt)) return null;
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== mo || dt.getUTCDate() !== d) return null;

        const mm = String(mo).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    const toISOFromInputLoose = (s) => {
        const norm = normalizeLooseDate(s);
        if (!norm) return null;
        const dt = new Date(`${norm}T00:00:00.000Z`);
        return isValidDateObj(dt) ? dt.toISOString() : null;
    };

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
                    const parsed = parseMaybeDate(c.dateUpdated);
                    return {
                        _id: c._id,
                        component: c.component,
                        assetId: c.asset?._id,
                        originalISO: parsed ? parsed.toISOString() : null,
                        dateUpdatedStr: toInputDate(parsed),  // shows "" if none
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
            const newISO = toISOFromInputLoose(value);   // null if invalid/partial
            const changed = newISO !== r.originalISO;
            next[index] = { ...r, dateUpdatedStr: value, changed };
            return next;
        });
    };

    const filteredFiles = files;

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
                const changedTo = toISOFromInputLoose(r.dateUpdatedStr);
                return {
                    component: r.component,
                    dateUpdated: changedTo,
                    changedByUser: !!r.changed,
                    changedFrom: r.originalISO,
                    changedTo,
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
                                                max={todayStr}   // prevents picking a future date with the picker
                                                value={(rows[index]?.dateUpdatedStr) ?? ""}
                                                onChange={(e) => onDateChange(index, e.target.value)}
                                                onBlur={(e) => {
                                                    let norm = normalizeLooseDate(e.target.value);

                                                    // if user typed a valid but future date, clamp to today
                                                    if (norm && norm > todayStr) {
                                                        norm = todayStr;
                                                    }

                                                    setRows((prev) => {
                                                        const next = [...prev];
                                                        const r = next[index];
                                                        const newISO = norm ? toISOFromInputLoose(norm) : null;
                                                        next[index] = {
                                                            ...r,
                                                            dateUpdatedStr: norm || "",
                                                            changed: newISO !== r.originalISO,
                                                        };
                                                        return next;
                                                    });
                                                }}
                                                className="ump-input-select font-fam"
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