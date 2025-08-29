import React, { useState, useEffect } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterAssetPopup = ({ onClose }) => {
    const [site, setSite] = useState('');
    const [type, setType] = useState('');
    const [number, setNumber] = useState('');
    const [area, setArea] = useState('');
    const [owner, setOwner] = useState('');
    const [deptHead, setDeptHead] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState({});
    const [types, setTypes] = useState([]);
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);
    const [areas, setAreas] = useState([]);

    useEffect(() => {
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
                autoClose: 800,
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

                setTypes(data.assetTypes);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchValues();
    }, []);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadSites`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setSites(data.sites);
            } catch (error) {
                setError(error.message);
            }
        };

        const fetchAreas = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadAreas`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setAreas(data.areas);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchValues();
        fetchAreas();
    }, []);

    const handleFileUpload = async () => {
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('site', site);
        formData.append('owner', owner);
        formData.append('assetType', type);
        formData.append('operationalArea', area);
        formData.append('deptHead', deptHead);
        formData.append('assetNumber', number);

        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/registerAsset`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData,
            });
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
                closeButton: false, autoClose: 800, style: { textAlign: 'center' }
            });
        } catch (error) {
            setError(error.message);
            setLoading(false);
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
                        <h2 className="review-date-title">Register Asset</h2>
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
                                    <div className="ump-select-container">
                                        <select
                                            value={site}
                                            onChange={(e) => setSite(e.target.value)}
                                            autoComplete="off"
                                            className={site === "" ? `ump-input-select font-fam def-colour` : `ump-input-select font-fam`}
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
                                    <div className="ump-select-container">
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            autoComplete="off"
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
                                            <option value={""} className="def-colour">Select Operational Area</option>
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
                                            {users.map((user) => (
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
                                            {users.map((user) => (
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
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Register Asset'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterAssetPopup;
