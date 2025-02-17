import React, { useState, useEffect } from "react";
import "./EquipmentTable.css"; // Add styling here
import EquipmentPopup from "../ValueChanges/EquipmentPopup";
import ManageEquipment from "../ValueChanges/ManageEquipment";

const EquipmentTable = ({ formData, setFormData, usedEquipment, setUsedEquipment, role }) => {
    // State to control the popup and selected abbreviations
    const [eqpData, setEqpData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(new Set(usedEquipment));
    const [isNA, setIsNA] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);

    const handlePopupToggle = () => {
        setPopupVisible(!popupVisible);
    };

    useEffect(() => {
        setSelectedEquipment(new Set(usedEquipment));
        if (usedEquipment.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedEquipment]);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/eqp`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setEqpData(data.eqps);
        } catch (error) {
            console.error("Error fetching equipment:", error)
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

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
        const selectedEqpArray = [...selectedEquipment];
        setUsedEquipment(selectedEqpArray);

        const selectedRows = selectedEqpArray.map((eqp) => {
            const found = eqpData.find((item) => item.eqp === eqp);
            return found || { eqp }; // Fallback if not found
        });

        setFormData({
            ...formData,
            Equipment: selectedRows,
        });
        setPopupVisible(false);
    };

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

    return (
        <div className="eqp-input-box">
            <div className="eqp-header">
                <h3 className="font-fam-labels">Equipment</h3>
                <input
                    type="checkbox"
                    className="na-checkbox-eqp"
                    checked={isNA}
                    onChange={handleNAToggle}
                />
            </div>
            {role === "admin" && (
                <button className="top-right-button-eqp" onClick={openManagePopup}>Update Equipment</button>
            )}
            {role === "admin" && (
                <button className="top-right-button-eqp-2" onClick={() => setShowNewPopup(true)}>Add Equipment</button>
            )}
            <EquipmentPopup
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); fetchValues(); }}
            />

            {isManageOpen && <ManageEquipment closePopup={closeManagePopup} onClose={fetchValues} />}
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
                                    {eqpData.length > 0 ? (
                                        eqpData
                                            .sort((a, b) => a.eqp.localeCompare(b.eqp))
                                            .map((item) => (
                                                <tr key={item.eqp}
                                                    onClick={() => handleCheckboxChange(item.eqp)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-inp-eqp"
                                                            checked={selectedEquipment.has(item.eqp)}
                                                            onChange={() => handleCheckboxChange(item.eqp)}
                                                        />
                                                    </td>
                                                    <td>{item.eqp}</td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">Loading abbreviations...</td>
                                        </tr>
                                    )}
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
            {selectedEquipment.size > 0 && (
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
            )}

            <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                Select Equipment
            </button>
        </div>
    );
};

export default EquipmentTable;
