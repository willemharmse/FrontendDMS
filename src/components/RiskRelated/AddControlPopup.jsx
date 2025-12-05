import React, { useState, useEffect, useRef } from 'react';
import './ControlEAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import ControlType from './RiskInfo/ControlType';
import ControlActivation from './RiskInfo/ControlActivation';
import ControlHierarchy from './RiskInfo/ControlHierarchy';
import CriticalControl from './RiskInfo/CriticalControl';
import ControlQuality from './RiskInfo/ControlQuality';
import axios from 'axios';
import DatePicker from 'react-multi-date-picker';
import { toast } from 'react-toastify';

const AddControlPopup = ({ onClose }) => {
    const [controlName, setControlName] = useState("");
    const [criticalControl, setCriticalControl] = useState("");
    const [controlType, setControlType] = useState("");
    const [controlActivation, setControlActivation] = useState("");
    const [hierarchy, setHierarchy] = useState("");
    const [controlAim, setControlAim] = useState("");
    const [quality, setQuality] = useState("");
    const [description, setDescription] = useState("");
    const [performance, setPerformance] = useState("");
    const [helpCT, setHelpCT] = useState(false);
    const [helpCA, setHelpCA] = useState(false);
    const [helpQuality, setHelpQuality] = useState(false);
    const [helpHier, setHelpHier] = useState(false);
    const [helpCritical, setHelpCritical] = useState(false);
    const [controlTypeOptions] = useState(['Act', 'Object', 'System']);
    const [activationOptions] = useState(['Prevention Control', 'Consequence Minimizing Control', 'Both']);
    const [hierarchyOptions] = useState(['1. Elimination', '2. Substitution', '3. Engineering', '4. Separation', '5. Administration', '6. PPE']);
    const [aimOptions] = useState(['Safety (S)', 'Health (H)', 'Environment (E)', 'Community (C)', 'Legal & Regulatory (L&R)', 'Material Losses (M)', 'Reputation (R)']);
    const [qualityOptions] = useState(['< 30%', '30-59%', '60-90%', '> 90%']);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        author: false,
        departmentHead: false,
        reviewer: false,
        hazards: false,
        controls: false,
        riskSource: false
    });

    const openHelpCT = () => {
        setHelpCT(true);
    }

    const closeHelpCT = () => {
        setHelpCT(false);
    }

    const openHelpQuality = () => {
        setHelpQuality(true);
    }

    const closeHelpQuality = () => {
        setHelpQuality(false);
    }

    const openHelpCritical = () => {
        setHelpCritical(true);
    }

    const closeHelpCritical = () => {
        setHelpCritical(false);
    }

    const openHelpCA = () => {
        setHelpCA(true);
    }

    const closeHelpCA = () => {
        setHelpCA(false);
    }

    const openHelpHier = () => {
        setHelpHier(true);
    }

    const closeHelpHier = () => {
        setHelpHier(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!controlName.trim()) {
            toast.warn(`Please ensure a Control Name is entered.`, { autoClose: 1200, closeButton: false });
            return;
        }
        if (!criticalControl.trim()) {
            toast.warn(`Please select an option for Critical Control.`, { autoClose: 1200, closeButton: false });
            return;
        }
        if (!controlType.trim()) {
            toast.warn(`Please specify if the control is an Act, Object or System.`, { autoClose: 1200, closeButton: false });
            return;
        }
        if (!controlActivation.trim()) {
            toast.warn(`Please specify the Control Activation.`, { autoClose: 1200, closeButton: false });
            return;
        }
        if (!hierarchy.trim()) {
            toast.warn(`Please specify the Hierarchy of Controls.`, { autoClose: 1200, closeButton: false });
            return;
        }
        if (!controlAim.trim()) {
            toast.warn(`Please specify the Main Consequence that the control aims to address.`, { autoClose: 1200, closeButton: false });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.REACT_APP_URL}/api/riskInfo/add-control`,
                {
                    controlName: controlName.trim(),
                    criticalControl: criticalControl.trim(),
                    controlType: controlType.trim(),
                    controlActivation: controlActivation.trim(),
                    hierarchy: hierarchy.trim(),
                    controlAim: controlAim.trim(),
                    quality: quality.trim(),
                    description: description.trim(),
                    performance: performance.trim(),
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            const { message } = res.data;
            toast.success(message || 'Control added successfully.', {
                autoClose: 800,
                closeButton: false
            });

            setControlActivation("");
            setControlAim("");
            setControlName("");
            setControlType("");
            setCriticalControl("");
            setDescription("");
            setHierarchy("");
            setPerformance("");
            setQuality("");

            onClose();
        } catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error || 'Failed to add control.';

            if (status === 409 || err?.response?.data?.code === 'duplicate') {
                toast.error('A control with that name already exists.', {
                    autoClose: 1200,
                    closeButton: false
                });
            } else {
                toast.error(msg, { autoClose: 1200, closeButton: false });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Add Control</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group inline-field ${errors.author ? "error-upload-required-up" : ""}`}>
                                    <label style={{ marginRight: '40px', textAlign: "left" }}>Control</label>
                                    <textarea
                                        className="cea-popup-page-text-area-input"
                                        value={controlName}
                                        onChange={(e) => setControlName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="cea-4-row">
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCritical} className="ibra-popup-label-icon" />Critical Control <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={criticalControl}
                                                    onChange={(e) => setCriticalControl(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value='Yes'>Yes</option>
                                                    <option value='No'>No</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCT} className="ibra-popup-label-icon" />Act, Object or System <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlType}
                                                    onChange={(e) => setControlType(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    {
                                                        controlTypeOptions.map((option, index) => (
                                                            <option key={index} value={option}>
                                                                {option}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label style={{ marginLeft: '6px' }}><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpCA} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Control Activation <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlActivation}
                                                    style={{ paddingRight: "30px" }}
                                                    onChange={(e) => setControlActivation(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    {
                                                        activationOptions.map((option, index) => {
                                                            // Remove "Control" / "control" and any space right before it
                                                            const displayLabel = option.replace(/ ?[Cc]ontrol\b/, '');

                                                            return (
                                                                <option key={index} value={option}>
                                                                    {displayLabel}
                                                                </option>
                                                            );
                                                        })
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpHier} className="ibra-popup-label-icon" />Hierarchy of Controls <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={hierarchy}
                                                    onChange={(e) => setHierarchy(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    {
                                                        hierarchyOptions.map((option, index) => (
                                                            <option key={index} value={option}>
                                                                {option}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                            <label>Main Consequence that the Control Aims to Address <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlAim}
                                                    onChange={(e) => setControlAim(e.target.value)}
                                                >
                                                    <option value="">Select Consequence</option>
                                                    {
                                                        aimOptions.map((option, index) => (
                                                            <option key={index} value={option}>
                                                                {option}
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="ibra-popup-page-additional-row">
                                        <div className="cea-popup-page-component-wrapper-control-management">
                                            <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                                <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpQuality} className="ibra-popup-label-icon" />Quality</label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        className="ibra-popup-page-select"
                                                        value={quality}
                                                        onChange={(e) => setQuality(e.target.value)}
                                                    >
                                                        <option value="">Select Quality</option>
                                                        {
                                                            qualityOptions.map((option, index) => (
                                                                <option key={index} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Description of Control
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Description of control"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Performance Requirements and Verification
                                    </label>
                                    <textarea
                                        value={performance}
                                        onChange={(e) => setPerformance(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Performance requirement of control"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (`Submit`)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {helpCT && (<ControlType setClose={closeHelpCT} />)}
            {helpCA && (<ControlActivation setClose={closeHelpCA} />)}
            {helpHier && (<ControlHierarchy setClose={closeHelpHier} />)}
            {helpCritical && (<CriticalControl setClose={closeHelpCritical} />)}
            {helpQuality && (<ControlQuality setClose={closeHelpQuality} />)}
        </div>
    );
};

export default AddControlPopup;