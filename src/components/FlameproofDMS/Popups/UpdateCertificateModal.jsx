import React, { useState, useRef, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UpdateCertificateModal = ({ isModalOpen, closeModal, certificateID, refresh }) => {
    const [newFile, setNewFile] = useState(null);
    const [issueDate, setIssueDate] = useState("");
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [userID, setUserID] = useState("");
    const fileInputRef = useRef(null);
    const [chosenFileName, setChosenFileName] = useState("");
    const [modalHeight, setModalHeight] = useState(400); // Initial modal height, adjust if needed

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    useEffect(() => {
        if (isModalOpen) {
            let newHeight = 500;

            if (removeFileExtension(chosenFileName).length > 67) {
                newHeight += 13;
            }
            if (newFile && removeFileExtension(newFile.name).length > 67) {
                newHeight += 13;
            }

            setModalHeight(newHeight);
        }
    }, [isModalOpen, chosenFileName, newFile]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const isFormValid = () => {
        return newFile && issueDate;
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setNewFile(selectedFile);
        }
    };

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getCerts`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                const matchedFile = data.certificates?.find(file => file._id === certificateID);
                console.log(data.certificates)
                if (matchedFile) {
                    setChosenFileName(removeFileExtension(matchedFile.fileName));
                }
            } catch (err) {
                setError(err.message);
            }
        };
        fetchFiles();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) {
            toast.error("Please fill in all required fields", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            })

            return;
        }

        const formData = new FormData();
        formData.append("newFile", newFile);
        formData.append("issueDate", issueDate);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/update/${certificateID}`, {
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
            setIssueDate("");
            setError(null);

            toast.success("Certificate version updated successfully!", {
                closeButton: false,
                autoClose: 2000,
                style: {
                    textAlign: 'center'
                }
            });

            closeModalAdd();
            refresh();
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
        setIssueDate("");
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
                        <label className="update-file-label">Chosen Certificate</label>
                        <p className="update-file-label-file-name-top">
                            {chosenFileName || "No Certificate Selected"}
                        </p>
                    </div>

                    <div className="update-file-group">
                        <label className="update-file-label">Select New Certificate</label>
                        <p className="update-file-label-file-name">
                            {newFile ? newFile.name : "No Certificate Selected"}
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
                                Choose Certificate
                            </button>
                        </div>
                    </div>

                    <div className="side-by-side-container">
                        <div className="update-file-group-side">
                            <label className="update-file-label">Issue Date</label>

                            <input
                                type="date"
                                className={issueDate ? "update-file-issue-date norm-colour" : "update-file-issue-date def-colour"}
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
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

export default UpdateCertificateModal;