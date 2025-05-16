import React, { useState, useEffect } from 'react';
import './IBRAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FunctionalOwnership from './RiskInfo/FunctionalOwnership';
import RiskSource from './RiskInfo/RiskSource';
import Hazard from './RiskInfo/Hazard';

const IBRAPopup = ({ onClose, onSave, data }) => {
    // State for dropdown options
    const [mainAreas] = useState(['MA1', 'MA2', 'MA3', 'MA4', 'MA5']);
    const [subAreas] = useState({
        'MA1': ['MA1-SUB1', 'MA1-SUB2', 'MA1-SUB3'],
        'MA2': ['MA2-SUB1', 'MA2-SUB2', 'MA2-SUB3'],
        'MA3': ['MA3-SUB1', 'MA3-SUB2', 'MA3-SUB3'],
        'MA4': ['MA4-SUB1', 'MA4-SUB2', 'MA4-SUB3'],
        'MA5': ['MA5-SUB1', 'MA5-SUB2', 'MA5-SUB3']
    });
    const [functionalOwners] = useState(['Owner1', 'Owner2', 'Owner3', 'Owner4', 'Owner5']);
    const [likelihoodOptions] = useState(['1: Rare', '2. Unlikely', '3. Possible', '4. Likely', '5. Almost Certain']);
    const [maxRiskRankOptions] = useState(['1-3: Low', '4-6: Medium', '7-9: High']);
    const [riskSources] = useState(['Objects', 'Environment', 'PH1', 'PH2', 'PH3']);
    const [helpFO, setHelpFO] = useState(false);
    const [helpRS, setHelpRS] = useState(false);
    const [helpHaz, setHelpHaz] = useState(false);
    const [classNameRiskRank, setClassNameRiskRank] = useState('');

    const openHelpFO = () => {
        setHelpFO(true);
    };

    const closeHelpFO = () => {
        setHelpFO(false);
    };

    const openHelpRS = () => {
        setHelpRS(true);
    }

    const closeHelpRS = () => {
        setHelpRS(false);
    }

    const openHelpHaz = () => {
        setHelpHaz(true);
    }

    const closeHelpHaz = () => {
        setHelpHaz(false);
    }

    // State for selected values
    const [majorRisk, setMajorRisk] = useState('');
    const [priorityEvent, setPriorityEvent] = useState('');
    const [maxConsequence, setMaxConsequence] = useState('');
    const [possibleImprovements, setPossibleImprovements] = useState('');
    const [additionalComments, setAdditionalComments] = useState('');
    const [selectedMainArea, setSelectedMainArea] = useState('');
    const [selectedSubArea, setSelectedSubArea] = useState('');
    const [selectedOwner, setSelectedOwner] = useState('');
    const [selectedLikelihood, setSelectedLikelihood] = useState('');
    const [selectedUE, setSelectedUE] = useState('');
    const [selectedMaxRiskRank, setSelectedMaxRiskRank] = useState('');
    const [riskSource, setRiskSource] = useState('');
    const [availableSubAreas, setAvailableSubAreas] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        author: false,
        departmentHead: false,
        reviewer: false,
        hazards: false,
        controls: false,
        riskSource: false
    });

    // Modified state for hazard types (replacing functional ownership)
    const [hazardRows, setHazardRows] = useState([
        { id: 1, value: '' }
    ]);

    // Modified state for current controls (replacing likelihood rows)
    const [controlRows, setControlRows] = useState([
        { id: 1, value: '' }
    ]);

    const [riskRankRows, setRiskRankRows] = useState([
        { id: 1, label: 'S', value: '-' },
        { id: 2, label: 'H', value: '-' },
        { id: 3, label: 'E', value: '-' },
        { id: 4, label: 'C', value: '-' },
        { id: 5, label: 'L&R', value: '-' },
        { id: 6, label: 'M', value: '-' },
        { id: 7, label: 'R', value: '-' },
    ]);

    const riskRankOptions = ['-', '1: Ins', '2: Min', '3: Mod', '4: High', '5: Maj'];

    const valid = () => {

        return true;
    };


    useEffect(() => {
        if (data) {
            // Set static fields
            setSelectedMainArea(data.main || '');
            setSelectedSubArea(data.sub || '');
            setSelectedOwner(data.owner || '');
            setSelectedLikelihood(data.odds || '');
            setSelectedMaxRiskRank(data.riskRank || '');
            setMajorRisk(data.majorRisk || '');
            setPriorityEvent(data.priority || '');
            setPossibleImprovements(data.possible || '');
            setAdditionalComments(data.additional || '');
            setMaxConsequence(data.maxConsequence || '');
            setRiskSource(data.source || '');
            setSelectedUE(data.UE || '');
            // Set hazard rows
            if (data.hazards && Array.isArray(data.hazards) && data.hazards.length) {
                setHazardRows(
                    data.hazards.map((hazard, index) => ({
                        id: index + 1,
                        value: hazard,
                    }))
                );
            }

            // Set control rows
            if (data.controls && Array.isArray(data.controls) && data.controls.length) {
                setControlRows(
                    data.controls.map((control, index) => ({
                        id: index + 1,
                        value: control,
                    }))
                );
            }

            // Set risk rank rows
            setRiskRankRows([
                { id: 1, label: 'S', value: data['S'] || '-' },
                { id: 2, label: 'H', value: data['H'] || '-' },
                { id: 3, label: 'E', value: data['E'] || '-' },
                { id: 4, label: 'C', value: data['C'] || '-' },
                { id: 5, label: 'L&R', value: data['LR'] || '-' }, // This is the fix!
                { id: 6, label: 'M', value: data['M'] || '-' },
                { id: 7, label: 'R', value: data['R'] || '-' },
            ]);

            // Update available sub areas immediately if mainArea exists
            if (data.main) {
                setAvailableSubAreas(subAreas[data.main] || []);
            }
        }
    }, [data]);

    useEffect(() => {
        if (selectedLikelihood && riskRankRows.length > 0) {
            const maxRiskRank = riskRankRows.reduce((max, row) => {
                const value = parseInt(row.value.split(':')[0]);
                return isNaN(value) ? max : Math.max(max, value);
            }, 0);

            const maxLikelihood = parseInt(selectedLikelihood.split(':')[0]);

            const riskMatrix = [
                ['1 (L)', '3 (L)', '6 (M)', '10 (M)', '15 (S)'],
                ['2 (L)', '5 (L)', '9 (M)', '14 (S)', '19 (S)'],
                ['4 (L)', '8 (M)', '13 (S)', '18 (S)', '22 (H)'],
                ['7 (M)', '12 (M)', '17 (S)', '21 (H)', '24 (H)'],
                ['11 (M)', '16 (S)', '20 (S)', '23 (H)', '25 (H)'],
            ];

            // Adjust indices because matrix is 0-indexed
            const rowIdx = maxLikelihood - 1;
            const colIdx = maxRiskRank - 1;

            let matrixValue = null;
            if (
                rowIdx >= 0 && rowIdx < riskMatrix.length &&
                colIdx >= 0 && colIdx < riskMatrix[0].length
            ) {
                matrixValue = riskMatrix[rowIdx][colIdx];
            }

            setSelectedMaxRiskRank(matrixValue);

            const numericPart = matrixValue ? parseInt(matrixValue.split(' ')[0]) : null;

            if (numericPart >= 1 && numericPart <= 5) {
                setClassNameRiskRank('ibra-popup-page-input-green');
            }
            else if (numericPart >= 6 && numericPart <= 12) {
                setClassNameRiskRank('ibra-popup-page-input-yellow');
            }
            else if (numericPart >= 13 && numericPart <= 20) {
                setClassNameRiskRank('ibra-popup-page-input-orange');
            }
            else if (numericPart >= 21) {
                setClassNameRiskRank('ibra-popup-page-input-red');
            }

            if (maxRiskRank >= 3) {
                setPriorityEvent('Yes');
            }
            else if (maxRiskRank < 3 && maxRiskRank > 0) {
                setPriorityEvent('No');
            }
        }
    }, [selectedLikelihood, riskRankRows]);


    // Update available sub areas when main area changes
    useEffect(() => {
        if (selectedMainArea) {
            setAvailableSubAreas(subAreas[selectedMainArea] || []);

            // Only clear selectedSubArea if the previously selected value is no longer available in the new subAreas list
            if (!subAreas[selectedMainArea].includes(selectedSubArea)) {
                setSelectedSubArea(''); // Clear sub-area only if the selected value is invalid
            }
        } else {
            setAvailableSubAreas([]);
        }
    }, [selectedMainArea, subAreas]);

    // Functions to handle hazard rows
    const handleHazardChange = (id, value) => {
        const updatedRows = hazardRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setHazardRows(updatedRows);
    };

    const addHazardRow = () => {
        const newId = hazardRows.length > 0 ? Math.max(...hazardRows.map(row => row.id)) + 1 : 1;
        setHazardRows([...hazardRows, { id: newId, value: '' }]);
    };

    const removeHazardRow = (id) => {
        if (hazardRows.length > 1) {
            setHazardRows(hazardRows.filter(row => row.id !== id));
        } else {
            toast.warn("You must have at least one hazard", {
                closeButton: false,
                autoClose: 800,
            });
        }
    };

    const handleControlChange = (id, value) => {
        const updatedRows = controlRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setControlRows(updatedRows);
    };

    const addControlRow = () => {
        const newId = controlRows.length > 0 ? Math.max(...controlRows.map(row => row.id)) + 1 : 1;
        setControlRows([...controlRows, { id: newId, value: '' }]);
    };

    const removeControlRow = (id) => {
        if (controlRows.length > 1) {
            setControlRows(controlRows.filter(row => row.id !== id));
        } else {
            toast.warn("You must have at least one control", {
                closeButton: false,
                autoClose: 800,
            });
        }
    };

    const handleRiskRankChange = (id, value) => {
        const updatedRows = riskRankRows.map(row =>
            row.id === id ? { ...row, value } : row
        );
        setRiskRankRows(updatedRows);
    };

    const isFormValid = () => {
        const newErrors = {
            author: !selectedMainArea,
            departmentHead: !selectedSubArea || !selectedOwner || !selectedLikelihood,
            reviewer: !selectedMaxRiskRank,
            hazards: hazardRows.some(row => !row.value),
            controls: controlRows.some(row => !row.value),
            riskSource: !riskSource
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleFileUpload = () => {
        setLoading(true);

        // Mock upload functionality
        setTimeout(() => {
            setLoading(false);
            toast.success("Document uploaded successfully!", {
                closeButton: false,
                autoClose: 1500,
            });

            // Reset form or close popup after successful upload
            setTimeout(() => {
                onClose();
            }, 1500);
        }, 2000);
    };

    const handleSubmit = async (e) => {
        const updatedData = {
            main: selectedMainArea,
            sub: selectedSubArea,
            owner: selectedOwner,
            odds: selectedLikelihood,
            riskRank: selectedMaxRiskRank,
            majorRisk,
            UE: selectedUE,
            priority: priorityEvent,
            maxConsequence: maxConsequence,
            additional: additionalComments,
            possible: possibleImprovements,
            source: riskSource,
            hazards: hazardRows.map(row => row.value),  // Collecting all hazard row values
            controls: controlRows.map(row => row.value), // Collecting all control row values
            ...riskRankRows.reduce((acc, row) => {
                acc[row.label.replace('&', '')] = row.value;  // Adding risk rank values dynamically
                return acc;
            }, {}),
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
                        <h2>Unwanted Event Evaluation</h2>
                        <button
                            className="ibra-popup-page-close-button"
                            onClick={onClose}
                            title="Close Popup"
                        >
                            ×
                        </button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-scroll-box">
                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row">
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                                <label>Main Area <span className="ibra-popup-page-required">*</span></label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        className="ibra-popup-page-select"
                                                        value={selectedMainArea}
                                                        onChange={(e) => setSelectedMainArea(e.target.value)}
                                                    >
                                                        <option value="">Select Main Area</option>
                                                        {mainAreas.map((area, index) => (
                                                            <option key={index} value={area}>
                                                                {area}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                                <label>Sub Area <span className="ibra-popup-page-required">*</span></label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        className="ibra-popup-page-select"
                                                        value={selectedSubArea}
                                                        onChange={(e) => setSelectedSubArea(e.target.value)}
                                                        disabled={!selectedMainArea}
                                                    >
                                                        <option value="">Select Sub Area</option>
                                                        {availableSubAreas.map((area, index) => (
                                                            <option key={index} value={area}>
                                                                {area}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row">
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                                <label><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpFO} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Functional Ownership <span className="ibra-popup-page-required">*</span></label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        className="ibra-popup-page-select"
                                                        value={selectedOwner}
                                                        onChange={(e) => setSelectedOwner(e.target.value)}
                                                    >
                                                        <option value="">Select Functional Owner</option>
                                                        {functionalOwners.map((owner, index) => (
                                                            <option key={index} value={owner}>
                                                                {owner}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper">
                                            <div className={`ibra-popup-page-form-group ${errors.riskSource ? "error-upload-required-up" : ""}`}>
                                                <label><FontAwesomeIcon icon={faInfoCircle} onClick={openHelpRS} style={{ cursor: 'pointer' }} className="ibra-popup-label-icon" />Risk Source <span className="ibra-popup-page-required">*</span></label>
                                                <div className="ibra-popup-page-select-container">
                                                    <select
                                                        value={riskSource}
                                                        className="ibra-popup-page-select"
                                                        onChange={(e) => setRiskSource(e.target.value)}
                                                    >
                                                        <option value="">Select Risk Source</option>
                                                        {riskSources.sort((a, b) => a.localeCompare(b)).map((type, index) => (
                                                            <option key={index} value={type}>
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-form-row-2">
                                    <div className="ibra-popup-page-additional-row">
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className={`ibra-popup-page-form-group ${errors.hazards ? "error-upload-required-up" : ""}`}>
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" onClick={openHelpHaz} style={{ cursor: 'pointer' }} />Hazard <span className="ibra-popup-page-required">*</span></label>
                                                    <div className="ibra-popup-hazard-table-container">
                                                        <table className="ibra-popup-page-table">
                                                            <tbody>
                                                                {hazardRows.map(row => (
                                                                    <tr key={row.id}>
                                                                        <td>
                                                                            <div className="ibra-popup-page-row-actions">
                                                                                <input
                                                                                    type="text"
                                                                                    value={row.value}
                                                                                    className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                                    onChange={(e) => handleHazardChange(row.id, e.target.value)}
                                                                                    placeholder="Enter hazard type"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="ibra-popup-page-action-button"
                                                                                    onClick={() => removeHazardRow(row.id)}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="ibra-popup-page-add-row-button"
                                                        onClick={addHazardRow}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> Add Hazard
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper-circle">
                                                <div className="ibra-popup-hazard-circle-container">
                                                    <div className="ibra-popup-hazard-circle">
                                                        {/* 1) The heading */}
                                                        <h3 className="ibra-popup-hazard-title">Unwanted Event</h3>

                                                        {/* 2) The dropdown immediately after */}
                                                        <select
                                                            className="ibra-popup-dropdown"
                                                            value={selectedUE}
                                                            onChange={e => setSelectedUE(e.target.value)}
                                                        >
                                                            <option value="">Select Unwanted Event</option>
                                                            <option value="Spill">Spill</option>
                                                            <option value="Leak">Leak</option>
                                                            <option value="Overload">Overload</option>
                                                            <option value="test">PH 1</option>
                                                            <option value="testw">PH 2</option>
                                                            <option value="teste">PH 3</option>
                                                            {/* …your real list here… */}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group ${errors.controls ? "error-upload-required-up" : ""}`}>
                                            <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Current Controls <span className="ibra-popup-page-required">*</span></label>
                                            <table className="ibra-popup-page-table">
                                                <tbody>
                                                    {controlRows.map(row => (
                                                        <tr key={row.id}>
                                                            <td>
                                                                <div className="ibra-popup-page-row-actions">
                                                                    <input
                                                                        type="text"
                                                                        value={row.value}
                                                                        className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                                                        onChange={(e) => handleControlChange(row.id, e.target.value)}
                                                                        placeholder="Enter control measure"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="ibra-popup-page-action-button"
                                                                        onClick={() => removeControlRow(row.id)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button
                                                type="button"
                                                className="ibra-popup-page-add-row-button"
                                                onClick={addControlRow}
                                            >
                                                <FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> Add Control
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-component-wrapper">
                                    <div className={`ibra-popup-page-form-group ${errors.departmentHead ? "error-upload-required-up" : ""}`}>
                                        <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Likelihood of the Event <span className="ibra-popup-page-required">*</span></label>
                                        <div className="ibra-popup-page-select-container">
                                            <select
                                                className="ibra-popup-page-select"
                                                value={selectedLikelihood}
                                                onChange={(e) => setSelectedLikelihood(e.target.value)}
                                            >
                                                <option value="">Select Likelihood</option>
                                                {likelihoodOptions.map((option, index) => (
                                                    <option key={index} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="ibra-popup-page-form-row-2">
                                    <div className="ibra-popup-page-additional-row">
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className={`ibra-popup-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Consequence Rating <span className="ibra-popup-page-required">*</span></label>
                                                    <table className="ibra-popup-page-consequence-table">
                                                        <tbody>
                                                            {riskRankRows.map(row => (
                                                                <tr key={row.id}>
                                                                    <td className="ibra-popup-page-label-cell">
                                                                        <div className="ibra-popup-page-label-box">
                                                                            {row.label}
                                                                        </div>
                                                                    </td>
                                                                    <td className="ibra-popup-page-select-cell">
                                                                        <select
                                                                            value={row.value}
                                                                            className="ibra-popup-page-select-c"
                                                                            onChange={(e) => handleRiskRankChange(row.id, e.target.value)}
                                                                        >
                                                                            {riskRankOptions.map((option, index) => (
                                                                                <option key={index} value={option}>
                                                                                    {option}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ibra-popup-page-column-half">
                                            <div className="ibra-popup-page-component-wrapper-special">
                                                <div className="ibra-popup-page-form-group">
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Max Reasonable Consequence <span className="ibra-popup-page-required">*</span></label>
                                                    <textarea
                                                        className="ibra-popup-page-textarea-2"
                                                        value={maxConsequence}
                                                        onChange={(e) => setMaxConsequence(e.target.value)}
                                                        placeholder="Enter max reasonable consequence details"
                                                    ></textarea>
                                                </div>
                                            </div>
                                            <div className="ibra-popup-page-additional-row-2">
                                                <div className="ibra-popup-page-column-half">
                                                    <div className="ibra-popup-page-component-wrapper">
                                                        <div className="ibra-popup-page-form-group">
                                                            <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Major Risk <span className="ibra-popup-page-required">*</span></label>
                                                            <div className="ibra-popup-page-select-container">
                                                                <select
                                                                    className="ibra-popup-page-select"
                                                                    value={majorRisk}
                                                                    onChange={(e) => setMajorRisk(e.target.value)}
                                                                >
                                                                    <option value="">Select Option</option>
                                                                    <option value="Yes">Yes</option>
                                                                    <option value="No">No</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ibra-popup-page-column-half">
                                                    <div className="ibra-popup-page-component-wrapper">
                                                        <div className={`ibra-popup-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                                            <label>  <FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Max Risk Rank <span className="ibra-popup-page-required">*</span></label>
                                                            <input
                                                                className={`ibra-popup-page-input ${classNameRiskRank}`}
                                                                value={selectedMaxRiskRank}
                                                                type='text'
                                                                readOnly
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className="ibra-popup-page-form-group">
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Priority Unwanted Event <span className="ibra-popup-page-required">*</span></label>
                                                    <input
                                                        className={`ibra-popup-page-input`}
                                                        value={priorityEvent}
                                                        type='text'
                                                        readOnly
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-form-group-main-container-2">
                                <div className="ibra-popup-page-additional-row">
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-additional-row">
                                            <div className="ibra-popup-page-component-wrapper-special2" style={{ width: '100%' }}>
                                                <div className="ibra-popup-page-form-group">
                                                    <label>Additional Comments</label>
                                                    <textarea
                                                        className="ibra-popup-page-textarea-full"
                                                        value={additionalComments}
                                                        onChange={(e) => setAdditionalComments(e.target.value)}
                                                        placeholder="Enter any additional comments or notes"
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ibra-popup-page-column-half">
                                        <div className="ibra-popup-page-component-wrapper-special2">
                                            <div className="ibra-popup-page-form-group">
                                                <label>Possible Improvements <span className="ibra-popup-page-required">*</span></label>
                                                <textarea
                                                    className="ibra-popup-page-textarea"
                                                    value={possibleImprovements}
                                                    onChange={(e) => setPossibleImprovements(e.target.value)}
                                                    placeholder="Enter possible improvements"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Second additional row with two textareas */}



                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                                disabled={!valid()}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {helpFO && (<FunctionalOwnership setClose={closeHelpFO} />)}
            {helpRS && (<RiskSource setClose={closeHelpRS} />)}
            {helpHaz && (<Hazard setClose={closeHelpHaz} />)}
            <ToastContainer />
        </div>
    );
};

export default IBRAPopup;