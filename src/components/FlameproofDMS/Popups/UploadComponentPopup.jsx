import React, { useState, useEffect, useRef } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadComponentPopup = ({ onClose, refresh }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [certificateAuth, setCertificateAuth] = useState('');
    const [certificateNum, setCertificateNum] = useState('');
    const [component, setComponent] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [assetNr, setAssetNr] = useState("");
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [components, setComponents] = useState([])
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [showAssetDropdown, setShowAssetDropdown] = useState(false);
    const assetRef = useRef(null);
    const [assetNrs, setAssetNrs] = useState([]);           // [{ _id, assetNr, master }]
    const [filteredAssetNrs, setFilteredAssetNrs] = useState([]);

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

    const closeAllDropdowns = () => setShowAssetDropdown(false);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getAssetNumbers`);
                if (!response.ok) throw new Error("Failed to fetch asset numbers");
                const data = await response.json();

                // Defensive: support either array of strings OR array of objects
                const normalized = (data.assetNumbers || []).map(a =>
                    typeof a === "string" ? { assetNr: a, _id: a, master: false } : a
                );

                setAssetNrs(normalized);
            } catch (error) {
                console.log(error);
            }
        };
        fetchValues();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!selectedFile) newErrors.file = true;
        if (!certificateAuth) newErrors.certificateAuth = true;
        if (!certificateNum) newErrors.certificateNum = true;
        if (!issueDate) newErrors.issueDate = true;
        if (!component) newErrors.component = true;
        if (!assetNr) newErrors.asset = true;
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
            setAssetNr("");

            setError(null);
            setLoading(false);

            toast.success("Certificate Uploaded Successfully", {
                closeButton: false, autoClose: 800, style: { textAlign: 'center' }
            });

            refresh();
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

    useEffect(() => {
        const popupSelector = ".floating-dropdown";

        const closeDropdowns = () => setShowAssetDropdown(false);

        const handleClickOutside = (e) => {
            const outside = !e.target.closest(popupSelector) && !e.target.closest("input");
            if (outside) closeDropdowns();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showAssetDropdown]);

    const positionDropdownToInput = () => {
        const el = assetRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleAssetInput = (value) => {
        closeAllDropdowns();
        setAssetNr(value);

        // Filter over objects by their assetNr field
        const matches = assetNrs.filter(opt =>
            (opt.assetNr || "").toLowerCase().includes((value || "").toLowerCase())
        );
        setFilteredAssetNrs(matches);
        setShowAssetDropdown(true);
        positionDropdownToInput();
    };

    const handleAssetFocus = () => {
        closeAllDropdowns();
        setFilteredAssetNrs(assetNrs);
        setShowAssetDropdown(true);
        positionDropdownToInput();
    };

    const selectAssetSuggestion = (value) => {
        setAssetNr(value);
        setShowAssetDropdown(false);
    };

    const selectedAsset = assetNrs.find(a => a.assetNr === assetNr) || null;
    const selectedAssetHasMaster = !!selectedAsset?.master;

    useEffect(() => {
        if (!assetNr) return;
        if (component === "Master" && selectedAssetHasMaster) {
            setComponent("");
        }
    }, [assetNr, component, selectedAssetHasMaster]);

    const norm = (s = "") => s.toLowerCase().trim();
    const isMasterLabel = (s) => norm(s) === "master";

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Upload Certificate</h2>
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
                            <h2>Certificate Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group-third ${errors.asset ? "ump-error" : ""}`}>
                                    <label>Asset Number <span className="ump-required">*</span></label>

                                    <div className="fpm-select-container">
                                        <input
                                            type="text"
                                            name="assetNr"
                                            value={assetNr || ""}
                                            onChange={e => handleAssetInput(e.target.value)}
                                            onFocus={handleAssetFocus}
                                            ref={assetRef}
                                            autoComplete="off"
                                            className="ump-input-select font-fam"
                                            placeholder="Select Asset Number"
                                        />
                                    </div>
                                </div>
                                <div className={`ump-form-group-third-2 ${errors.component ? "ump-error" : ""}`}>
                                    <label>Component/ Type <span className="ump-required">*</span></label>

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
                                            {components
                                                .filter(comp => !(isMasterLabel(comp.component) && selectedAssetHasMaster))
                                                .map((comp) => (
                                                    <option key={comp._id} value={comp.component} className="norm-colour">
                                                        {comp.component}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
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

            {showAssetDropdown && filteredAssetNrs.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredAssetNrs
                        .slice() // avoid mutating original
                        .sort((a, b) => (a.assetNr || "").localeCompare(b.assetNr || ""))
                        .map((term, i) => (
                            <li key={i} onMouseDown={() => selectAssetSuggestion(term.assetNr)}>
                                {term.assetNr}
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};

export default UploadComponentPopup;
