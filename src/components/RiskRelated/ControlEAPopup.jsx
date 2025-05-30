import React, { useState, useEffect, useRef } from 'react';
import './ControlEAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import ControlType from './RiskInfo/ControlType';
import ControlActivation from './RiskInfo/ControlActivation';
import ControlHierarchy from './RiskInfo/ControlHierarchy';
import CriticalControl from './RiskInfo/CriticalControl';
import ControlQuality from './RiskInfo/ControlQuality';

const ControlEAPopup = ({ onClose, onSave, data }) => {
    const [controlName, setControlName] = useState("");
    const [criticalControl, setCriticalControl] = useState("");
    const [controlType, setControlType] = useState("");
    const [controlActivation, setControlActivation] = useState("");
    const [hierarchy, setHierarchy] = useState("");
    const [controlAim, setControlAim] = useState("");
    const [quality, setQuality] = useState("");
    const [cer, setCER] = useState("");
    const [notes, setNotes] = useState("");
    const [formattingColour, setFormattingColour] = useState("");
    const [helpCT, setHelpCT] = useState(false);
    const [helpCA, setHelpCA] = useState(false);
    const [helpQuality, setHelpQuality] = useState(false);
    const [helpHier, setHelpHier] = useState(false);
    const [helpCritical, setHelpCritical] = useState(false);
    const [controlTypeOptions] = useState(['Act', 'Object', 'System']);
    const [activationOptions] = useState(['Prevention Control', 'Consequence Minimizing Control', 'Both']);
    const [hierarchyOptions] = useState(['1. Elimination', '2. Substitution', '3. Engineering', '4. Separation', '5. Administration', '6. PPE']);
    const [aimOptions] = useState(['Safety', 'Health', 'Environment', 'Community', 'Legal & Regulatory', 'Material Losses', 'Reputation']);
    const [qualityOptions] = useState(['<29%', '30-59%', '60-90%', '>90%']);

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

    const valid = () => {

        return true;
    };

    useEffect(() => {
        if (quality && hierarchy) {
            const hierarchyVal = parseInt(hierarchy.split('. ')[0]) - 1;
            console.log(hierarchyVal);
            const ratingMatrix = [
                ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
                ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
                ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
                ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
                ['Could Improve', 'Could Improve', 'Not Effective', 'Not Effective'],
                ['Not Effective', 'Not Effective', 'Not Effective', 'Not Effective']
            ];

            let colIndex;

            switch (quality) {
                case "<29%":
                    colIndex = 3;
                    break;
                case "30-59%":
                    colIndex = 2;
                    break;
                case "60-90%":
                    colIndex = 1;
                    break;
                case ">90%":
                    colIndex = 0;
                    break;
                default:
                    colIndex = -1; // Optional: handle unexpected values
            }
            console.log("2" + colIndex);

            let matrixValue = null;
            if (
                hierarchyVal >= 0 && hierarchyVal < ratingMatrix.length &&
                colIndex >= 0 && colIndex < ratingMatrix[0].length
            ) {
                matrixValue = ratingMatrix[hierarchyVal][colIndex];
            }

            setCER(matrixValue);

            switch (matrixValue) {
                case "Very Effective": setFormattingColour('cea-popup-page-input-green')
                    break;
                case "Could Improve": setFormattingColour('cea-popup-page-input-yellow')
                    break;
                case "Not Effective": setFormattingColour('cea-popup-page-input-red')
                    break;
            }
        }
    }, [quality, hierarchy]);

    useEffect(() => {
        if (data) {
            setControlName(data.control || '');
            setCriticalControl(data.critical || '');
            setControlType(data.act || '');
            setControlActivation(data.activation || '');
            setHierarchy(data.hierarchy || '');
            setControlAim(data.cons || '');
            setQuality(data.quality || '');
            setCER(data.cer || '');
            setNotes(data.notes || '');
        }
    }, [data]);


    const handleSubmit = async (e) => {
        const updatedData = {
            control: controlName,
            critical: criticalControl,
            act: controlType,
            activation: controlActivation,
            hierarchy: hierarchy,
            cons: controlAim,
            quality: quality,
            cer: cer,
            notes: notes,
        };

        // Call the onSave function with updated data
        onSave(data.nr, updatedData);
        onClose();
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Control Effectiveness Analysis (CEA)</h2>
                        <button
                            className="ibra-popup-page-close-button"
                            onClick={onClose}
                            title="Close Popup"
                        >
                            ×
                        </button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2">
                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group inline-field ${errors.author ? "error-upload-required-up" : ""}`}>
                                    <label style={{ marginRight: '40px', textAlign: "left" }}>Control</label>
                                    <input
                                        className="cea-popup-page-input"
                                        value={controlName}
                                        onChange={(e) => setControlName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="cea-4-row">
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCritical} className="ibra-popup-label-icon" />Critical Control</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={criticalControl}
                                                    onChange={(e) => setCriticalControl(e.target.value)}
                                                >
                                                    <option value="">Choose Option</option>
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
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCT} className="ibra-popup-label-icon" />Act, Object or System</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlType}
                                                    onChange={(e) => setControlType(e.target.value)}
                                                >
                                                    <option value="">Choose Option</option>
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
                                            <label style={{ marginLeft: '6px' }}><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpCA} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Control Activation</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlActivation}
                                                    onChange={(e) => setControlActivation(e.target.value)}
                                                >
                                                    <option value="">Choose Option</option>
                                                    {
                                                        activationOptions.map((option, index) => (
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
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpHier} className="ibra-popup-label-icon" />Hierarchy of Controls</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={hierarchy}
                                                    onChange={(e) => setHierarchy(e.target.value)}
                                                >
                                                    <option value="">Choose Option</option>
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
                                            <label>Specific Consequence that the Control Aims to Address</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlAim}
                                                    onChange={(e) => setControlAim(e.target.value)}
                                                >
                                                    <option value="">Choose Consequence</option>
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
                                        <div className="ibra-popup-page-column-half">
                                            <div className="cea-popup-page-component-wrapper">
                                                <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                                    <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpQuality} className="ibra-popup-label-icon" />Quality</label>
                                                    <div className="ibra-popup-page-select-container">
                                                        <select
                                                            className="ibra-popup-page-select"
                                                            value={quality}
                                                            onChange={(e) => setQuality(e.target.value)}
                                                        >
                                                            <option value="">Choose Quality</option>
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
                                        <div className="ibra-popup-page-column-half">
                                            <div className={`cea-popup-page-component-wrapper ${formattingColour}`}>
                                                <div className={`ibra-popup-page-form-group`}>
                                                    <label className={`${formattingColour}`}><FontAwesomeIcon icon={faInfoCircle} className={`ibra-popup-label-icon`} />Control Effectiveness Rating</label>
                                                    <label
                                                        style={{ marginBottom: "18px", fontWeight: "bold" }}
                                                        className={`ibra-popup-page-label-output ${formattingColour}`}
                                                    >
                                                        {cer || "-"}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Notes Regarding the Control
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Insert Improvement to Control"
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
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
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

export default ControlEAPopup;