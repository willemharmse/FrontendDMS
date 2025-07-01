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
import ControlEffectiveness from './RiskInfo/ControlEffectiveness';
import axios from 'axios';

const ControlEAPopup = ({ onClose, onSave, data, onControlRename }) => {
    const [initialControlName] = useState(data.control);
    const [controlName, setControlName] = useState("");
    const [criticalControl, setCriticalControl] = useState("");
    const [controlType, setControlType] = useState("");
    const [controlActivation, setControlActivation] = useState("");
    const [hierarchy, setHierarchy] = useState("");
    const [controlAim, setControlAim] = useState("");
    const [quality, setQuality] = useState("");
    const [cer, setCER] = useState("");
    const [notes, setNotes] = useState("");
    const [description, setDescription] = useState("");
    const [performance, setPerformance] = useState("");
    const [action, setAction] = useState("");
    const [responsible, setResponsible] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [formattingColour, setFormattingColour] = useState("");
    const [helpCT, setHelpCT] = useState(false);
    const [helpCA, setHelpCA] = useState(false);
    const [helpQuality, setHelpQuality] = useState(false);
    const [helpHier, setHelpHier] = useState(false);
    const [helpCritical, setHelpCritical] = useState(false);
    const [helpCER, setHelpCER] = useState(false);
    const [controlTypeOptions] = useState(['Act', 'Object', 'System']);
    const [activationOptions] = useState(['Prevention Control', 'Consequence Minimizing Control', 'Both']);
    const [hierarchyOptions] = useState(['1. Elimination', '2. Substitution', '3. Engineering', '4. Separation', '5. Administration', '6. PPE']);
    const [aimOptions] = useState(['Safety (S)', 'Health (H)', 'Environment (E)', 'Community (C)', 'Legal & Regulatory (L&R)', 'Material Losses (M)', 'Reputation (R)']);
    const [qualityOptions] = useState(['< 30%', '30-59%', '60-90%', '> 90%']);
    const [posLists, setPosLists] = useState([]);
    const [filteredResponsible, setFilteredResponsible] = useState([]);
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);
    const responsibleInputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

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

    const openHelpCER = () => {
        setHelpCER(true);
    }

    const closeHelpCER = () => {
        setHelpCER(false);
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
                case "< 30%":
                    colIndex = 3;
                    break;
                case "30-59%":
                    colIndex = 2;
                    break;
                case "60-90%":
                    colIndex = 1;
                    break;
                case "> 90%":
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
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
                const data = res.data.stakeholders;

                const positions = Array.from(new Set(data.map(d => d.pos))).sort();

                setPosLists(positions);
            } catch (error) {
                console.log(error)
            }
        };
        fetchData();
    }, []);

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
            const isInsidePopup = e.target.closest(popupSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowResponsibleDropdown(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showResponsibleDropdown]);

    const closeAllDropdowns = () => {
        setShowResponsibleDropdown(null);
    };

    const handleResponsibleInput = (value) => {
        closeAllDropdowns();
        setResponsible(value);
        const matches = posLists
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredResponsible(matches);
        setShowResponsibleDropdown(true);

        const el = responsibleInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // On focus, show all options
    const handleResponsibleFocus = () => {
        closeAllDropdowns();
        const matches = posLists;
        setFilteredResponsible(matches);
        setShowResponsibleDropdown(true);

        const el = responsibleInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // When they pick one
    const selectResponsibleSuggestion = (value) => {
        setResponsible(value);
        setShowResponsibleDropdown(false);
    };

    useEffect(() => {
        if (data) {
            console.log("🔍 incoming data:", data)

            setControlName(data.control || '');
            setCriticalControl(data.critical || '');
            setControlType(data.act || '');
            setControlActivation(data.activation || '');
            setHierarchy(data.hierarchy || '');
            setControlAim(data.cons || '');
            setQuality(data.quality || '');
            setCER(data.cer || '');
            setNotes(data.notes || '');
            setDescription(data.description || "");
            setPerformance(data.performance || "");
            setResponsible(data.responsible || "");
            setAction(data.action || "");
            setDueDate(data.dueDate || "");
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
            description: description,
            performance: performance,
            action: action,
            dueDate: dueDate,
            responsible: responsible
        };

        if (controlName.trim() !== initialControlName.trim()) {
            onControlRename(initialControlName.trim(), controlName.trim());
        }

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
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
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
                                            <label>Main Consequence that the Control Aims to Address</label>
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
                                                    <label className={`ibra-popup-page-label-output-2 ${formattingColour}`}><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className={`ibra-popup-label-icon`} onClick={openHelpCER} />Control Effectiveness Rating</label>
                                                    <label
                                                        style={{ marginBottom: "8px", marginTop: "3px", fontWeight: "bold" }}
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
                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "16px", marginBottom: "15px", fontWeight: "bold" }}>Control Treatment</label>
                                    <div className="ibra-popup-page-additional-row">
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className="ibra-popup-page-form-group">
                                                    <label style={{ fontSize: "15px" }}>Control Improvement/ Action
                                                    </label>
                                                    <input
                                                        className="cea-popup-page-input"
                                                        value={action}
                                                        onChange={(e) => setAction(e.target.value)}
                                                        placeholder="Insert Required Action to Improve Control"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-additional-row">
                                                <div className="ibra-popup-page-column-half">
                                                    <div className="ibra-popup-page-component-wrapper">
                                                        <div className="ibra-popup-page-form-group">
                                                            <label style={{ fontSize: "15px" }}>Responible Person
                                                            </label>
                                                            <div className="ibra-popup-page-select-container">
                                                                <input
                                                                    ref={responsibleInputRef}
                                                                    className="cea-popup-page-input"
                                                                    value={responsible}
                                                                    onChange={e => handleResponsibleInput(e.target.value)}
                                                                    onFocus={() => handleResponsibleFocus()}
                                                                    placeholder="Select Responsible Person"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ibra-popup-page-column-half">
                                                    <div className="ibra-popup-page-component-wrapper">
                                                        <div className="ibra-popup-page-form-group">
                                                            <label style={{ fontSize: "15px" }}>Due Date
                                                            </label>
                                                            <input
                                                                type='date'
                                                                className="cea-popup-page-input"
                                                                value={dueDate}
                                                                onChange={(e) => setDueDate(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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

            {showResponsibleDropdown && filteredResponsible.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredResponsible.filter(term => term && term.trim() !== "").map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectResponsibleSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}

            {helpCT && (<ControlType setClose={closeHelpCT} />)}
            {helpCA && (<ControlActivation setClose={closeHelpCA} />)}
            {helpHier && (<ControlHierarchy setClose={closeHelpHier} />)}
            {helpCritical && (<CriticalControl setClose={closeHelpCritical} />)}
            {helpQuality && (<ControlQuality setClose={closeHelpQuality} />)}
            {helpCER && (<ControlEffectiveness setClose={closeHelpCER} />)}
        </div>
    );
};

export default ControlEAPopup;