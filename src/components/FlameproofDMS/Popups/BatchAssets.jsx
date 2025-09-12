import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const BatchAssets = ({ onClose }) => {
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
        return file && additionalFiles;
    };

    // Handle Excel file selection
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setMessage("");
        setErrors([]);
    };

    const handleAdditionalFilesChange = (event) => {
        setAdditionalFiles([...event.target.files]); // Convert FileList to an array
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
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/flameProofImports/importAssets`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });

            setMessage(response.data.message);
            setErrors([]);
            setFile(null); // Clear the selected file after upload
            setLoading(false); // Reset loading state after response
            toast.success("Assets Created", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })
        } catch (error) {
            setLoading(false);
            if (error.response?.data?.details) {
                setErrors(error.response.data.details); // Set errors from backend
                createErrorFile(error.response.data.details); // Generate download
            }
            toast.error("Validation failed!", {
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

    return (
        <div className="batch-popup-overlay-assets">
            <div className="batch-popup-content-assets">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Register Multiple Assets</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="batch-file-group-assets">
                    <div className="batch-file-text">Upload the TAU5 Site Asset List</div>
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
                    <button className="batch-file-button-sub" onClick={() => handleClick()}>
                        {'Submit'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default BatchAssets;