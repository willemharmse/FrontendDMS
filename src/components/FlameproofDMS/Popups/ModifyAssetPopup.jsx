import React, { useState, useEffect, useMemo } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ModifyAssetPopup = ({ onClose, refresh, asset }) => {
    const [site, setSite] = useState(asset?.site || asset?.siteId);
    const [type, setType] = useState(asset?.assetType);
    const [number, setNumber] = useState(asset?.assetNr);
    const [area, setArea] = useState(asset?.operationalArea);
    const [owner, setOwner] = useState(asset?.assetOwner);
    const [deptHead, setDeptHead] = useState(asset?.departmentHead);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [types, setTypes] = useState([]);
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);
    const [areas, setAreas] = useState([]);

    const [siteAssetsMap, setSiteAssetsMap] = useState({});
    const normalizeAssetNr = (v) => String(v ?? '').trim().toUpperCase();

    const isAssetNumberValidForSite = (siteId, assetNr) => {
        const set = siteAssetsMap[siteId];
        if (!set) return false;
        return set.has(normalizeAssetNr(assetNr));
    };

    useEffect(() => {
        console.log("Asset to modify:", asset);
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!site) newErrors.site = true;
        if (!type) newErrors.type = true;
        if (!number) newErrors.number = true;
        if (!area) newErrors.area = true;
        if (!owner) newErrors.owner = true;
        if (!deptHead) newErrors.deptHead = true;
        return newErrors;
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [site, area, deptHead, owner, type, number]);

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

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {

                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            const sortedUsers = data.users.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });

            setUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadTypes`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                const sortedTypes = data.assetTypes.sort((a, b) => {
                    return a.type.localeCompare(b.type);
                });

                setTypes(sortedTypes);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchValues();
    }, []);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/sites-with-asset-numbers`);
                if (!res.ok) throw new Error('Failed to fetch sites/asset numbers');
                const data = await res.json();

                const sorted = (data?.sites ?? []).sort((a, b) => a.site.localeCompare(b.site));

                // Keep a minimal sites array for the <select/>
                setSites(sorted.map(s => ({ _id: s._id, site: s.site })));

                // Build lookup map: siteId -> Set of normalized numbers
                const map = {};
                for (const s of sorted) {
                    const arr = Array.isArray(s.assetNumbers)
                        ? s.assetNumbers
                        : Array.isArray(s.assets) ? s.assets.map(x => x.assetNr) : [];
                    map[s._id] = new Set(arr.map(normalizeAssetNr));
                }
                setSiteAssetsMap(map);
            } catch (err) {
                setError(err.message);
            }
        };

        const fetchAreas = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadAreas`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                const sortedAreas = data.areas.sort((a, b) => {
                    return a.area.localeCompare(b.area);
                });

                setAreas(sortedAreas);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchValues();
        fetchAreas();
    }, []);

    const handleFileUpload = async () => {
        if (!isFormValid()) return;

        if (isAssetNumberValidForSite(site, number)) {
            setErrors({ ...errors, number: true });
            toast.error("Asset Number already exists for the selected Site", {
                closeButton: false,
                autoClose: 2000, style: { textAlign: 'center' }
            });
            return;
        }

        const formData = new FormData();
        formData.append('site', site);
        formData.append('owner', owner);
        formData.append('assetType', type);
        formData.append('operationalArea', area);
        formData.append('deptHead', deptHead);
        formData.append('assetNumber', number);

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/flameproof/modifyAsset/${asset._id}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: formData,
                }
            );
            if (!response.ok) throw new Error(response.error || 'Failed to upload file');
            await response.json();

            setShowPopup(true);
            setSite('');
            setDeptHead('');
            setArea('');
            setNumber('');
            setType('');
            setOwner('');

            setError(null);
            setLoading(false);

            toast.success("Asset Successfully Registered", {
                closeButton: false, autoClose: 2000, style: { textAlign: 'center' }
            });

            refresh();
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) handleFileUpload();
    };

    const usersWithSelected = useMemo(() => {
        const list = Array.isArray(users) ? [...users] : [];
        const names = new Set(list.map(u => (u?.username || '').trim().toLowerCase()));

        const maybeAdd = (val, tag) => {
            const v = (val || '').trim();
            if (!v) return;
            if (!names.has(v.toLowerCase())) {
                list.push({ _id: `missing-${tag}-${v}`, username: v, _missing: true });
                names.add(v.toLowerCase());
            }
        };

        maybeAdd(owner, 'owner');
        if ((deptHead || '').trim().toLowerCase() !== (owner || '').trim().toLowerCase()) {
            maybeAdd(deptHead, 'dept');
        }

        list.sort((a, b) => (a?.username || '').localeCompare(b?.username || '', undefined, { sensitivity: 'base' }));
        return list;
    }, [users, owner, deptHead]);

    return (
        <div className="ump-container">
            <div className="ump-overlay">
                <div className="ump-content">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Modify Asset</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ump-form-group-main">
                        <div className="ump-section-header">
                            <h2>Asset Information</h2>
                        </div>

                        <form className="ump-form" onSubmit={handleSubmit}>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.site ? "ump-error" : ""}`}>
                                    <label>Site <span className="ump-required">*</span></label>
                                    <div className={`fpm-select-container`}>
                                        <select
                                            value={site}
                                            onChange={(e) => setSite(e.target.value)}
                                            autoComplete="off"
                                            style={{ color: site === "" ? "GrayText" : "black" }}
                                            className={site === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam def-colour`}
                                        >
                                            <option value={""} className="def-colour">Select Site</option>
                                            {sites.map((site) => (
                                                <option key={site._id} value={site._id} className="norm-colour">
                                                    {site.site}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.type ? "ump-error" : ""}`}>
                                    <label>Asset Type <span className="ump-required">*</span></label>
                                    <div className={`fpm-select-container`}>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            autoComplete="off"
                                            style={{ color: type === "" ? "GrayText" : "black" }}
                                            className={type === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam`}
                                        >
                                            <option value={""} className="def-colour">Select Asset Type</option>
                                            {types.map((type) => (
                                                <option key={type._id} value={type.type} className="norm-colour">
                                                    {type.type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.number ? "ump-error" : ""}`}>
                                    <label>Asset Number <span className="ump-required">*</span></label>
                                    <input
                                        type="text"
                                        name="assetNr"
                                        value={number}
                                        onChange={(e) => setNumber(e.target.value)}
                                        autoComplete="off"
                                        className="ump-input-select font-fam"
                                        placeholder="Insert Asset Number"
                                    />
                                </div>
                            </div>
                            <div className="ump-form-row">
                                <div className={`ump-form-group ${errors.area ? "ump-error" : ""}`}>
                                    <label>Operational Area <span className="ump-required">*</span></label>
                                    <div className="ump-select-container">
                                        <select
                                            value={area}
                                            onChange={(e) => setArea(e.target.value)}
                                            autoComplete="off"
                                            className={area === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam`}
                                        >
                                            <option value={""} className="def-colour">Select Area</option>
                                            {areas.map((area) => (
                                                <option key={area._id} value={area.area} className="norm-colour">
                                                    {area.area}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.owner ? "ump-error" : ""}`}>
                                    <label>Asset Owner <span className="ump-required">*</span></label>
                                    <div className="ump-select-container">
                                        <select
                                            value={owner}
                                            onChange={(e) => setOwner(e.target.value)}
                                            autoComplete="off"
                                            className={owner === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam`}
                                        >
                                            <option value={""} className="def-colour">Select Asset Owner</option>
                                            {usersWithSelected.map(user => (
                                                <option key={user._id} value={user.username} className="norm-colour">
                                                    {user.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={`ump-form-group ${errors.deptHead ? "ump-error" : ""}`}>
                                    <label>Department Head <span className="ump-required">*</span></label>
                                    <div className="ump-select-container">
                                        <select
                                            value={deptHead}
                                            onChange={(e) => setDeptHead(e.target.value)}
                                            autoComplete="off"
                                            className={deptHead === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam`}
                                        >
                                            <option value={""} className="def-colour">Select Department Head</option>
                                            {usersWithSelected.map(user => (
                                                <option key={user._id} value={user.username} className="norm-colour">
                                                    {user.username}
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
                            <button className="ump-upload-button" onClick={handleSubmit}>
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Modify Asset'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModifyAssetPopup;
