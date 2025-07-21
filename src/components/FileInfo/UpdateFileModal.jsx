import React, { useState, useRef, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./UpdateFileModal.css";

const UpdateFileModal = ({ isModalOpen, closeModal, fileID }) => {
    // State for the form fields
    const [newFile, setNewFile] = useState(null);
    const [status, setStatus] = useState("");
    const [reviewDate, setReviewDate] = useState("");
    const [files, setFiles] = useState([]); // List of existing files
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [userID, setUserID] = useState("");
    const fileInputRef = useRef(null);
    const [chosenFileName, setChosenFileName] = useState("");
    const [modalHeight, setModalHeight] = useState(400); // Initial modal height, adjust if needed


    // Allowed roles
    const adminRoles = ["admin", "teamleader", "developer"];

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    useEffect(() => {
        if (isModalOpen) {
            let newHeight = 500; // Start with the default modal height

            // Check the length of the file names and adjust the modal height accordingly
            if (removeFileExtension(chosenFileName).length > 67) {
                newHeight += 13; // Add 10px if the file name is too long
            }
            if (newFile && removeFileExtension(newFile.name).length > 67) {
                newHeight += 13; // Add 10px for the new file name as well
            }

            // Set the new calculated height
            setModalHeight(newHeight);
        }
    }, [isModalOpen, chosenFileName, newFile]);
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
                const matchedFile = data.files?.find(file => file._id === fileID);
                if (matchedFile) {
                    setChosenFileName(removeFileExtension(matchedFile.fileName));
                }
            } catch (err) {
                setError(err.message);
            }
        };
        fetchFiles();
    }, [fileID]);

    // Check if the form is valid
    const isFormValid = () => {
        return newFile && status && reviewDate;
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
        formData.append("existingFile", fileID);
        formData.append("newFile", newFile);
        formData.append("status", status);
        formData.append("reviewDate", reviewDate);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/version/update/${fileID}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error("Upload failed");
            }
            await response.json();
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
            });

            closeModalAdd();
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
        setNewFile("");
        setReviewDate("");
        setStatus("");
        closeModal();
    };

    if (!isModalOpen) return null;

    return (
        <div className="update-file-overlay">
            <div className="update-file-modal" style={{ height: `${modalHeight}px`, maxHeight: `${modalHeight}px` }}>
                <div className="update-file-header">
                    <h2 className="update-file-title">Update Document</h2>
                    <button className="update-file-close" onClick={closeModalAdd} title="Close Popup">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="update-file-group-top">
                        <label className="update-file-label">Chosen Document</label>
                        <p className="update-file-label-file-name-top">
                            {chosenFileName || "No Document Selected"}
                        </p>
                    </div>

                    <div className="update-file-group">
                        <label className="update-file-label">Select New Document</label>
                        <p className="update-file-label-file-name">
                            {newFile ? newFile.name : "No Document Selected"}
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
                                Select Document
                            </button>
                        </div>
                    </div>

                    <div className="side-by-side-container">
                        <div className="update-file-group-side">
                            <label className="update-file-label">Document Status</label>

                            <div className="uc-info-popup-page-select-container">
                                <select
                                    className={`${status ? "update-file-select-file" : "update-file-select-file def-colour"} remove-default-styling`}
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="" className="def-colour">Select Status</option>
                                    <option value="in_review">In Review</option>
                                    <option value="in_approval">In Approval</option>
                                    <option value="approved">Approved</option>
                                </select>
                            </div>
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