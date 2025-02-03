import React, { useState } from "react";
import "./MobileMachineTable.css"; // Add styling here

const MobileMachineTable = ({ formData, setFormData, usedMobileMachine, setUsedMobileMachine }) => {
    const MobileMachine = [
        "Forklift",
        "Excavator",
        "Bulldozer",
        "Backhoe Loader",
        "Crane",
        "Skid Steer Loader",
        "Road Roller",
        "Dump Truck",
        "Concrete Mixer Truck",
        "Trencher"
    ];

    // State to control the popup and selected abbreviations
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMMachine, setSelectedMMachine] = useState(new Set(usedMobileMachine));
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
            setSelectedMMachine(new Set());
            setUsedMobileMachine([]);
            setFormData({ ...formData, MobileMachine: [] });
        }
    };

    const handleCheckboxChange = (mac) => {
        const newSelectedMobileM = new Set(selectedMMachine);
        if (newSelectedMobileM.has(mac)) {
            newSelectedMobileM.delete(mac);
        } else {
            newSelectedMobileM.add(mac);
        }
        setSelectedMMachine(newSelectedMobileM);
    };

    const handleSaveSelection = () => {
        setUsedMobileMachine([...selectedMMachine]);
        setFormData({
            ...formData,
            MobileMachine: [...selectedMMachine].map((mac) => ({
                mac
            })),
        });
        setPopupVisible(false);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Mobile Machine</h3>
            <div className="na-checkbox-container-mac">
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
                <div className="popup-overlay-mac">
                    <div className="popup-content-terms">
                        <h4 className="center-mac">Select Mobile Machines</h4>
                        <div className="popup-table-wrapper-mac">
                            <table className="popup-table font-fam">
                                <thead className="mac-headers">
                                    <tr>
                                        <th className="inp-size-mac">Select</th>
                                        <th>Mobile Machine</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MobileMachine.sort().map((mac, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-inp-mac"
                                                    checked={selectedMMachine.has(mac)}
                                                    onChange={() => handleCheckboxChange(mac)}
                                                />
                                            </td>
                                            <td>{mac}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="save-selection-button-mac" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-mac" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-mac-mac">Mobile Machine</th>
                        <th className="col-mac-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.MobileMachine?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.mac}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            MobileMachine: formData.MobileMachine.filter((_, i) => i !== index),
                                        });
                                        setUsedMobileMachine(
                                            usedMobileMachine.filter((mac) => mac !== row.mac)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedMachines = new Set(selectedMMachine);
                                        newSelectedMachines.delete(row.mac);
                                        setSelectedMMachine(newSelectedMachines);
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

export default MobileMachineTable;
