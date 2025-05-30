import React, { useEffect, useState } from "react";
import "./ImportRiskSiteInfo.css";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const ImportRiskSiteInfo = ({ onClose }) => {
    const [file, setFile] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]); // State for multiple files
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
            toast.error("Please select an excel file.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        } else {
            handleUpload();  // Call your function when the form is valid
        }
    };

    const isFormValid = () => {
        return file;
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

        const formData = new FormData();
        formData.append("excel", file);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/siteInfo/upload-single-sheet-excel/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                toast.success("Values have been successfully imported", {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })

                onClose(); // Close the popup after successful upload
            } else {
                toast.error(`Error: ${result.error}`, {
                    closeButton: false,
                    autoClose: 800,
                    style: {
                        textAlign: 'center'
                    }
                })
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error("Error has occured", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    return (
        <div className="import-si-popup-overlay">
            <div className="import-si-popup-content">
                <div className="import-si-file-header">
                    <h2 className="import-si-file-title">Import Risk Management Site Information</h2>
                    <button className="import-si-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="import-si-file-group">
                    <div className="import-si-file-text">Upload Site Information File</div>
                    <div className="import-si-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="import-si-file-buttons">
                        <label className="import-si-file-button">
                            {'Choose File'}
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <div className="import-si-file-buttons">
                    <button className="import-si-file-button-sub" onClick={handleClick} disabled={loading}>
                        {'Submit'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default ImportRiskSiteInfo;