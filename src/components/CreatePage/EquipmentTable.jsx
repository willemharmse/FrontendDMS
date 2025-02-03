import React, { useState } from "react";
import "./EquipmentTable.css"; // Add styling here

const EquipmentTable = ({ formData, setFormData, usedEquipment, setUsedEquipment }) => {
    const Equipment = [
        "Ladder",
        "Drill Machine",
        "Air Compressor",
        "Generator",
        "Welding Machine",
        "Grinding Machine",
        "Jackhammer",
        "Circular Saw",
        "Chainsaw",
        "Pressure Washer"
    ];

    // State to control the popup and selected abbreviations
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(new Set(usedEquipment));
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
            setSelectedEquipment(new Set());
            setUsedEquipment([]);
            setFormData({ ...formData, Equipment: [] });
        }
    };

    const handleCheckboxChange = (eqp) => {
        const newSelectedEquipment = new Set(selectedEquipment);
        if (newSelectedEquipment.has(eqp)) {
            newSelectedEquipment.delete(eqp);
        } else {
            newSelectedEquipment.add(eqp);
        }
        setSelectedEquipment(newSelectedEquipment);
    };

    const handleSaveSelection = () => {
        setUsedEquipment([...selectedEquipment]);
        setFormData({
            ...formData,
            Equipment: [...selectedEquipment].map((eqp) => ({
                eqp
            })),
        });
        setPopupVisible(false);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Equipment</h3>
            <div className="na-checkbox-container-eqp">
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
                <div className="popup-overlay-eqp">
                    <div className="popup-content-terms">
                        <h4 className="center-eqp">Select Equipment</h4>
                        <div className="popup-table-wrapper-eqp">
                            <table className="popup-table font-fam">
                                <thead className="eqp-headers">
                                    <tr>
                                        <th className="inp-size-eqp">Select</th>
                                        <th>Equipment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Equipment.sort().map((eqp, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-inp-eqp"
                                                    checked={selectedEquipment.has(eqp)}
                                                    onChange={() => handleCheckboxChange(eqp)}
                                                />
                                            </td>
                                            <td>{eqp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="save-selection-button-eqp" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-eqp" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-eqp-eqp">Equipment</th>
                        <th className="col-eqp-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.Equipment?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.eqp}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            Equipment: formData.Equipment.filter((_, i) => i !== index),
                                        });
                                        setUsedEquipment(
                                            usedEquipment.filter((eqp) => eqp !== row.eqp)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedEquipment = new Set(selectedEquipment);
                                        newSelectedEquipment.delete(row.eqp);
                                        setSelectedEquipment(newSelectedEquipment);
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
                Select Equipment
            </button>
        </div>
    );
};

export default EquipmentTable;
