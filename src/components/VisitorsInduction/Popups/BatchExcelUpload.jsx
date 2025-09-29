import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import axios from "axios";

const BatchExcelUpload = ({ onClose, refresh }) => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState([]);
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const handleFileChange = (event) => {
        setFile(event.target.files[0] ?? null);
        setMessage("");
        setErrors([]);
    };

    const createErrorFile = (errLines) => {
        const errorText = (errLines || []).join('\n');
        const blob = new Blob([errorText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visitor_batch_errors_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select an Excel file.", { closeButton: false, autoClose: 2000, style: { textAlign: 'center' } });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("excel", file);
            formData.append("userID", userID);

            const base = (process.env.REACT_APP_URL || "").replace(/\/+$/, "");
            const url = `${base}/api/visitors/importVisitorsExcel`;

            const response = await axios.post(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token") || ""}`
                }
            });

            setMessage(response?.data?.message || "Visitors imported successfully.");
            setErrors([]);
            setFile(null);
            toast.success("Visitors imported successfully", {
                closeButton: false,
                autoClose: 2000,
                style: { textAlign: 'center' }
            });
            refresh();
            onClose?.();
        } catch (error) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            setErrors(Array.isArray(data?.details) ? data.details : []);
            if (status === 400 && Array.isArray(data?.details)) {
                createErrorFile(data.details);
                toast.error("Some visitors failed to import. Error file downloaded.", {
                    closeButton: false,
                    autoClose: 2500,
                    style: { textAlign: 'center' }
                });
            } else {
                toast.error(data?.error || "Error uploading Excel file.", {
                    closeButton: false,
                    autoClose: 2500,
                    style: { textAlign: 'center' }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="batch-popup-overlay-assets">
            <div className="batch-popup-content-assets">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Create Visitor Group</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="batch-file-group-assets">
                    <div className="batch-file-text">Import TAU5 Visitor Group List</div>
                    <div className="batch-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="batch-file-buttons">
                        <label className="batch-file-button">
                            Select Excel Document
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <div className="batch-file-buttons">
                    <button
                        className="batch-file-button-sub"
                        disabled={loading}
                        onClick={handleUpload}
                        title="Upload"
                    >
                        {loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchExcelUpload;