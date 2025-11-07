import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-multi-date-picker';
import UploadWithoutFileWarehouse from './UploadWithoutFileWarehouse';
import UploadWithoutFileValuesWarehouse from './UploadWithoutFileValuesWarehouse';

const UploadWarehouseComponentPopup = ({ onClose }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [certificateAuth, setCertificateAuth] = useState('');
    const [certificateNum, setCertificateNum] = useState('');
    const [serialNumber, setSerialNumber] = useState("");
    const [issueDate, setIssueDate] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [expiryDate, setExpiryDate] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [siteError, setSiteError] = useState(false);
    const [assetError, setAssetError] = useState(false);
    const [componentError, setComponentError] = useState(false);
    const [withoutValues, setWithoutValues] = useState(false);
    const [withoutFile, setWithoutFile] = useState(false);

    const openFilePopup = () => {
        setWithoutFile(true);
    }

    const closeFilePopup = () => {
        setWithoutFile(false);
    }

    const openUploadValues = () => {
        setWithoutValues(true);
    }

    const closeUploadValues = () => {
        setWithoutValues(false);
    }

    const [sites, setSites] = useState([]);
    const [siteId, setSiteId] = useState("");

    const [certifiers, setCertifiers] = useState([]);
    const [showCertifiersDropdown, setShowCertifiersDropdown] = useState(false);
    const [filteredCertifiers, setFilteredCertifiers] = useState([]);
    const certifiersRef = useRef(null);

    const [assetTypes, setAssetTypes] = useState([]);
    const [assetType, setAssetType] = useState("");

    const [components, setComponents] = useState([]);
    const [component, setComponent] = useState("");

    const fetchCertifiers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/getCertifiers`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();

            setCertifiers(data.certifiers);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchAssetTypes = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/getAssetTypes`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();

            setAssetTypes(data.types);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchSites = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/getSites`);
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();

            setSites(data.sites);
        } catch (error) {
            setError(error.message);
        }
    };

    const todayString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    };

    const normStr = (s = "") => s.toLowerCase().trim();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    useEffect(() => {
        fetchAssetTypes();
        fetchCertifiers();
        fetchSites();
    }, [])

    const toStringList = (arr) =>
        (Array.isArray(arr) ? arr : [])
            .map(v => typeof v === 'string' ? v : (v?.name ?? v?.component ?? ''))
            .map(s => String(s || '').trim())
            .filter(Boolean);

    const getRequiredFromAsset = (asset) =>
        toStringList(
            asset?.components ??
            []
        );

    useEffect(() => {
        if (!assetType) {
            setComponents([]);
            setComponent('');
            return;
        }

        const selectedType = assetTypes.find(
            t => String(t?.type || '').trim() === String(assetType).trim()
        );

        const names = selectedType ? getRequiredFromAsset(selectedType) : [];

        setComponents(names);

        setComponent(prev => (names.includes(prev) ? prev : ''));
    }, [assetType, assetTypes]);

    const closeAllDropdowns = () => setShowCertifiersDropdown(false);

    const validateForm = () => {
        const newErrors = {};
        if (!siteId) newErrors.site = true;
        if (!certificateAuth) newErrors.certificateAuth = true;
        if (!certificateNum) newErrors.certificateNum = true;
        if (!issueDate) newErrors.issueDate = true;
        if (!component) newErrors.component = true;
        if (!assetType) newErrors.assetType = true;
        if (!serialNumber) newErrors.serialNumber = true;
        return newErrors;
    };

    useEffect(() => {
        if (assetError && assetType) {
            setAssetError(false);
        }

        if (siteError && siteId) {
            setSiteError(false);
        }

        if (componentError && component) {
            setComponentError(false);
        }

        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [certificateAuth, certificateNum, issueDate, component, siteId, serialNumber, assetType]);

    const isFormValid = () => {
        if (!selectedFile) {
            openFilePopup();
            return false;
        }

        const newErrors = validateForm();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 2000,
                style: { textAlign: 'center' }
            });
            return false;
        }
        return true;
    };

    const determineRoute = () => {
        closeFilePopup();

        if (!siteId || !assetType || !component || !serialNumber || !certificateAuth || !certificateNum || !issueDate || !expiryDate) {
            openUploadValues();
            return;
        }

        handleNoFileUpload();
    }

    const determineValueRoute = (route) => {
        closeUploadValues();

        if (route) {
            handleNoFileUpload();
        }
        else {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }

    const handleFileUpload = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('site', siteId);
        formData.append('asset', assetType);
        formData.append('component', component);
        formData.append('serialNumber', serialNumber);
        formData.append('certificationAuthority', certificateAuth);
        formData.append('certificateNumber', certificateNum);
        formData.append('issueDate', issueDate);
        formData.append('expiryDate', expiryDate);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/uploadComponent`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            const data = await response.json();

            setSelectedFile(null);
            setCertificateAuth('');
            setAssetType("");
            setSerialNumber("");
            setCertificateNum('');
            setComponent("");
            setIssueDate('');
            setSiteId("");

            setError(null);
            setLoading(false);

            toast.success("Component Uploaded Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleNoFileUpload = async () => {
        const formData = new FormData();
        formData.append('site', siteId);
        formData.append('asset', assetType);
        formData.append('component', component);
        formData.append('serialNumber', serialNumber);
        formData.append('certificationAuthority', certificateAuth);
        formData.append('certificateNumber', certificateNum);
        formData.append('issueDate', issueDate);
        formData.append('expiryDate', expiryDate);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/uploadNoFileComponent`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            const data = await response.json();

            setSelectedFile(null);
            setCertificateAuth('');
            setAssetType("");
            setSerialNumber("");
            setCertificateNum('');
            setComponent("");
            setIssueDate('');
            setSiteId("");

            setError(null);
            setLoading(false);

            toast.success("Component Uploaded Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
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
        if (!selectedFile) {
            if (!siteId || !assetType || !component) {
                toast.error("Please ensure a value has been entered for site, asset type and component.", { autoClose: 2000, closeButton: true });
                if (!siteId) {
                    setSiteError(true);
                }

                if (!assetType) {
                    setAssetError(true);
                }

                if (!component) {
                    setComponentError(true)
                }
                return;
            }
        }
        if (isFormValid()) handleFileUpload();
    };

    const positionDropdownToInput = () => {
        const el = certifiersRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleCertifierInput = (value) => {
        closeAllDropdowns();
        setCertificateAuth(value);
        console.log(certifiers);
        const matches = certifiers
            .filter(opt => opt.authority.toLowerCase().includes(value.toLowerCase()));
        setFilteredCertifiers(matches);
        setShowCertifiersDropdown(true);
        positionDropdownToInput();
    };

    const handleCertifierFocus = () => {
        closeAllDropdowns();
        setFilteredCertifiers(certifiers);
        setShowCertifiersDropdown(true);
        positionDropdownToInput();
    };

    const selectCertifierSuggestion = (value) => {
        setCertificateAuth(value);
        setShowCertifiersDropdown(false);
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            if (e.target.closest('textarea, input')) return;
            if (e.target.closest(popupSelector)) return;

            closeDropdowns();
        };

        const closeDropdowns = () => {
            setShowCertifiersDropdown(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showCertifiersDropdown]);

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Register Component</h2>
                        <button className="review-date-close" onClick={() => onClose(null, null, false)} title="Close Popup">×</button>
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
                            <h2>Component Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.site || siteError ? "ump-error" : ""}`}>
                                    <label>Site <span className="ump-required">*</span></label>
                                    <div className={`fpm-select-container`}>
                                        <select
                                            value={siteId}
                                            onChange={(e) => setSiteId(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: siteId === "" ? "GrayText" : "black" }}
                                        >
                                            <option value="" className="def-colour">Select Site</option>
                                            {sites.map(s => (
                                                <option key={s._id} value={s._id} className="norm-colour">
                                                    {s.site}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`ump-form-group ${errors.assetType || assetError ? "ump-error" : ""}`}>
                                    <label>Asset Type <span className="ump-required">*</span></label>
                                    <div className={`fpm-select-container`}>
                                        <select
                                            value={assetType}
                                            onChange={(e) => setAssetType(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: assetType === "" ? "GrayText" : "black" }}
                                        >
                                            <option value="" className="def-colour">Select Asset Type</option>
                                            {assetTypes.map(s => (
                                                <option key={s._id} value={s.type} className="norm-colour">
                                                    {s.type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`ump-form-group ${errors.component || componentError ? "ump-error" : ""}`}>
                                    <label>Component Name <span className="ump-required">*</span></label>
                                    <div className={`fpm-select-container`}>
                                        <select
                                            value={component}
                                            onChange={(e) => setComponent(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: component === "" ? "GrayText" : "black" }}
                                        >
                                            <option value="" className="def-colour">Select Component Name</option>
                                            {components.map(s => (
                                                <option key={s} value={s} className="norm-colour">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                            </div>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.serialNumber ? "ump-error" : ""}`}>
                                    <label>Component Serial Number <span className="ump-required">*</span></label>
                                    <input
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        type="text"
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Component Serial Number"
                                    />
                                </div>

                                <div className={`ump-form-group ${errors.certificateAuth ? "ump-error" : ""}`}>
                                    <label>Certification Body</label>
                                    <div className={`fpm-select-container`}>
                                        <input
                                            type="text"
                                            ref={certifiersRef}
                                            value={certificateAuth}
                                            onChange={(e) => handleCertifierInput(e.target.value)}
                                            onFocus={handleCertifierFocus}
                                            autoComplete="off"
                                            className="ump-input-select font-fam"
                                            placeholder="Select Certification Body"
                                        />
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.certificateNum ? "ump-error" : ""}`}>
                                    <label>Certificate Number</label>
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
                            </div>
                            <div className="ump-form-row">
                                <div style={{ width: "30%" }} className={`ump-form-group ${errors.issueDate ? "ump-error" : ""}`}>
                                    <label>Issue Date</label>

                                    <div className='date-container-license'>
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
                                            placeholder="YYYY-MM-DD"
                                            hideIcon={false}
                                            inputClass='ump-input-select-new-3'
                                            maxDate={todayString()}
                                        />
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.certificateAuth ? "ump-error" : ""}`}>
                                    <label>Expiry Date</label>

                                    <div className='date-container-license'>
                                        <DatePicker
                                            value={expiryDate || ""}
                                            format="YYYY-MM-DD"
                                            onChange={(val) => {
                                                const v = val?.format("YYYY-MM-DD");
                                                setExpiryDate(v); // clamp to today if future picked/typed
                                            }}
                                            rangeHover={false}
                                            highlightToday={false}
                                            editable={false}
                                            placeholder="YYYY-MM-DD"
                                            hideIcon={false}
                                            inputClass='ump-input-select-new-3'
                                        />
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.certificateNum ? "ump-error" : ""}`}>

                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="ump-form-footer">
                        <div className="ump-actions">
                            <button className="ump-upload-button" onClick={handleSubmit}>
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload Component'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showCertifiersDropdown && filteredCertifiers.length > 0 && (
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
                    {filteredCertifiers
                        .slice() // avoid mutating original
                        .sort((a, b) => (a.authority || "").localeCompare(b.authority || ""))
                        .map((term, i) => (
                            <li key={i} onMouseDown={() => selectCertifierSuggestion(term.authority)}>
                                {term.authority}
                            </li>
                        ))}
                </ul>
            )}
            {withoutFile && (<UploadWithoutFileWarehouse closeModal={closeFilePopup} submit={determineRoute} />)}
            {withoutValues && (<UploadWithoutFileValuesWarehouse closeModal={closeUploadValues} submit={determineValueRoute} />)}
        </div>
    );
};

export default UploadWarehouseComponentPopup;
