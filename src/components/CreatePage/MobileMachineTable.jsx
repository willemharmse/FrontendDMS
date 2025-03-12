import React, { useState, useEffect } from "react";
import "./MobileMachineTable.css"; // Add styling here
import MobileMachinePopup from "../ValueChanges/MobileMachinePopup";
import ManageMobileMachines from "../ValueChanges/ManageMobileMachines";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const MobileMachineTable = ({ formData, setFormData, usedMobileMachine, setUsedMobileMachine, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [macData, setMacData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMMachine, setSelectedMMachine] = useState(new Set(usedMobileMachine));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/mac`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setMacData(data.macs);
        } catch (error) {
            console.error("Error fetching equipment:", error)
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    useEffect(() => {
        setSelectedMMachine(new Set(usedMobileMachine));
        if (usedMobileMachine.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedMobileMachine]);

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
        const selectedMacArray = [...selectedMMachine];
        setUsedMobileMachine(selectedMacArray);

        const selectedRows = selectedMacArray.map((mac) => {
            const found = macData.find((item) => item.mac === mac);
            return found || { mac }; // Fallback if not found
        });

        setFormData({
            ...formData,
            MobileMachine: selectedRows
        });
        setPopupVisible(false);
    };

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

    return (
        <div className="mac-input-box">
            <div className="mac-header">
                <input
                    type="checkbox"
                    className="na-checkbox-mac"
                    checked={isNA}
                    onChange={handleNAToggle}
                />
                <h3 className="font-fam-labels">Mobile Machine</h3>
            </div>
            {role === "admin" && (
                <button className="top-right-button-mac-2" onClick={openManagePopup}>Update Machines</button>
            )}
            <button className="top-right-button-mac" onClick={() => setShowNewPopup(true)}>Add Machines</button>
            <MobileMachinePopup
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); fetchValues(); }}
                role={role}
                userID={userID}
            />

            {isManageOpen && <ManageMobileMachines closePopup={closeManagePopup} onClose={fetchValues} />}

            {/* Popup */}
            {popupVisible && (
                <div className="popup-overlay-mac">
                    <div className="popup-content-terms">
                        <h4 className="center-mac">Select Mobile Machines</h4>
                        <input
                            type="text"
                            className="search-bar-mac"
                            placeholder="Search mobile machines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="popup-table-wrapper-mac">
                            <table className="popup-table font-fam">
                                <thead className="mac-headers">
                                    <tr>
                                        <th className="inp-size-mac">Select</th>
                                        <th>Mobile Machine</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {macData.length > 0 ? (
                                        macData
                                            .filter((item) =>
                                                item.machine.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .sort((a, b) => a.machine.localeCompare(b.machine))
                                            .map((item) => (
                                                <tr key={item.machine}
                                                    onClick={() => handleCheckboxChange(item.machine)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-inp-mac"
                                                            checked={selectedMMachine.has(item.machine)}
                                                            onChange={() => handleCheckboxChange(item.machine)}
                                                        />
                                                    </td>
                                                    <td>{item.machine}</td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">Loading machines...</td>
                                        </tr>
                                    )}
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
            {selectedMMachine.size > 0 && (
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
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                Select Mobile Machines
            </button>
        </div>
    );
};

export default MobileMachineTable;
