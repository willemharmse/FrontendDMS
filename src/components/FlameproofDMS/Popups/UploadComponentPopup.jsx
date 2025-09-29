import React, { useState, useEffect, useRef } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const UploadComponentPopup = ({ onClose, refresh, assetNumber = "", site = "", assetType = "" }) => {
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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [showAssetDropdown, setShowAssetDropdown] = useState(false);
    const assetRef = useRef(null);
    const [assetNrs, setAssetNrs] = useState([]);
    const [filteredAssetNrs, setFilteredAssetNrs] = useState([]);
    const [siteId, setSiteId] = useState(site || "");
    const [sites, setSites] = useState([]);
    const [assetsBySite, setAssetsBySite] = useState({});
    const [assetNr, setAssetNr] = useState(assetNumber || "");
    const [availableComponents, setAvailableComponents] = useState([]);
    const [assetIndex, setAssetIndex] = useState({});
    const [allAssetOptions, setAllAssetOptions] = useState([]);
    const [filteredSites, setFilteredSites] = useState([]);
    const [assetOptions, setAssetOptions] = useState([]);
    const navigate = useNavigate();

    const todayString = () => {
        const d = new Date();
        // shift for timezone so the ISO date matches local date
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    };

    const normStr = (s = "") => s.toLowerCase().trim();
    const siteLocked = !!site;
    const assetLocked = !!assetNumber;
    const assetTypeFilter = normStr(assetType || "");

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const toStringList = (arr) =>
        (Array.isArray(arr) ? arr : [])
            .map(v => typeof v === 'string' ? v : (v?.name ?? v?.component ?? ''))
            .map(s => String(s || '').trim())
            .filter(Boolean);

    // pull the required components stored on the asset
    const getRequiredFromAsset = (asset) =>
        toStringList(
            asset?.requiredComponents ??
            asset?.componentsList ??
            asset?.componentsRequired ??
            asset?.components ??              // <- if your asset stores required components here
            []
        );

    // pull the components that already have certificates for this asset
    const getCertifiedFromAsset = (asset) =>
        toStringList(
            asset?.certifiedComponents ??
            asset?.componentsWithCertificates ??
            asset?.certificateComponents ??
            (Array.isArray(asset?.certificates) ? asset.certificates.map(c => c.component) : []) ??
            asset?.existingComponents ??
            []                                // <- if your /sites-assets-active already sets this
        );

    useEffect(() => {
        const fetchSitesAssetsActive = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/sites-assets-active`);
                if (!res.ok) throw new Error("Failed to fetch sites/assets");
                const data = await res.json();
                const sitesArr = (data.sites || []).map(s => ({ _id: s._id, site: s.site }));
                const assetsMap = {};
                (data.sites || []).forEach(s => {
                    assetsMap[s._id] = (s.assets || []).map(a => ({
                        _id: a._id,
                        assetNr: a.assetNr,
                        assetType: a.assetType || "",
                        // REQUIRED components from the asset doc
                        components: Array.isArray(a.components) ? a.components : [],
                        // components that ALREADY have active certs
                        certifiedComponents: Array.isArray(a.certifiedComponents) ? a.certifiedComponents : [],
                        hasMaster: !!a.hasMaster    // or a.master; route returns both
                    }));
                });

                // stable UI sorts
                sitesArr.sort((a, b) => (a.site || "").localeCompare(b.site || ""));
                Object.keys(assetsMap).forEach(k => {
                    assetsMap[k].sort((a, b) => (a.assetNr || "").localeCompare(b.assetNr || ""));
                });

                setAssetsBySite(assetsMap);
                console.log("" + assetsMap[site]);

                // ⬇️ user must pick site first, so:
                setFilteredSites(sitesArr);
                setAssetOptions([]);            // ⬅️ no site yet ⇒ empty asset list

                if (site && assetsMap[site]) setSiteId(site);
                if (assetNumber) setAssetNr(assetNumber);
            } catch (e) {
                console.error(e);
            }
        };

        fetchSitesAssetsActive();
    }, [site, assetNumber]);

    useEffect(() => {
        if (!assetNr) {
            setAvailableComponents([]);
            return;
        }

        const current = assetNrs.find(a => a.assetNr === assetNr);
        const requiredAll = Array.from(new Set(getRequiredFromAsset(current).map(s => s.trim())));
        const already = new Set(getCertifiedFromAsset(current).map(s => s.toLowerCase()));
        if (String(current?.master ?? '').toLowerCase() === 'true' || current?.master === true) {
            already.add('master');
        }

        const remaining = requiredAll.filter(name => !already.has(name.toLowerCase()));
        const isMaster = (s) => (s || '').trim().toLowerCase() === 'master';
        const num = (s) => parseInt(String(s || '').replace(/^\D+/, ''), 10) || 0;

        remaining.sort((a, b) => {
            if (isMaster(a)) return -1;
            if (isMaster(b)) return 1;
            return num(a) - num(b);
        });

        const opts = remaining.map((name, i) => ({ _id: `opt-${i}-${name}`, component: name }));
        setAvailableComponents(opts);
    }, [assetNr, assetNrs]);

    useEffect(() => {
        if (!siteId) {
            setAssetNrs([]);
            setAssetOptions([]);
            setAssetNr("");
            setComponent("");
            return;
        }

        const listAll = assetsBySite[siteId] || [];
        const list =
            assetTypeFilter
                ? listAll.filter(a => normStr(a.assetType) === assetTypeFilter)
                : listAll;

        console.log(list)
        setAssetNrs(list);
        setAssetOptions(list);

        // clear asset if it doesn't belong here (unless locked)
        if (!assetLocked && assetNr && !list.some(a => a.assetNr === assetNr)) {
            setAssetNr("");
        }

        // whenever site changes, clear component choice
        setComponent("");
    }, [siteId, assetsBySite, assetTypeFilter, assetNr, assetLocked]);

    useEffect(() => {
        // Always show all sites (or keep any pre-existing site prop lock)
        if (sites.length) setFilteredSites(sites);
    }, [sites]);

    const norm = (s = "") => s.toLowerCase().trim();
    const isMasterLabel = s => norm(s) === "master";

    const closeAllDropdowns = () => setShowAssetDropdown(false);

    const validateForm = () => {
        const newErrors = {};
        if (!siteId) newErrors.site = true;
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
    }, [selectedFile, certificateAuth, certificateNum, issueDate, component, siteId, assetNr]);

    const isFormValid = () => {
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

    const handleFileUpload = async () => {
        if (!isFormValid()) return;
        const norm = (s = "") => s.trim().toLowerCase();
        const existsInThisSite = (assetsBySite[siteId] || []).some(a => norm(a.assetNr) === norm(assetNr));
        if (!existsInThisSite) {
            toast.error("Asset Number does not exist in the selected site.", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('certificationAuthority', certificateAuth);
        formData.append('certificateNr', certificateNum);
        formData.append('assetNr', assetNr);
        formData.append('issueDate', issueDate);
        formData.append('component', component);
        formData.append('site', siteId);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/uploadCertificate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            const data = await response.json();

            const id = data.id;
            const assetNr = data.assetNr;

            setShowPopup(true);
            setSelectedFile(null);
            setCertificateAuth('');
            setCertificateNum('');
            setComponent("");
            setIssueDate('');
            setAssetNr("");
            setSiteId("");

            setError(null);
            setLoading(false);

            toast.success("Certificate Uploaded Successfully", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });

            setTimeout(() => { onClose(assetNr, id, true); }, 1500);
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
        setAssetNr(value);
    };

    const handleAssetFocus = () => {
        if (assetLocked) return;
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

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Upload Certificate</h2>
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
                            <h2>Certificate Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.site ? "ump-error" : ""}`}>
                                    <label>Site <span className="ump-required">*</span></label>
                                    <div className={`${siteLocked ? `` : `fpm-select-container`}`}>
                                        <select
                                            value={siteId}
                                            onChange={(e) => setSiteId(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: siteId === "" ? "GrayText" : "black" }}
                                            disabled={siteLocked}                // <- lock when site prop provided
                                        >
                                            <option value="" className="def-colour">Select Site</option>
                                            {filteredSites.map(s => (
                                                <option key={s._id} value={s._id} className="norm-colour">
                                                    {s.site}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`ump-form-group ${errors.asset ? "ump-error" : ""}`}>
                                    <label>Asset Number <span className="ump-required">*</span></label>
                                    <div className={`${assetLocked ? `` : `fpm-select-container`}`}>
                                        <select
                                            value={assetNr || ""}
                                            onChange={(e) => handleAssetInput(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: assetNr === "" ? "GrayText" : "black" }}
                                            disabled={assetLocked}
                                        >
                                            <option value="" className="def-colour">Select Asset Number</option>
                                            {assetOptions.map(asset => (
                                                <option key={asset._id} value={asset.assetNr} className="norm-colour">
                                                    {asset.assetNr}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`ump-form-group ${errors.component ? "ump-error" : ""}`}>
                                    <label>Component/ Type <span className="ump-required">*</span></label>
                                    <div className="ump-select-container">
                                        <select
                                            value={component || ""}
                                            onChange={(e) => setComponent(e.target.value)}
                                            className="upm-comp-input-select font-fam"
                                            style={{ color: component === "" ? "GrayText" : "black" }}
                                        >
                                            <option value="" className="def-colour">Select Component</option>
                                            {availableComponents.map(comp => (
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
                                        max={todayString()}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            const max = todayString();
                                            setIssueDate(v && v > max ? max : v); // clamp to today if future picked/typed
                                        }}
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
