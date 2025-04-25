import React, { useState, useEffect } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadPopup = ({ onClose }) => {
    const [approver, setApprover] = useState('');
    const [reviewer, setReviewer] = useState('');
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
    const [usersList, setUsersList] = useState([]);

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
                const owners = Array.from(new Set([
                    ...data[0].owner,
                    ...data[0].departmentHeads
                ]));

                setUsers(owners); // This now contains owners + departmentHeads, with duplicates removed
                setDeptHeads(data[0].departmentHeads);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchValues();
    }, []);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setUsersList(data.users);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchUsers();
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
        if (!reviewer) newErrors.reviewer = true;
        if (!approver) newErrors.approver = true;

        return newErrors;
    };

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 800,
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
        formData.append('reviewer', reviewer);
        formData.append('approver', approver);

        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }
            await response.json();
            setSuccessMessage("Document uploaded successfully!");
            setShowPopup(true);
            setSelectedFile(null);
            setDiscipline('');
            setOwner([]);
            setDocumentType('');
            setDepartmentHead('');
            setStatus('');
            setReviewDate('');
            setApprover('');
            setReviewer('');
            setError(null);

            setLoading(false); // Reset loading state after response
            toast.success("Document Uploaded Successfully", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }

            })
        } catch (error) {
            setError(error.message);
            setSuccessMessage('');
            setLoading(false);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            // Check if it's a Word document
            setSelectedFile(selectedFile)
        }
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
                <div className="upload-file-page-popup-right">
                    <div className="upload-file-page-popup-header-right">
                        <h2>Upload Document</h2>
                        <button
                            className="upload-file-page-close-button"
                            onClick={onClose}
                            title="Close Popup"
                        >
                            ×
                        </button>
                    </div>

                    <div className="upload-file-page-form-group-container">
                        <div className="upload-file-name">{selectedFile ? selectedFile.name : "No Document Selected"}</div>
                        <div className="create-user-buttons">
                            <label className="choose-upload-file-button">
                                {'Choose Document'}
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="upload-file-page-form-group-main-container">
                        <div className="upload-file-page-popup-header">
                            <h2>Document Information</h2>
                        </div>

                        <form className="upload-file-page-form" onSubmit={handleSubmit}>
                            <div className="upload-file-page-form-row">
                                <div className={`upload-file-page-form-group ${errors.discipline ? "error-upload-required-up" : ""}`}>
                                    <label>Discipline <span className="required-field">*</span></label>
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
                                    <label>Document Owner <span className="required-field">*</span></label>
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
                                <div className={`upload-file-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                    <label>Department Head <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={departmentHead} className="upload-file-page-select" onChange={(e) => setDepartmentHead(e.target.value)}>
                                            <option value="">Select Head</option>
                                            {deptHeads.sort((a, b) => a.localeCompare(b)).map((head, index) => (
                                                <option key={index} value={head}>
                                                    {head}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">
                                <div className={`upload-file-page-form-group ${errors.status ? "error-upload-required-up" : ""}`}>
                                    <label>Document Status <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={status} className="upload-file-page-select" onChange={(e) => setStatus(e.target.value)}>
                                            <option value="">Select Status</option>
                                            <option value="in_review">In Review</option>
                                            <option value="in_approval">In Approval</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                    <label>Document Reviewer <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={reviewer} className="upload-file-page-select" onChange={(e) => setReviewer(e.target.value)}>
                                            <option value="">Select Reviewer</option>
                                            {usersList.sort((a, b) => a.username.localeCompare(b.username)).map((reviewer, index) => (
                                                <option key={index} value={reviewer._id}>
                                                    {reviewer.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.approver ? "error-upload-required-up" : ""}`}>
                                    <label>Document Approver <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={approver} className="upload-file-page-select" onChange={(e) => setApprover(e.target.value)}>
                                            <option value="">Select Approver</option>
                                            {usersList.sort((a, b) => a.username.localeCompare(b.username)).map((approver, index) => (
                                                <option key={index} value={approver._id}>
                                                    {approver.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">


                                <div className={`upload-file-page-form-group ${errors.documentType ? "error-upload-required-up" : ""}`}>
                                    <label>Document Type <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={documentType} className="upload-file-page-select" onChange={(e) => setDocumentType(e.target.value)}>
                                            <option>Select Document Type</option>
                                            {docTypes.sort((a, b) => a.localeCompare(b)).map((type, index) => (
                                                <option key={index} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.reviewDate ? "error-upload-required-up" : ""}`}>
                                    <label>Review Date <span className="required-field">*</span></label>
                                    <input type="date" value={reviewDate} className="upload-file-page-date" onChange={(e) => setReviewDate(e.target.value)}></input>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.reviewDate ? "error-upload-required-up" : ""}`}>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">

                            </div>
                        </form>
                    </div>

                    <div className="upload-file-page-form-footer">

                        <div className="create-user-buttons">
                            <button
                                className="upload-file-page-upload-button"
                                disabled={!selectedFile}
                                onClick={handleSubmit}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload Document'}
                            </button>
                        </div>
                    </div>

                    {showPopup && (
                        <div className="download-popup-overlay">
                            <div className="download-popup-content">
                                <div className="download-file-group">
                                    <p className="upload-file-text">{successMessage}</p>
                                    <p className='upload-file-text'>Would you like to upload another Document?</p>
                                </div>
                                <div className="download-file-buttons">
                                    <button className="download-file-button-download" onClick={() => setShowPopup(false)}>
                                        Yes
                                    </button>
                                    <button className="download-file-button-cancel" onClick={onClose}>
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default UploadPopup;