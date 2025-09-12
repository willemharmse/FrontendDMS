import React, { useEffect, useState, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faDownLong, faSpinner, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";
import "./ModifyComponentsPopup.css";

const ModifyComponentsPopup = ({ onClose, asset }) => {
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

            setRows(
                (data.certificates || []).map((c) => ({
                    _id: c._id,
                    component: c.component,
                    assetId: c.asset?._id,
                    // store value as input-friendly string; empty for null
                    dateUpdatedStr: toInputDate(c.dateUpdated),
                }))
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
            next[index] = { ...next[index], dateUpdatedStr: value };
            return next;
        });
    };

    const filteredFiles = files;

    const downloadTemplateCert = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 - Flameproof Certificate List V0.5 (11.09.2025).xlsx`; // Adjust path as needed
        link.setAttribute('download', 'TAU5 - Flameproof Certificate List V0.5 (11.09.2025).xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadTemplateAsset = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 - Flameproof Asset List V0.3 (05.09.2025).xlsx`; // Adjust path as needed
        link.setAttribute('download', 'TAU5 - Flameproof Asset List V0.3 (05.09.2025).xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toInputDate = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const formatStatus = (type) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const getComplianceColor = (status) => {
        if (status === "valid") return "status-good";
        if (status === "invalid") return "status-worst";
    };

    const submitUpdates = async () => {
        try {
            setLoading(true);

            if (!rows.length) return;

            const assetID = rows[0].assetId;

            const updates = rows.map((r) => ({
                component: r.component,
                dateUpdated:
                    r.dateUpdatedStr?.trim()
                        ? new Date(r.dateUpdatedStr).toISOString()
                        : null,
            }));

            await axios.put(
                `${process.env.REACT_APP_URL}/api/flameproof/modifyComponents/${assetID}/component-updates`,
                { updates }
            );

            toast.success("Component dates updated.");
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

                <div className="modify-comp-file-group" style={{ position: "relative" }}>
                    <div className="modify-comp-table">
                        <table>
                            <thead>
                                <tr>
                                    <th className="modify-comp-ass-nr-filter col">Asset Nr</th>
                                    <th className="modify-comp-comp-filter col">Component</th>
                                    <th className="modify-comp-owner-filter col">Asset Owner</th>
                                    <th className="modify-comp-auth-filter col">Certification Authority</th>
                                    <th className="modify-comp-cert-filter col">Certificate Nr</th>
                                    <th className={`modify-comp-head-filter`}>Department Head</th>
                                    <th className={`modify-comp-status-filter col`}>Status</th>
                                    <th className="modify-comp-date-filter col">Date Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => (
                                    <tr key={index} style={{ fontSize: "14px", cursor: "pointer" }} className={`file-info-row-height`} onClick={() => setHoveredFileId(hoveredFileId === file._id ? null : file._id)}>
                                        <td
                                            className="col" style={{ textAlign: "center", position: "relative" }}
                                        >
                                            {file.asset.assetNr}
                                        </td>
                                        <td className="col">{file.component}</td>
                                        <td className="col">{file.asset.assetOwner}</td>
                                        <td className={`col`}>{(file.certAuth)}</td>
                                        <td className="col">{file.certNr}</td>
                                        <td className="col">{file.asset.departmentHead}</td>
                                        <td className={`col ${getComplianceColor(file.status)}`}>{formatStatus(file.status)}</td>
                                        <td className={`col`}>
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