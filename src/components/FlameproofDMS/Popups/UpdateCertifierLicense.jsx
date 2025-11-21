import React, { useState, useEffect, useRef } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ComponentDateUpdates from './ComponentDateUpdates';
import DatePicker from 'react-multi-date-picker';
import UploadWithoutFile from './UploadWithoutFile';
import UploadWithoutFileValues from './UploadWithoutFileValues';

const UpdateCertifierLicense = ({ onClose, certifierData }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [certificateAuth, setCertificateAuth] = useState(certifierData?.authority || "");
    const [issueDate, setIssueDate] = useState(certifierData?.licenseIssueDate || "");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [licenseNumber, setLicenseNumber] = useState(certifierData?.licenseNumber || "");
    const [expiryDate, setExpiryDate] = useState(certifierData?.licenseExpiryDate || "");
    const [fileAttached, setFileAttached] = useState(!!certifierData?.fileName);
    const navigate = useNavigate();

    const todayString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!licenseNumber) newErrors.licenseNumber = true;
        if (!certificateAuth) newErrors.certificateAuth = true;
        if (!issueDate) newErrors.issueDate = true;
        if (!expiryDate) newErrors.expiryDate = true;
        return newErrors;
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [licenseNumber, certificateAuth, issueDate, expiryDate]);

    const hasFile = selectedFile || fileAttached;

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 2000,
                style: { textAlign: 'center' }
            });
            console.log(newErrors);
            return false;
        }
        return true;
    };

    const handleFileUpload = async () => {
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('certificationAuthority', certificateAuth);
        formData.append('licenseNumber', licenseNumber);
        formData.append('issueDate', issueDate);
        formData.append('expiryDate', expiryDate);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameProofCertifiers/update/${certifierData._id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message, { autoClose: 2000, closeButton: "true" })
                setLoading(false);
                return;
            };

            setError(null);
            setLoading(false);

            toast.success("Certification Body Updated Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.log(error.message)
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
                        <h2 className="review-date-title">Update Certification Body</h2>
                        <button className="review-date-close" onClick={() => onClose(null, null, false)} title="Close Popup">×</button>
                    </div>

                    <div className="ump-form-group-container">
                        <div className="ump-file-name">{selectedFile ? selectedFile.name : certifierData?.fileName}</div>
                        <div className="ump-actions">
                            <label className="ump-choose-button" style={{ width: "40%" }}>
                                {'Choose Accreditation Certification'}
                                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div className="ump-form-group-main">
                        <div className="ump-section-header">
                            <h2>Certification Body Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.certificateAuth ? "ump-error" : ""}`}>
                                    <label>Certification Body <span className="ump-required">*</span></label>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={certificateAuth}
                                        onChange={(e) => setCertificateAuth(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Certification Body"
                                    />
                                </div>
                                <div className={`ump-form-group ${errors.licenseNumber ? "ump-error" : ""}`}>
                                    <label>Accreditation Number <span className="ump-required">*</span></label>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={licenseNumber}
                                        onChange={(e) => setLicenseNumber(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Accreditation Number"
                                    />
                                </div>
                            </div>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.issueDate ? "ump-error" : ""}`}>
                                    <label>Initial Accreditation Date <span className="ump-required">*</span></label>

                                    <div className='date-container-license' style={{ position: "relative" }}>
                                        <DatePicker
                                            value={issueDate || ""}
                                            format="YYYY-MM-DD"
                                            onChange={(val) => {
                                                const v = val?.format("YYYY-MM-DD");
                                                const max = todayString();
                                                setIssueDate(v && v > max ? max : v); // clamp to today if future picked/typed
                                            }}
                                            rangeHover={false}
                                            highlightToday={false}
                                            editable={false}
                                            placeholder="Select Intitial Accreditation Date"
                                            hideIcon={false}
                                            inputClass='ump-input-select-new-3'
                                            maxDate={todayString()}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            className="date-input-calendar-icon"
                                        />
                                    </div>
                                </div>
                                <div className={`ump-form-group ${errors.expiryDate ? "ump-error" : ""}`}>
                                    <label>Exipry Date <span className="ump-required">*</span></label>

                                    <div className='date-container-license' style={{ position: "relative" }}>
                                        <DatePicker
                                            value={expiryDate || ""}
                                            format="YYYY-MM-DD"
                                            onChange={(val) => {
                                                setExpiryDate(val?.format("YYYY-MM-DD")); // clamp to today if future picked/typed
                                            }}
                                            style={{
                                                width: "100%",
                                                cursor: "pointer"
                                            }}
                                            rangeHover={false}
                                            highlightToday={false}
                                            editable={false}
                                            placeholder="Select Expiry Date"
                                            hideIcon={false}
                                            inputClass='ump-input-select-new-3'
                                            minDate={issueDate}
                                        />
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            className="date-input-calendar-icon"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="ump-form-footer">
                        <div className="ump-actions">
                            <button className="ump-upload-button" disabled={!hasFile} onClick={handleSubmit}>
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateCertifierLicense;
