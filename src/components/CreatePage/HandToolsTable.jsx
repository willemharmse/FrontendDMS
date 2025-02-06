import React, { useState, useEffect } from "react";
import "./HandToolsTable.css"; // Add styling here

const HandToolTable = ({ formData, setFormData, usedHandTools, setUsedHandTools }) => {
    const HandTools = [
        "Hammer",
        "Screwdriver",
        "Pliers",
        "Wrench",
        "Tape Measure",
        "Hand Saw",
        "Utility Knife",
        "Chisel",
        "Level",
        "Adjustable Spanner"
    ];

    // State to control the popup and selected abbreviations
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedTools, setSelectedTools] = useState(new Set(usedHandTools));
    const [isNA, setIsNA] = useState(false);

    useEffect(() => {
        setSelectedTools(new Set(usedHandTools));
        if (usedHandTools.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedHandTools]);

    const handlePopupToggle = () => {
        setPopupVisible(!popupVisible);
    };

    // Handle N/A checkbox toggle
    const handleNAToggle = () => {
        const newValue = !isNA;
        setIsNA(newValue);
        if (!newValue) {
            // If unchecked, clear selections and update state accordingly
            setSelectedTools(new Set());
            setUsedHandTools([]);
            setFormData({ ...formData, HandTools: [] });
        }
    };

    const handleCheckboxChange = (tool) => {
        const newSelectedTools = new Set(selectedTools);
        if (newSelectedTools.has(tool)) {
            newSelectedTools.delete(tool);
        } else {
            newSelectedTools.add(tool);
        }
        setSelectedTools(newSelectedTools);
    };

    const handleSaveSelection = () => {
        setUsedHandTools([...selectedTools]);
        setFormData({
            ...formData,
            HandTools: [...selectedTools].map((tool) => ({
                tool
            })),
        });
        setPopupVisible(false);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Hand Tools</h3>
            <div className="na-checkbox-container-tool">
                <label>
                    <input
                        type="checkbox"
                        checked={isNA}
                        onChange={handleNAToggle}
                    />
                    Applicable
                </label>
            </div>
            {/* Popup */}
            {popupVisible && (
                <div className="popup-overlay-ppe">
                    <div className="popup-content-terms">
                        <h4 className="center-tools">Select Hand Tools</h4>
                        <div className="popup-table-wrapper-tools">
                            <table className="popup-table font-fam">
                                <thead className="tool-headers">
                                    <tr>
                                        <th className="inp-size-tool">Select</th>
                                        <th>Tool</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {HandTools.sort().map((tool, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-inp-tool"
                                                    checked={selectedTools.has(tool)}
                                                    onChange={() => handleCheckboxChange(tool)}
                                                />
                                            </td>
                                            <td>{tool}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="save-selection-button-tool" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-tool" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-tool-tool">Tool</th>
                        <th className="col-tool-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.HandTools?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.tool}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            HandTools: formData.HandTools.filter((_, i) => i !== index),
                                        });
                                        setUsedHandTools(
                                            usedHandTools.filter((tool) => tool !== row.tool)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedTools = new Set(selectedTools);
                                        newSelectedTools.delete(row.tool);
                                        setSelectedTools(newSelectedTools);
                                    }}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                Select Hand Tools
            </button>
        </div>
    );
};

export default HandToolTable;
