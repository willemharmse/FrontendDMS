import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const BatchImportStandardFields = ({ onClose, onImportSuccess }) => {
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

    const handleClick = () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })
        } else {
            handleUpload();  // Call your function when the form is valid
        }
    };

    const isFormValid = () => {
        return !!file;
    };

    // Handle Excel file selection
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage("");
        setErrors([]);
    };

    // Handle Uploading Excel file
    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select an Excel file.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("excel", file);
        formData.append("userID", userID);

        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/ftsImports/importStandardFields`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });

            setMessage(response.data.message);
            setErrors([]);
            setFile(null); // Clear the selected file after upload
            setLoading(false); // Reset loading state after response
            toast.success("Standard Fields Imported", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })

            onImportSuccess?.(); // Let the parent refetch the fields (and close the popup)
        } catch (error) {
            setLoading(false);
            console.log(error);
            if (error.response?.data?.details) {
                setErrors(error.response.data.details); // Set errors from backend

                createErrorFile(error.response.data.details); // Generate download
            }
            toast.error("Could not import standard fields, see attached text document, or contact a systems administrator.", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const createErrorFile = (errors) => {
        const errorText = errors.join('\n');
        const blob = new Blob([errorText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'upload-errors.txt';
        a.click();

        URL.revokeObjectURL(url);
    };

    const downloadTemplateCert = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 - CH FTS - Standard Fields Table Template V0.1 (13.07.2026).xlsx`; // Adjust path as needed
        link.setAttribute('download', 'Standard Fields Template V0.1 (13.07.2026).xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="batch-popup-overlay-assets">
            <div className="batch-popup-content-assets">
                <div className="batch-file-header" style={{ marginBottom: "0px" }}>
                    <h2 className="batch-file-title">Import Standard Fields</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="import-si-file-group" style={{ position: "relative" }}>
                    <button
                        className="top-right-button-rsi"
                        title="Download Template"
                        onClick={() => downloadTemplateCert()}
                    >
                        <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                    </button>
                    <div className="import-si-file-text">Standard Fields Template</div>
                    <div className="import-si-label">Version</div>
                    <div className="import-si-value">V0.1</div>
                    <div className="import-si-label">Date Uploaded</div>
                    <div className="import-si-value" style={{ marginBottom: "0px" }}>2026-07-13</div>
                </div>

                <div className="batch-file-group-assets">
                    <div className="batch-file-text">Upload the Standard Field Document</div>
                    <div className="batch-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="batch-file-buttons">
                        <label className="batch-file-button">
                            {'Select Excel Document'}
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
                    <button className="batch-file-button-sub" disabled={loading} onClick={() => handleClick()}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} className="spin-animation" /> : 'Submit'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default BatchImportStandardFields;