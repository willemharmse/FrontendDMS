import React, { useEffect, useState } from "react";
import "./BatchUpload.css";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const BatchUpload = ({ onClose }) => {
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

        additionalFiles.forEach((file, index) => {
            formData.append(`files`, file); // `files[]` will be sent as an array
        });

        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/batch/validate-excel/test`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });

            setMessage(response.data.message);
            setErrors([]);
            setLoading(false); // Reset loading state after response
            toast.success("Files Uploaded", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        } catch (error) {
            setLoading(false);
            toast.error("Validation failed!", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    const handleRemoveFile = (index) => {
        setAdditionalFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    return (
        <div className="batch-popup-overlay">
            <div className="batch-popup-content">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Batch Upload Documents</h2>
                    <button className="batch-file-close" onClick={onClose}>×</button>
                </div>

                <div className="batch-file-group">
                    <div className="batch-file-text">Upload the TAU5 Site Document List</div>
                    <div className="batch-file-text-xlsx">{file ? file.name : "No File Selected"}</div>
                    <div className="batch-file-buttons">
                        <label className="batch-file-button">
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


                <div className="batch-file-group-table">
                    <div className="batch-file-text">Upload Documents from the List</div>
                    <div className="batch-file-buttons">
                        <label className="batch-file-button-files">
                            {'Choose Documents'}
                            <input
                                type="file"
                                multiple
                                onChange={handleAdditionalFilesChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <div className="batch-table-wrapper-dept">
                        <table className="batch-table font-fam">
                            <thead className="batch-headers">
                                <tr>
                                    <th className="batch-row-height-headers batch-nr">Nr</th>
                                    <th className="batch-row-height-headers batch-name">File</th>
                                    <th className="batch-row-height-headers batch-act">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {additionalFiles.length > 0 ? (
                                    additionalFiles
                                        .map((file, index) => (
                                            <tr key={index} >
                                                <td className="batch-row-height-rows">{index + 1}</td>
                                                <td className="batch-row-height-rows">{file.name}</td>
                                                <td className="batch-row-height-rows batch-del-act-button">
                                                    <button
                                                        className={"action-button-user delete-button-user batch-del-button"}
                                                        onClick={() => handleRemoveFile(index)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td className="batch-row-height-rows">-</td>
                                        <td className="batch-row-height-rows">-</td>
                                        <td className="batch-row-height-rows">
                                            -
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="batch-file-buttons">
                    <button className="batch-file-button-sub" onClick={handleClick} disabled={loading}>
                        {'Submit'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default BatchUpload;