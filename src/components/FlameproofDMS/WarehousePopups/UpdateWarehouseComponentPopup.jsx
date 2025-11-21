import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-multi-date-picker';
import UploadWithoutFileWarehouse from './UploadWithoutFileWarehouse';
import UploadWithoutFileValuesWarehouse from './UploadWithoutFileValuesWarehouse';
import Select from "react-select";
import UpdateWarehouseWithoutFileWarehouse from './UpdateWarehouseWithoutFileWarehouse';
import UpdateWithoutFileValuesWarehouse from './UpdateWithoutFileValuesWarehouse';

const UpdateWarehouseComponentPopup = ({ onClose, data }) => {
    useEffect(() => {
        console.log("UpdateWarehouseComponentPopup opened with data:", data);
    }, []);
    const [dataId, setDataId] = useState(data?._id || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [certificateAuth, setCertificateAuth] = useState(data?.certAuth || '');
    const [certificateNum, setCertificateNum] = useState(data?.certNr || '');
    const [serialNumber, setSerialNumber] = useState(data?.serialNumber || '');
    const [issueDate, setIssueDate] = useState(data?.issueDate ? data.issueDate.slice(0, 10) : '');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [expiryDate, setExpiryDate] = useState(data?.expiryDate ? data.expiryDate.slice(0, 10) : '');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [siteError, setSiteError] = useState(false);
    const [assetError, setAssetError] = useState(false);
    const [componentError, setComponentError] = useState(false);
    const [withoutValues, setWithoutValues] = useState(false);
    const [withoutFile, setWithoutFile] = useState(false);
    const [assetTypesLoaded, setAssetTypesLoaded] = useState(false);
    const [computedOnce, setComputedOnce] = useState(false);

    const isMaster = (s) => String(s || "").trim().toLowerCase() === "master";

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
    const [siteId, setSiteId] = useState(data?.site?._id || "");

    const [certifiers, setCertifiers] = useState([]);
    const [showCertifiersDropdown, setShowCertifiersDropdown] = useState(false);
    const [filteredCertifiers, setFilteredCertifiers] = useState([]);
    const certifiersRef = useRef(null);

    const [assetTypes, setAssetTypes] = useState([]);
    const [assetTypesSelected, setAssetTypesSelected] = useState(data?.assetTypes || []);

    const [components, setComponents] = useState([]);
    const [component, setComponent] = useState(data?.component || '');

    const norm = (s) => String(s || '').trim();

    // Build the options from API assetTypes
    const assetTypeOptions = useMemo(
        () =>
            (assetTypes || [])
                .map(d => norm(d?.type))
                .filter(Boolean)
                .map(v => ({ value: v, label: v })),
        [assetTypes]
    );

    // Map your selected string array -> React-Select's {value,label}
    const selectedAssetTypeOptions = useMemo(
        () => assetTypeOptions.filter(opt =>
            (assetTypesSelected || []).some(sel => norm(sel) === opt.value)
        ),
        [assetTypeOptions, assetTypesSelected]
    );

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
            setAssetTypesLoaded(true);
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
        if (!assetTypesSelected.length) {
            setComponents([]);
            if (computedOnce) setComponent('');
            return;
        }

        // For each selected type, find the type object, then collect its components array
        const arrays = assetTypesSelected
            .map(sel =>
                assetTypes.find(t => String(t?.type || '').trim() === String(sel).trim())
            )
            .filter(Boolean)
            .map(getRequiredFromAsset); // you already have this helper

        // If any selected type wasn't found or had no components, intersection is empty
        if (!arrays.length) {
            setComponents([]);
            // Same: only clear after we've actually had data at least once
            if (computedOnce && component && !isMaster(component)) setComponent('');
            return;
        }

        const names = intersectComponents(arrays).filter(n => !isMaster(n));
        setComponents(names);

        // First time we get a real list, *preserve* the incoming component from props.
        if (!computedOnce) {
            setComputedOnce(true);
            // Do not force-clear here; keep whatever was in `component`
            return;
        }

        // After first compute, keep selection only if it's valid; otherwise clear
        setComponent(prev => {
            if (!prev) return '';
            if (isMaster(prev)) return '';       // you still don't want Master selectable
            return names.includes(prev) ? prev : '';
        });
    }, [assetTypesSelected, assetTypes]);

    const componentOptions = useMemo(() => {
        const list = [...components];
        if (component && !list.includes(component)) {
            // Include the current value so it shows up selected
            list.unshift(component);
        }
        return list;
    }, [components, component]);

    // Build a map {lowerName -> originalName} to preserve display casing
    const buildNameMap = (names) => {
        const map = new Map();
        names.forEach(n => {
            const key = String(n || '').toLowerCase().trim();
            if (key && !map.has(key)) map.set(key, n);
        });
        return map;
    };

    // Intersect arrays of component names (case-insensitive), return nicely cased + sorted
    const intersectComponents = (arrays) => {
        if (!arrays.length) return [];
        const normalizedSets = arrays.map(a =>
            new Set(a.map(s => String(s || '').toLowerCase().trim()).filter(Boolean))
        );
        const first = Array.from(normalizedSets[0]);
        const common = first.filter(x => normalizedSets.every(set => set.has(x)));

        const nameMaps = arrays.map(buildNameMap);
        const pretty = common.map(lc => {
            for (const m of nameMaps) if (m.has(lc)) return m.get(lc);
            return lc; // fallback
        });

        return pretty.sort((a, b) => a.localeCompare(b));
    };

    const closeAllDropdowns = () => setShowCertifiersDropdown(false);

    const validateForm = () => {
        const newErrors = {};
        if (!siteId) newErrors.site = true;
        if (!certificateAuth) newErrors.certificateAuth = true;
        if (!certificateNum) newErrors.certificateNum = true;
        if (!issueDate) newErrors.issueDate = true;
        if (!component) newErrors.component = true;
        if (!assetTypesSelected.length > 0) newErrors.assetType = true;
        if (!serialNumber) newErrors.serialNumber = true;
        return newErrors;
    };

    useEffect(() => {
        if (assetError && assetTypesSelected.length > 0) {
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
    }, [certificateAuth, certificateNum, issueDate, component, siteId, serialNumber, assetTypesSelected]);

    const isFormValid = () => {
        if (!selectedFile && !data?.fileName === "") {
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

        if (!siteId || !assetTypesSelected.length > 0 || !component || !serialNumber || !certificateAuth || !certificateNum || !issueDate || !expiryDate) {
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
        formData.append('assetTypes', JSON.stringify(assetTypesSelected));
        formData.append('component', component);
        formData.append('serialNumber', serialNumber);
        formData.append('certificationAuthority', certificateAuth);
        formData.append('certificateNumber', certificateNum);
        formData.append('issueDate', issueDate);
        formData.append('expiryDate', expiryDate);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/updateComponent/${dataId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            const data = await response.json();

            setError(null);
            setLoading(false);

            toast.success("Component Updated Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
        } catch (error) {
            console.log(error);
            setError(error.message);
            setLoading(false);
        }
    };

    const handleNoFileUpload = async () => {
        try {
            const formData = new FormData();
            formData.append('site', siteId);
            formData.append('assetTypes', JSON.stringify(assetTypesSelected));
            formData.append('component', component);
            formData.append('serialNumber', serialNumber);
            formData.append('certificationAuthority', certificateAuth);
            formData.append('certificateNumber', certificateNum);
            formData.append('issueDate', issueDate);
            formData.append('expiryDate', expiryDate);

            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameWarehouse/updateNoFileComponent/${dataId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            const data = await response.json();

            setError(null);
            setLoading(false);

            toast.success("Component Updated Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
        } catch (error) {
            console.log(error);
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
        if (!selectedFile && !data?.fileName === "") {
            if (!siteId || !assetTypesSelected || !component) {
                toast.error("Please ensure a value has been entered for site, asset type and component.", { autoClose: 2000, closeButton: true });
                if (!siteId) {
                    setSiteError(true);
                }

                if (!assetTypesSelected) {
                    setAssetError(true);
                }

                if (!component) {
                    setComponentError(true)
                }
                return;
            }
        }

        if (!siteId || !assetTypesSelected.length > 0 || !component || !serialNumber || !certificateAuth || !certificateNum || !issueDate || !expiryDate) {
            openUploadValues();
            return;
        }

        if (!selectedFile) {
            handleNoFileUpload();
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

    // inside your component (above return):
    const onAssetTypesChange = (e) => {
        const opts = Array.from(e.target.selectedOptions).map(o => o.value);
        setAssetTypesSelected(opts);
    };

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Update Component</h2>
                        <button className="review-date-close" onClick={() => onClose(null, null, false)} title="Close Popup">×</button>
                    </div>

                    <div className="ump-form-group-container">
                        <div className="ump-file-name">{data?.fileName ? data?.fileName : (selectedFile ? selectedFile.name : "No Certificate Selected")}</div>
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
                                    <div className="fi-info-popup-page-select-container">
                                        <Select
                                            options={assetTypeOptions}
                                            value={selectedAssetTypeOptions}
                                            isMulti
                                            onChange={(selected) => setAssetTypesSelected((selected || []).map(s => s.value))}
                                            className="assetType-select remove-default-styling"
                                            placeholder={assetTypeOptions.length ? "Select Asset Type(s)" : "Loading asset types..."}
                                            classNamePrefix="sb"
                                        />
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
                                            {componentOptions.map(s => (
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
                                    <div className="ump-select-container">
                                        <select
                                            value={certificateAuth}
                                            onChange={(e) => setCertificateAuth(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: certificateAuth === "" ? "GrayText" : "black" }}
                                        >
                                            <option value="" className="def-colour">Select Certification Body</option>
                                            {certifiers.map(s => (
                                                <option key={s._id} value={s.authority} className="norm-colour">
                                                    {s.authority}
                                                </option>
                                            ))}
                                        </select>
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
                                            placeholder="YYYY-MM-DD"
                                            hideIcon={false}
                                            inputClass='ump-input-select-new-3'
                                            maxDate={todayString()}
                                        />
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            className="date-input-calendar-icon"
                                        />
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.certificateAuth ? "ump-error" : ""}`}>
                                    <label>Expiry Date</label>

                                    <div className='date-container-license' style={{ position: "relative" }}>
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
                                            minDate={issueDate}
                                        />
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            className="date-input-calendar-icon"
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
            {withoutFile && (<UpdateWarehouseWithoutFileWarehouse closeModal={closeFilePopup} submit={determineRoute} />)}
            {withoutValues && (<UpdateWithoutFileValuesWarehouse closeModal={closeUploadValues} submit={determineValueRoute} />)}
        </div>
    );
};

export default UpdateWarehouseComponentPopup;
