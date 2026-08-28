import React, { useEffect, useState } from "react";
import "./ImportSiteInfo.css";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const ImportSiteInfo = ({ onClose, onFileSelected }) => {
    const [file, setFile] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]); // State for multiple files
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState([]);
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState({});

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, []);

    const downloadFile = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/siteInfoDocuments/download/RMS`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            // Confirm the response is a Blob
            const blob = await response.blob();

            // Create a URL and download the file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', info?.fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/Risk_Template.xlsx`; // Adjust path as needed
        link.setAttribute('download', 'Site General Information Document V0.25.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        return;
        console.log("📝 getDraftDocuments effect running");
        const getDraftDocuments = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/siteInfoDocuments/site-info/RMS`, {
                    method: "GET",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch drafts");
                }

                const data = await response.json();
                console.log(data);
                setInfo(data.siteInfo);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            }
        };

        getDraftDocuments();
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

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    // Handle Uploading Excel file
    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select an Excel file.");
            return;
        }

        onFileSelected(file);
    };

    return (
        <div className="import-si-popup-overlay">
            <div className="import-si-popup-content-new" style={{ minHeight: 0 }}>
                <div className="import-si-file-header">
                    <h2 className="import-si-file-title">Import Site General Information</h2>
                    <button className="import-si-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="import-si-file-group">
                    <div className="import-si-file-text">Upload Site General Information</div>
                    <div className="import-si-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="import-si-file-buttons">
                        <label className="import-si-file-button"
                            style={{ width: "45.249%" }}>
                            {'Select File'}
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                {false && (
                    <div className="import-si-info-row">
                        {false && (<div className="import-si-file-group" style={{ position: "relative" }}>
                            <button
                                className="top-right-button-rsi"
                                title="Download SID"
                                onClick={() => downloadTemplate()}
                            >
                                <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                            </button>
                            <div className="import-si-file-text">Download Site General Information Template</div>
                            <div className="import-si-label">Version</div>
                            <div className="import-si-value">V0.25</div>
                            <div className="import-si-label">Date Uploaded</div>
                            <div className="import-si-value">2026-01-11</div>
                        </div>)}

                        <div className="import-si-file-group" style={{ position: "relative" }}>
                            <button
                                className="top-right-button-rsi"
                                title="Download SID"
                                onClick={() => downloadFile()}
                            >
                                <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                            </button>
                            <div className="import-si-file-text">Download Current Site General Information</div>

                            <div className="import-si-label">Title</div>
                            <div className="import-si-value">{info?.fileName || "N/A"}</div>

                            <div className="import-si-label">Uploaded By</div>
                            <div className="import-si-value">{info?.uploader?.username || "N/A"}</div>

                            <div className="import-si-label">Date Uploaded</div>
                            <div className="import-si-value">{info?.uploadDate ? formatDate(info.uploadDate) : "N/A"}</div>
                        </div>
                    </div>
                )}

                <button
                    className="import-si-file-button-sub-new"
                    onClick={handleClick}
                    disabled={loading}
                    style={{ width: "50%" }}
                >
                    {loading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="import-si-fa-spin" />
                        </>
                    ) : (
                        "Submit"
                    )}
                </button>
            </div>
        </div >
    );
};

export default ImportSiteInfo;