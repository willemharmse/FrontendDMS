import React, { useState, useRef, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./UpdateFileModal.css";

const UpdateFileModal = ({ isModalOpen, closeModal }) => {
    // State for the form fields
    const [selectedExistingFile, setSelectedExistingFile] = useState("");
    const [newFile, setNewFile] = useState(null);
    const [status, setStatus] = useState("");
    const [reviewDate, setReviewDate] = useState("");
    const [files, setFiles] = useState([]); // List of existing files
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [userID, setUserID] = useState("");
    const fileInputRef = useRef(null);

    // Allowed roles
    const adminRoles = ["admin", "teamleader", "developer"];

    // Check for valid token/role on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);
    // Fetch existing files for the file select dropdown
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                // Assuming data.files is an array of file objects with properties "id" and "name"
                setFiles(data.files || []);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchFiles();
    }, []);

    // Check if the form is valid
    const isFormValid = () => {
        return selectedExistingFile && newFile && status && reviewDate;
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setNewFile(selectedFile);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) {
            toast.error("Please fill in all required fields", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })

            return;
        }

        const formData = new FormData();
        formData.append("existingFile", selectedExistingFile);
        formData.append("newFile", newFile);
        formData.append("status", status);
        formData.append("reviewDate", reviewDate);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/version/update/${selectedExistingFile}`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Upload failed");
            }
            await response.json();
            setSelectedExistingFile("");
            setNewFile(null);
            setStatus("");
            setReviewDate("");
            setSuccessMsg("");
            setError(null);

            toast.success("File version updated successfully!", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        } catch (err) {
            setError(err.message);
            setSuccessMsg("");
        }
    };

    const handleChooseFile = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const closeModalAdd = () => {
        setSelectedExistingFile("");
        setNewFile("");
        setReviewDate("");
        setStatus("");
        closeModal();
    };

    if (!isModalOpen) return null;

    return (
        <div className="update-file-overlay">
            <div className="update-file-modal">
                <div className="update-file-header">
                    <h2 className="update-file-title">Update File</h2>
                    <button className="update-file-close" onClick={closeModalAdd}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="update-file-group-top">
                        <label className="update-file-label">Select Existing File</label>
                        <select
                            className={selectedExistingFile ? "update-file-select" : "update-file-select def-colour"}
                            value={selectedExistingFile}
                            onChange={(e) => setSelectedExistingFile(e.target.value)}
                        >
                            <option value="" className="def-colour">Choose a File</option>
                            {files.map((file, index) => (
                                <option key={index} value={file._id}>
                                    {file.fileName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="update-file-group">
                        <label className="update-file-label">Select New File</label>
                        <p className="update-file-label-file-name">
                            {newFile ? newFile.name : "No File Selected"}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="upload-file-page-file-input"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <div className="update-file-buttons">
                            <button
                                type="button"
                                className="update-file-button-select-file"
                                onClick={handleChooseFile}
                            >
                                Choose File
                            </button>
                        </div>
                    </div>

                    <div className="side-by-side-container">
                        <div className="update-file-group-side">
                            <label className="update-file-label">Document Status</label>
                            <select
                                className={status ? "update-file-select-file" : "update-file-select-file def-colour"}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="" className="def-colour">Select Status</option>
                                <option value="in_review">In Review</option>
                                <option value="in_approval">In Approval</option>
                                <option value="approved">Approved</option>
                            </select>
                        </div>

                        <div className="update-file-group-side">
                            <label className="update-file-label">Review Date</label>
                            <input
                                type="date"
                                className={reviewDate ? "update-file-input-file norm-colour" : "update-file-input-file def-colour"}
                                value={reviewDate}
                                onChange={(e) => setReviewDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="update-file-buttons">
                        <button type="submit" className="update-file-button">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateFileModal;