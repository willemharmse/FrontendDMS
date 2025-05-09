import React, { useState, useEffect } from 'react';
import './IBRAPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [likelihoodOptions] = useState(['Very Likely', 'Likely', 'Possible', 'Unlikely', 'Rare']);
    const [maxRiskRankOptions] = useState(['1-3: Low', '4-6: Medium', '7-9: High']);
    const [riskSources] = useState(['Objects', 'Environment', 'PH1', 'PH2', 'PH3']);

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

    const riskRankOptions = ['-', '1: Minor', '2: Low', '3: Moderate', '4: Major', '5: Severe'];

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
            const riskRankFields = ['S', 'H', 'E', 'C', 'LR', 'M', 'R'];

            const updatedRiskRanks = riskRankRows.map((row) => ({
                ...row,
                value: data[row.label.replace('&', '')] || '-',  // to handle 'L&R' as 'LR'
            }));

            setRiskRankRows(updatedRiskRanks);

            // Update available sub areas immediately if mainArea exists
            if (data.main) {
                setAvailableSubAreas(subAreas[data.main] || []);
            }
        }
    }, [data]);


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
            priority: priorityEvent,
            maxConsequence: maxConsequence,
            additional: additionalComments,
            possible: possibleImprovements,
            source: riskSource,
            hazards: hazardRows.map(row => row.value),  // Collecting all hazard row values
            controls: controlRows.map(row => row.value), // Collecting all control row values
            ...riskRankRows.reduce((acc, row) => {
                acc[row.label] = row.value;  // Adding risk rank values dynamically
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
                                                <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Functional Ownership <span className="ibra-popup-page-required">*</span></label>
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
                                                <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Risk Source <span className="ibra-popup-page-required">*</span></label>
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
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Hazard <span className="ibra-popup-page-required">*</span></label>
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
                                                        Unwanted Event<br /> <br />{data.UE}
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
                                                            <div className="ibra-popup-page-select-container">
                                                                <select
                                                                    className="ibra-popup-page-select"
                                                                    value={selectedMaxRiskRank}
                                                                    onChange={(e) => setSelectedMaxRiskRank(e.target.value)}
                                                                >
                                                                    <option value="">Select Max Risk Rank</option>
                                                                    {maxRiskRankOptions.map((option, index) => (
                                                                        <option key={index} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className="ibra-popup-page-form-group">
                                                    <label><FontAwesomeIcon icon={faInfoCircle} className="ibra-popup-label-icon" />Priority Unwanted Event <span className="ibra-popup-page-required">*</span></label>
                                                    <div className="ibra-popup-page-select-container">
                                                        <select
                                                            className="ibra-popup-page-select"
                                                            value={priorityEvent}
                                                            onChange={(e) => setPriorityEvent(e.target.value)}
                                                        >
                                                            <option value="">Select Option</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </div>
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
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default IBRAPopup;