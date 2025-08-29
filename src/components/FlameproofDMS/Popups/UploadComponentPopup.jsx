import React, { useState, useEffect } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadComponentPopup = ({ onClose, assetNr }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [certificateAuth, setCertificateAuth] = useState('');
    const [certificateNum, setCertificateNum] = useState('');
    const [component, setComponent] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [components, setComponents] = useState([])

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    useEffect(() => {
        const fetchComps = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadComponents`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setComponents(data.components);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchComps();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!selectedFile) newErrors.file = true;
        if (!certificateAuth) newErrors.certificateAuth = true;
        if (!certificateNum) newErrors.certificateNum = true;
        if (!issueDate) newErrors.issueDate = true;
        if (!component) newErrors.component = true;
        return newErrors;
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [selectedFile, certificateAuth, certificateNum, issueDate, component]);

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
            return false;
        }
        return true;
    };

    const handleFileUpload = async () => {
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('certificateType', "component");
        formData.append('certificationAuthority', certificateAuth);
        formData.append('certificateNr', certificateNum);
        formData.append('assetNr', assetNr);
        formData.append('issueDate', issueDate);
        formData.append('component', component);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/uploadCertificate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            await response.json();

            setShowPopup(true);
            setSelectedFile(null);
            setCertificateAuth('');
            setCertificateNum('');
            setComponent("");
            setIssueDate('');

            setError(null);
            setLoading(false);

            toast.success("Certificate Uploaded Successfully", {
                closeButton: false, autoClose: 800, style: { textAlign: 'center' }
            });
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleFileSelect = (file) => {
        if (file) setSelectedFile(file);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) handleFileUpload();
    };

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Upload Component Certificate</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ump-form-group-container">
                        <div className="ump-file-name">{selectedFile ? selectedFile.name : "No Certificate Selected"}</div>
                        <div className="ump-actions">
                            <label className="ump-choose-button">
                                {'Choose Certificate'}
                                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div className="ump-form-group-main">
                        <div className="ump-section-header">
                            <h2>Component Certificate Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.certificateAuth ? "ump-error" : ""}`}>
                                    <label>Certification Authority <span className="ump-required">*</span></label>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={certificateAuth}
                                        onChange={(e) => setCertificateAuth(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Certification Authority"
                                    />
                                </div>

                                <div className={`ump-form-group ${errors.certificateNum ? "ump-error" : ""}`}>
                                    <label>Certificate Number <span className="ump-required">*</span></label>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={certificateNum}
                                        onChange={(e) => setCertificateNum(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Certificate Number"
                                    />
                                </div>

                                <div className={`ump-form-group ${errors.issueDate ? "ump-error" : ""}`}>
                                    <label>Issue Date <span className="ump-required">*</span></label>
                                    <input
                                        type="date"
                                        name="assetNr"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Select Asset Number"
                                    />
                                </div>
                            </div>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.component ? "ump-error" : ""}`}>
                                    <label>Component <span className="ump-required">*</span></label>

                                    <div className="ump-select-container">
                                        <select
                                            type="text"
                                            name="assetNr"
                                            value={component || ""}
                                            onChange={(e) => setComponent(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: component === "" ? "GrayText" : "black" }}
                                        >
                                            <option value={""} className="def-colour">Select Component</option>
                                            {components.map((comp) => (
                                                <option key={comp._id} value={comp.component} className="norm-colour">
                                                    {comp.component}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="ump-form-footer">
                        <div className="ump-actions">
                            <button className="ump-upload-button" disabled={!selectedFile} onClick={handleSubmit}>
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload Certificate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadComponentPopup;
