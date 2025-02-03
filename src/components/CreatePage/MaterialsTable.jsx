import React, { useState } from "react";
import "./MaterialsTable.css"; // Add styling here

const MaterialsTable = ({ formData, setFormData, usedMaterials, setUsedMaterials }) => {
    const Materials = [
        "Concrete",
        "Steel Rebar",
        "Bricks",
        "Cement",
        "Wood Lumber",
        "Glass Panels",
        "PVC Pipes",
        "Insulation Foam",
        "Gravel",
        "Asphalt"
    ];

    // State to control the popup and selected abbreviations
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set(usedMaterials));
    const [isNA, setIsNA] = useState(false);

    const handlePopupToggle = () => {
        setPopupVisible(!popupVisible);
    };

    // Handle N/A checkbox toggle
    const handleNAToggle = () => {
        const newValue = !isNA;
        setIsNA(newValue);
        if (!newValue) {
            // If unchecked, clear selections and update state accordingly
            setSelectedMaterials(new Set());
            setUsedMaterials([]);
            setFormData({ ...formData, Materials: [] });
        }
    };

    const handleCheckboxChange = (mat) => {
        const newSelectedMaterials = new Set(selectedMaterials);
        if (newSelectedMaterials.has(mat)) {
            newSelectedMaterials.delete(mat);
        } else {
            newSelectedMaterials.add(mat);
        }
        setSelectedMaterials(newSelectedMaterials);
    };

    const handleSaveSelection = () => {
        setUsedMaterials([...selectedMaterials]);
        setFormData({
            ...formData,
            Materials: [...selectedMaterials].map((mat) => ({
                mat
            })),
        });
        setPopupVisible(false);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Materials</h3>
            <div className="na-checkbox-container-mat">
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
                <div className="popup-overlay-mat">
                    <div className="popup-content-terms">
                        <h4 className="center-mat">Select Materials</h4>
                        <div className="popup-table-wrapper-mat">
                            <table className="popup-table font-fam">
                                <thead className="mat-headers">
                                    <tr>
                                        <th className="inp-size-mat">Select</th>
                                        <th>Material</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Materials.sort().map((mat, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-inp-mat"
                                                    checked={selectedMaterials.has(mat)}
                                                    onChange={() => handleCheckboxChange(mat)}
                                                />
                                            </td>
                                            <td>{mat}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="save-selection-button-mat" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-mat" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-mat-mat">Material</th>
                        <th className="col-mat-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.Materials?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.mat}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            Materials: formData.Materials.filter((_, i) => i !== index),
                                        });
                                        setUsedMaterials(
                                            usedMaterials.filter((mat) => mat !== row.mat)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedMaterials = new Set(selectedMaterials);
                                        newSelectedMaterials.delete(row.mat);
                                        setSelectedMaterials(newSelectedMaterials);
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
                Select Materials
            </button>
        </div>
    );
};

export default MaterialsTable;
