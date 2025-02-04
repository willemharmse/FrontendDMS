import React, { useState } from "react";
import "./PPETable.css"; // Add styling here

const PPETable = ({ formData, setFormData, usedPPEOptions, setUsedPPEOptions }) => {
    const PPEOptions = [
        "Hard Hat",
        "Safety Glasses",
        "Earplugs",
        "N95 Mask",
        "Cut-Resistant Gloves",
        "High-Visibility Vest",
        "Steel-Toe Boots",
        "Safety Harness",
        "Flame-Resistant Coveralls",
        "Face Shield"
    ];

    // State to control the popup and selected abbreviations
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedPPE, setSelectedPPE] = useState(new Set(usedPPEOptions));
    const [isNA, setIsNA] = useState(false);

    const handlePopupToggle = () => {
        setPopupVisible(!popupVisible);
    };

    // Handle N/A checkbox toggle
    const handleNAToggle = () => {
        const newValue = !isNA;
        setIsNA(newValue);
        if (!newValue) {
            console.log("Clearing selections");
            // If unchecked, clear selections and update state accordingly
            setSelectedPPE(new Set());
            setUsedPPEOptions([]);
            setFormData({ ...formData, PPEItems: [] });
        }
    };

    const handleCheckboxChange = (PPE) => {
        const newSelectedPPE = new Set(selectedPPE);
        if (newSelectedPPE.has(PPE)) {
            newSelectedPPE.delete(PPE);
        } else {
            newSelectedPPE.add(PPE);
        }
        setSelectedPPE(newSelectedPPE);
    };

    const handleSaveSelection = () => {
        setUsedPPEOptions([...selectedPPE]);
        setFormData({
            ...formData,
            PPEItems: [...selectedPPE].map((PPE) => ({
                PPE
            })),
        });
        setPopupVisible(false);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">PPE</h3>
            <div className="na-checkbox-container-ppe">
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
                        <h4 className="center-ppe">Select PPE Options</h4>
                        <div className="popup-table-wrapper-ppe">
                            <table className="popup-table font-fam">
                                <thead className="ppe-headers">
                                    <tr>
                                        <th className="inp-size-ppe">Select</th>
                                        <th>PPE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PPEOptions.sort().map((PPE, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-inp-ppe"
                                                    checked={selectedPPE.has(PPE)}
                                                    onChange={() => handleCheckboxChange(PPE)}
                                                />
                                            </td>
                                            <td>{PPE}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="save-selection-button-ppe" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-ppe" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-ppe-ppe">PPE</th>
                        <th className="col-ppe-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.PPEItems?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.PPE}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            PPEItems: formData.PPEItems.filter((_, i) => i !== index),
                                        });
                                        setUsedPPEOptions(
                                            usedPPEOptions.filter((PPE) => PPE !== row.PPE)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedPPE = new Set(selectedPPE);
                                        newSelectedPPE.delete(row.PPE);
                                        setSelectedPPE(newSelectedPPE);
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
                Select PPE
            </button>
        </div>
    );
};

export default PPETable;
