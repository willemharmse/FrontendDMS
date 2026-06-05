import React, { useState, useEffect, useRef } from 'react';
import './ControlEAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faCalendarDays, faX } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import ControlType from './RiskInfo/ControlType';
import ControlActivation from './RiskInfo/ControlActivation';
import ControlHierarchy from './RiskInfo/ControlHierarchy';
import CriticalControl from './RiskInfo/CriticalControl';
import ControlQuality from './RiskInfo/ControlQuality';
import ControlEffectiveness from './RiskInfo/ControlEffectiveness';
import axios from 'axios';
import DatePicker from 'react-multi-date-picker';
import { toast } from "react-toastify";
import ControlSuggestionPopup from './ControlManagement/ControlSuggestionPopup';
import ClosePopupConfirmation from './ClosePopupConfirmation';

const ControlEAPopup = ({ onClose, onSave, data, onControlRename, readOnly, existingControlNames = [], relevantControls }) => {
    const [initialControlName] = useState(data.control);
    const [controlName, setControlName] = useState("");
    const [criticalControl, setCriticalControl] = useState("");
    const [controlType, setControlType] = useState("");
    const [controlActivation, setControlActivation] = useState("");
    const [hierarchy, setHierarchy] = useState("");
    const [controlAim, setControlAim] = useState("");
    const [quality, setQuality] = useState("");
    const [category, setCategory] = useState("");
    const [categoryOptions, setCategoryOptions] = useState([]);
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
    const [systemControlSet, setSystemControlSet] = useState(new Set());
    const [isSystemControlName, setIsSystemControlName] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
    const initialSnapshotRef = useRef("");

    const buildCEASnapshot = () =>
        JSON.stringify({
            controlName: controlName || "",
            criticalControl: criticalControl || "",
            controlType: controlType || "",
            controlActivation: controlActivation || "",
            hierarchy: hierarchy || "",
            controlAim: controlAim || "",
            quality: quality || "",
            category: category || "",
            notes: notes || "",
            description: description || "",
            performance: performance || "",
            action: action || "",
            responsible: responsible || "",
            dueDate: dueDate || ""
        });

    const buildInitialCEASnapshot = (sourceData) =>
        JSON.stringify({
            controlName: sourceData?.control || "",
            criticalControl: sourceData?.critical || "",
            controlType: sourceData?.act || "",
            controlActivation: sourceData?.activation || "",
            hierarchy: sourceData?.hierarchy || "",
            controlAim: sourceData?.cons || "",
            quality: sourceData?.quality || "",
            category: sourceData?.category || "",
            notes: sourceData?.notes || "",
            description: sourceData?.description || "",
            performance: sourceData?.performance || "",
            action: sourceData?.action || "",
            responsible: sourceData?.responsible || "",
            dueDate: sourceData?.dueDate || ""
        });

    const hasUnsavedChanges = () => {
        if (readOnly) return false;
        return buildCEASnapshot() !== initialSnapshotRef.current;
    };

    const handleAttemptClose = () => {
        if (readOnly) {
            onClose();
            return;
        }

        if (hasUnsavedChanges()) {
            setShowCloseConfirmation(true);
            return;
        }
        onClose();
    };

    const handleDismissCloseConfirmation = () => {
        setShowCloseConfirmation(false);
    };

    const handleCloseMainPopup = () => {
        setShowCloseConfirmation(false);
        onClose();
    };

    const handleSubmitAndCloseFromConfirmation = () => {
        setShowCloseConfirmation(false);
        handleSubmit();
    };

    useEffect(() => {
        const fetchSystemControls = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/controls`);
                if (!res.ok) throw new Error(`Failed: ${res.status}`);
                const data = await res.json();
                const list = data?.controls || [];

                const set = new Set(
                    list.map(c => norm(c?.control)).filter(Boolean)
                );

                setSystemControlSet(set);
            } catch (e) {
                console.error("Failed to fetch system controls:", e);
                setSystemControlSet(new Set());
            }
        };

        fetchSystemControls();
    }, []);

    useEffect(() => {
        const clean = norm(controlName);
        setIsSystemControlName(clean ? systemControlSet.has(clean) : false);
    }, [controlName, systemControlSet]);

    const fetchCategories = async () => {
        const route = `/api/riskInfo/getCategories`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`);
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const result = await response.json();
            const sortedCategories = (result.categories || []).sort((a, b) =>
                a.category.localeCompare(b.category, undefined, { sensitivity: 'base' })
            );

            setCategoryOptions(sortedCategories);
        } catch (error) {
            console.log(error);
            setCategoryOptions([]);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);

    const [controlTypeOptions] = useState(['Act', 'Object', 'System']);
    const [activationOptions] = useState(['Prevention Control', 'Consequence Minimizing Control', 'Both']);
    const [hierarchyOptions] = useState(['1. Elimination', '2. Substitution', '3. Engineering', '4. Separation', '5. Administration', '6. PPE']);
    const [aimOptions] = useState(['Safety (S)', 'Health (H)', 'Environment (E)', 'Community (C)', 'Legal & Regulatory (L&R)', 'Material Losses (M)', 'Reputation (R)']);
    const [qualityOptions] = useState(['< 30%', '30-59%', '60-90%', '> 90%']);
    const [usersList, setUsersList] = useState([]);
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
        if (!quality || !hierarchy) {
            setCER("");
            setFormattingColour("");
            return;
        }

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
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
                if (!res.ok) throw new Error(`Failed: ${res.status}`);
                const data = await res.json();
                const users = (data.users || [])
                    .map(u => u.username)
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                setUsersList(users);
            } catch (error) {
                console.log(error);
                setUsersList([]);
            }
        };
        fetchUsers();
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
        const matches = usersList
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
        if (readOnly) return;
        closeAllDropdowns();
        const matches = usersList;
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
            console.log("🔍 incoming data:", data);

            setControlName(data.control || "");
            setCriticalControl(data.critical || "");
            setControlType(data.act || "");
            setControlActivation(data.activation || "");
            setHierarchy(data.hierarchy || "");
            setControlAim(data.cons || "");
            setQuality(data.quality || "");
            setCategory(data.category || "");
            setCER(data.cer || "");
            setNotes(data.notes || "");
            setDescription(data.description || "");
            setPerformance(data.performance || "");
            setResponsible(data.responsible || "");
            setAction(data.action || "");
            setDueDate(data.dueDate || "");
        }
    }, [data]);

    useEffect(() => {
        initialSnapshotRef.current = buildInitialCEASnapshot(data);
    }, [data]);

    const norm = (s) =>
        (s ?? "")
            .toString()
            .trim()
            .replace(/\s*\*\s*$/, "")   // remove trailing star marker for comparisons
            .replace(/\s+/g, " ")
            .toLowerCase();

    const ensureStar = (s) => {
        const v = (s ?? "").toString().trim();
        if (!v) return v;
        return /\s*\*\s*$/.test(v) ? v : `${v} *`;
    };

    const handleSubmit = async (e) => {
        if (readOnly) {
            onClose();
            return;
        }

        const oldName = (data?.control ?? "").toString();
        const newNameRaw = (controlName ?? "").toString().trim();

        const oldNorm = norm(oldName);
        const newNorm = norm(newNameRaw);

        // Relevant controls names (ignore star)
        const relevantNormSet = new Set(
            (relevantControls || [])
                .map(rc => norm(rc?.control))
                .filter(Boolean)
        );

        // System controls names (you already loaded into systemControlSet as normalized)
        const systemNormSet = systemControlSet; // assumed already normalized via norm()

        // Existing CEA names (if you have them) — normalize too
        const ceaNormSet = new Set(
            (existingControlNames || [])
                .map(n => norm(n))
                .filter(Boolean)
        );

        if (!newNameRaw) {
            toast.warn("Please enter a Control Name.", { closeButton: false, autoClose: 2000 });
            return;
        }

        const nameChanged = newNorm !== oldNorm;

        if (nameChanged) {
            const isDuplicate =
                relevantNormSet.has(newNorm) ||
                systemNormSet.has(newNorm) ||
                ceaNormSet.has(newNorm);

            if (isDuplicate) {
                toast.error(
                    "That control name already exists (in Relevant Controls or System Controls). Please choose a unique name.",
                    { autoClose: 3000, closeButton: false }
                );
                return;
            }
        }

        const isSystem = systemNormSet.has(newNorm);

        const finalControlName =
            nameChanged && !isSystem ? ensureStar(newNameRaw) : newNameRaw;

        const updatedData = {
            control: finalControlName,
            critical: criticalControl,
            act: controlType,
            activation: controlActivation,
            hierarchy: hierarchy,
            cons: controlAim,
            quality: quality,
            category: category,
            cer: cer,
            notes: notes,
            description: description,
            performance: performance,
            action: action,
            dueDate: dueDate,
            responsible: responsible
        };

        console.log(updatedData);

        if (controlName.trim() !== initialControlName.trim()) {
            onControlRename(initialControlName.trim(), finalControlName.trim());
        }

        // Call the onSave function with updated data
        onSave(data.id, updatedData);
        onClose();
    };

    const getControlDataForSuggestion = () => {
        return {
            controlName: controlName,
            criticalControl: criticalControl,
            controlType: controlType,
            controlActivation: controlActivation,
            hierarchy: hierarchy,
            controlAim: controlAim,
            quality: quality,
            description: description,
            performance: performance,
            category: category
        };
    };

    const handleSuggestClick = () => {
        if (!controlName.trim()) {
            toast.warn("Please enter a Control Name before suggesting.");
            return;
        }

        if (isSystemControlName) {
            toast.warn("This control already exists in the system and cannot be suggested.", {
                autoClose: 2000,
                closeButton: false,
            });
            return;
        }

        setShowSuggestionPopup(true);
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Control Effectiveness Analysis (CEA)</h2>
                        <button className="review-date-close" onClick={handleAttemptClose} title="Close Popup">×</button>
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
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>

                            <div className="cea-4-row">
                                <div className="cea-column-third">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCritical} className="ibra-popup-label-icon" />Critical Control</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={criticalControl}
                                                    onChange={(e) => setCriticalControl(e.target.value)}
                                                    disabled={readOnly}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value='Yes'>Yes</option>
                                                    <option value='No'>No</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cea-column-third">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpCT} className="ibra-popup-label-icon" />Act, Object or System</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlType}
                                                    onChange={(e) => setControlType(e.target.value)}
                                                    disabled={readOnly}
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
                                <div className="cea-column-third">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label style={{ marginLeft: '6px' }}><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpCA} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Control Activation</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={controlActivation}
                                                    style={{ paddingRight: "30px" }}
                                                    onChange={(e) => setControlActivation(e.target.value)}
                                                    disabled={readOnly}
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
                            </div>

                            <div className="cea-4-row">
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpHier} className="ibra-popup-label-icon" />Hierarchy of Controls</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={hierarchy}
                                                    onChange={(e) => setHierarchy(e.target.value)}
                                                    disabled={readOnly}
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
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} onClick={openHelpQuality} className="ibra-popup-label-icon" />Quality</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={quality}
                                                    onChange={(e) => setQuality(e.target.value)}
                                                    disabled={readOnly}
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
                                <div className="cea-column-fourth">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                            <label>Category</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    disabled={isSystemControlName || readOnly}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categoryOptions.map((option, index) => (
                                                        <option key={index} value={option.category}>
                                                            {option.category}
                                                        </option>
                                                    ))}
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
                                                    disabled={readOnly}
                                                >
                                                    <option value="">Select Consequence</option>
                                                    {
                                                        [...aimOptions]
                                                            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
                                                            .map((option) => (
                                                                <option key={option} value={option}>
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
                                    <div className={`cea-popup-page-component-wrapper cer-wrapper ${formattingColour}`} style={{ height: "calc(100% - 42px)" }}>
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label style={{ marginBottom: "10px", display: "block" }} className={`${formattingColour}`}><FontAwesomeIcon icon={faInfoCircle} style={{ cursor: 'pointer' }} className={`ibra-popup-label-icon`} onClick={openHelpCER} />Control Effectiveness Rating</label>
                                            <label
                                                style={{ display: "flex", fontWeight: "bold", height: "45px", marginBottom: "0px", justifyContent: "center" }}
                                                className={`cea-popup-page-label-output ${formattingColour}`}
                                            >
                                                {cer || "-"}
                                            </label>
                                        </div>

                                        <div className="ibra-popup-page-column-half">

                                            {/*
                                            
                                            */}
                                        </div>
                                    </div>

                                    {/* 
                                    <div className="ibra-popup-page-additional-row" style={{ marginTop: "8px" }}>
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
                                    */}
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
                                        placeholder="Insert Notes Regarding the Control"
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
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
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
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
                                        readOnly={readOnly}
                                        style={{ resize: "none" }}
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
                                                    <textarea
                                                        className="cea-popup-page-textarea-imp"
                                                        value={action}
                                                        onChange={(e) => setAction(e.target.value)}
                                                        placeholder="Insert Required Action to Improve Control"
                                                        readOnly={readOnly}
                                                        style={{ resize: "none" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ibra-popup-page-column-half" style={{ display: "flex", alignItems: "center" }}>
                                            <div className="ibra-popup-page-additional-row">
                                                <div className="ibra-popup-page-column-half">
                                                    <div className="ibra-popup-page-component-wrapper">
                                                        <div className="ibra-popup-page-form-group">
                                                            <label style={{ fontSize: "15px" }}>Responsible Person
                                                            </label>
                                                            <div className="ibra-popup-page-select-container">
                                                                <input
                                                                    ref={responsibleInputRef}
                                                                    className="cea-popup-page-input"
                                                                    value={responsible}
                                                                    onChange={e => handleResponsibleInput(e.target.value)}
                                                                    onFocus={() => handleResponsibleFocus()}
                                                                    placeholder="Select Responsible Person"
                                                                    readOnly={readOnly}
                                                                    style={{
                                                                        height: "16px",
                                                                        marginBottom: "4px"
                                                                    }}
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
                                                            <div className="ibra-popup-risk-treatment-date-wrap">
                                                                <DatePicker
                                                                    value={dueDate || ""}
                                                                    format="YYYY-MM-DD"
                                                                    onChange={(val) =>
                                                                        setDueDate(val?.format("YYYY-MM-DD"))
                                                                    }
                                                                    rangeHover={false}
                                                                    highlightToday={false}
                                                                    editable={false}
                                                                    placeholder="YYYY-MM-DD"
                                                                    hideIcon={false}
                                                                    inputClass='cea-popup-page-input'
                                                                    disabled={readOnly}
                                                                    onFocus={() => {
                                                                        setErrors(prev => ({
                                                                            ...prev,
                                                                            dateConducted: false
                                                                        }))
                                                                    }}
                                                                    style={{
                                                                        width: "calc(100% - 6px)",
                                                                        height: "16px",
                                                                        marginBottom: "4px"
                                                                    }}
                                                                    onOpenPickNewDate={false}
                                                                />

                                                                {!!dueDate ? (
                                                                    <>
                                                                        {!readOnly && (
                                                                            <button
                                                                                type="button"
                                                                                className="ibra-popup-risk-treatment-date-clear-btn"
                                                                                style={{ right: "7px", top: "20px" }}
                                                                                title="Clear date"
                                                                                disabled={readOnly}
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    if (readOnly) return;
                                                                                    setDueDate("");
                                                                                }}
                                                                            >
                                                                                <FontAwesomeIcon icon={faX} />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span
                                                                        className="ibra-popup-risk-treatment-date-calendar-icon"
                                                                        style={{ right: "6px", top: "20px" }}
                                                                        aria-hidden="true"
                                                                    >
                                                                        <FontAwesomeIcon icon={faCalendarDays} />
                                                                    </span>
                                                                )}
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
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (readOnly ? `Close Popup` : `Submit`)}
                            </button>

                            {!readOnly && (
                                <button
                                    className="ibra-popup-page-upload-button"
                                    onClick={handleSuggestClick}
                                    style={{ marginLeft: 20 }}
                                    title={isSystemControlName ? "This control already exists in the system" : "Suggest this control to the system"}
                                    disabled={isSystemControlName || !controlName.trim()}
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (`Suggest Control`)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showSuggestionPopup && (
                <ControlSuggestionPopup
                    isOpen={showSuggestionPopup}
                    onClose={() => setShowSuggestionPopup(false)}
                    controlData={getControlDataForSuggestion()}
                />
            )}

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

            {showCloseConfirmation && (
                <ClosePopupConfirmation
                    onClose={handleCloseMainPopup}
                    onSubmit={handleSubmitAndCloseFromConfirmation}
                    closePopup={handleDismissCloseConfirmation}
                />
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