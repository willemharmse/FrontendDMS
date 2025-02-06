import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Batch.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import BatchPopup from "./UploadPage/BatchPopup";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling

export default function BatchUpload() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]); // State for multiple files
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    const handleClick = () => {
        if (!isFormValid()) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
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

    // Handle additional file selection
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

        additionalFiles.forEach((file, index) => {
            formData.append(`files`, file); // `files[]` will be sent as an array
        });

        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/batch/validate-excel/test`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setData(response.data.data);
            setMessage(response.data.message);
            setErrors([]);
            setShowPopup(true);
        } catch (error) {
            setMessage("Validation failed!");
            setErrors(error.response?.data?.details || ["Unknown error occurred"]);
            setLoading(false);
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    return (
        <div className="batch-page-container">
            <button className="logo-button-batch" onClick={() => navigate('/FrontendDMS/home')}>
                <img src="logo.webp" alt="Home" />
            </button>
            <button className="log-button-batch" onClick={() => navigate('/FrontendDMS/')}>
                Log Out
            </button>
            <button className="back-button-batch" onClick={() => navigate('/FrontendDMS/documentManage')}>
                Back
            </button>

            <div className="batch-box">
                <h2>Upload Files</h2>

                {/* Excel File Upload */}
                <div className="form-group-batch">
                    <label>Upload Excel File <span className="required-field">*</span></label>
                    <div className="custom-file-input-b">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                        <label>Choose Excel File</label>
                        {file && <span className="file-name-batch">{file.name}</span>}
                    </div>
                </div>

                {/* Additional Files Upload */}
                <div className="form-group-batch">
                    <label>Upload Additional Files <span className="required-field">*</span></label>
                    <div className="custom-file-input-b">
                        <input
                            type="file"
                            multiple
                            onChange={handleAdditionalFilesChange}
                        />
                        <label>Choose Files</label>
                    </div>
                    {additionalFiles.length > 0 && (
                        <div className="selected-files-container-b">
                            {additionalFiles.map((file, index) => (
                                <div key={index} className="file-item-box-batch">
                                    <span className="file-name-batch">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Button */}
                <button
                    className="subBut-b"
                    onClick={handleClick}
                    disabled={loading}
                    title="Enter all fields marked by a * to submit the form"
                >
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Batch Upload Files'}
                </button>

                {errors.length > 0 && (
                    <div className="error-message-b">
                        <strong>Errors:</strong>
                        <ul className="list-disc pl-5">
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {showPopup && <BatchPopup message={message} onClose={() => setShowPopup(false)} />}
            </div>
            <ToastContainer />
        </div>
    );
}
