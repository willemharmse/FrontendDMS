import React, { useState, useRef, useEffect } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadPopup = ({ onClose }) => {
    const [showDocumentInfo, setShowDocumentInfo] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [discipline, setDiscipline] = useState('');
    const [owner, setOwner] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [departmentHead, setDepartmentHead] = useState('');
    const [reviewDate, setReviewDate] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [users, setUsers] = useState([]); // State to hold the list of users
    const [deptHeads, setDeptHeads] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [disciplines, setDisciplines] = useState([]);
    const adminRoles = ['admin', 'teamleader', 'developer'];
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, []);

    useEffect(() => {
        // Function to fetch users
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setDocTypes(data[0].documentType);
                setDisciplines(data[0].disciplines);
                setUsers(data[0].owner); // Set users from the fetched data
                setDeptHeads(data[0].departmentHeads);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchValues();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!selectedFile) newErrors.file = true;
        if (!discipline) newErrors.discipline = true;
        if (!documentType) newErrors.documentType = true;
        if (!owner) newErrors.author = true;
        if (!departmentHead) newErrors.departmentHead = true;
        if (!reviewDate) newErrors.reviewDate = true;
        if (!status) newErrors.status = true;

        return newErrors;
    };

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }

            })

            return false;
        }

        return true;
    };

    const handleFileUpload = async (e) => {
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('departmentHead', departmentHead);
        formData.append('owner', JSON.stringify(owner));
        formData.append('documentType', documentType);
        formData.append('discipline', discipline);
        formData.append('status', status);
        formData.append('userID', userID);
        formData.append('reviewDate', reviewDate);

        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }
            await response.json();
            setSuccessMessage("File uploaded successfully!");
            setShowPopup(true);
            setSelectedFile(null);
            setDiscipline('');
            setOwner([]);
            setDocumentType('');
            setDepartmentHead('');
            setStatus('');
            setReviewDate('');
            setError(null);
        } catch (error) {
            setError(error.message);
            setSuccessMessage('');
            setLoading(false);
        } finally {
            setLoading(false); // Reset loading state after response
            toast.success("File Uploaded Successfully", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }

            })
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            // Check if it's a Word document
            setSelectedFile(selectedFile)
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isFormValid()) {
            handleFileUpload();  // Call your function when the form is valid
        }
    };

    return (
        <div className="upload-file-page-container">
            <div className="upload-file-page-overlay">
                <div className="upload-file-page-popup-left">
                    <div className="upload-file-page-popup-header">
                        <h2>Upload Document</h2>
                    </div>
                    <div className="upload-file-page-upload-area">
                        <div
                            className={`upload-file-page-dropzone ${isDragging ? 'upload-file-page-dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="upload-file-page-cloud-icon">
                                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M30 53V33" stroke="#A0A0A0" stroke-width="2" />
                                    <path d="M30 33L20 43" stroke="#A0A0A0" stroke-width="2" />
                                    <path d="M30 33L40 43" stroke="#A0A0A0" stroke-width="2" />
                                    <path d="M15 40C7.5 40 5 32.5 10 27.5C10 17.5 20 15 25 20C25 15 40 15 40 25C45 25 50 30 45 40" stroke="#A0A0A0" stroke-width="2" />
                                </svg>

                            </div>
                            <p className="upload-file-page-dropzone-text">
                                {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop file here'}
                            </p>
                            <p className="upload-file-page-file-size">File shouldn't be password protected.</p>
                        </div>
                        <div className="upload-file-page-button-container">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="upload-file-page-file-input"
                                onChange={handleFileChange}
                            />
                            <div className="create-user-buttons">
                                <button
                                    className="upload-file-page-choose-button"
                                    onClick={handleChooseFile}
                                >
                                    Choose File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="upload-file-page-divider"></div>


                <div className="upload-file-page-popup-right">
                    <div className="upload-file-page-popup-header-right">
                        <h2>Document Information</h2>
                        <button
                            className="upload-file-page-close-button"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                    <form className="upload-file-page-form" onSubmit={handleSubmit}>
                        <div className="upload-file-page-form-row">
                            <div className={`upload-file-page-form-group ${errors.discipline ? "error-upload-required-up" : ""}`}>
                                <label>Discipline<span className="required-field">*</span></label>
                                <div className="upload-file-page-select-container">
                                    <select value={discipline} className="upload-file-page-select" onChange={(e) => setDiscipline(e.target.value)}>
                                        <option value="">Select Discipline</option>
                                        {disciplines
                                            .sort((a, b) => a.localeCompare(b)) // Sorts alphabetically
                                            .map((discipline, index) => (
                                                <option key={index} value={discipline}>
                                                    {discipline}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div className={`upload-file-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                <label>Owner<span className="required-field">*</span></label>
                                <div className="upload-file-page-select-container">
                                    <select value={owner} className="upload-file-page-select" onChange={(e) => setOwner(e.target.value)}>
                                        <option>Select Owner</option>
                                        {users
                                            .sort((a, b) => a.localeCompare(b)) // Sorts alphabetically
                                            .map((user, index) => (
                                                <option key={index} value={user}>
                                                    {user}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="upload-file-page-form-row">
                            <div className={`upload-file-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                <label>Department Head<span className="required-field">*</span></label>
                                <div className="upload-file-page-select-container">
                                    <select value={departmentHead} className="upload-file-page-select" onChange={(e) => setDepartmentHead(e.target.value)}>
                                        <option value="">Select Head</option>
                                        {deptHeads.sort().map((head, index) => (
                                            <option key={index} value={head}>
                                                {head}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={`upload-file-page-form-group ${errors.status ? "error-upload-required-up" : ""}`}>
                                <label>Document Status<span className="required-field">*</span></label>
                                <div className="upload-file-page-select-container">
                                    <select value={status} className="upload-file-page-select" onChange={(e) => setStatus(e.target.value)}>
                                        <option value="">Select Status</option>
                                        <option value="in_review">In Review</option>
                                        <option value="in_approval">In Approval</option>
                                        <option value="approved">Approved</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="upload-file-page-form-row">
                            <div className={`upload-file-page-form-group ${errors.documentType ? "error-upload-required-up" : ""}`}>
                                <label>Document Type<span className="required-field">*</span></label>
                                <div className="upload-file-page-select-container">
                                    <select value={documentType} className="upload-file-page-select" onChange={(e) => setDocumentType(e.target.value)}>
                                        <option>Select Document Type</option>
                                        {docTypes.map((type, index) => (
                                            <option key={index} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={`upload-file-page-form-group ${errors.reviewDate ? "error-upload-required-up" : ""}`}>
                                <label>Review Date<span className="required-field">*</span></label>
                                <input type="date" value={reviewDate} className="upload-file-page-date" onChange={(e) => setReviewDate(e.target.value)}></input>
                            </div>
                        </div>

                        <div className="upload-file-page-form-footer">

                            <div className="create-user-buttons">
                                <button
                                    className="upload-file-page-upload-button"
                                    disabled={!selectedFile}
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload File'}
                                </button>
                            </div>
                        </div>
                    </form>
                    {showPopup && (
                        <div className="upload-popup-confirmation-classname">
                            <div className="upload-popup-content-classname">
                                <p className="upload-popup-message-classname">{successMessage}</p>
                                <p>Would you like to upload another file?</p>
                                <div className="upload-popup-buttons-classname">
                                    <button className="upload-popup-yes-button-classname" onClick={() => setShowPopup(false)}>
                                        Yes
                                    </button>
                                    <button className="upload-popup-no-button-classname" onClick={onClose}>
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadPopup;