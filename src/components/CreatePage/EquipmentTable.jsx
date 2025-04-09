import React, { useState, useEffect } from "react";
import "./EquipmentTable.css"; // Add styling here
import EquipmentPopup from "../ValueChanges/EquipmentPopup";
import ManageEquipment from "../ValueChanges/ManageEquipment";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const EquipmentTable = ({ formData, setFormData, usedEquipment, setUsedEquipment, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [eqpData, setEqpData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(new Set(usedEquipment));
    const [isNA, setIsNA] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

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

    const clearSearch = () => {
        setSearchTerm("");
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
        <div className="input-row">
            <div className="eqp-input-box">
                <div className="eqp-header">
                    <input
                        type="checkbox"
                        className="na-checkbox-eqp"
                        checked={isNA}
                        onChange={handleNAToggle}
                    />
                    <h3 className="font-fam-labels">Equipment</h3>
                </div>
                {role === "admin" && (
                    <button className="top-right-button-eqp-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" /></button>
                )}
                <button className="top-right-button-eqp" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" /></button>

                <EquipmentPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); if (role === "admin") fetchValues(); }}
                    role={role}
                    userID={userID}
                    setEqpData={setEqpData}
                />

                {isManageOpen && <ManageEquipment closePopup={closeManagePopup} onClose={fetchValues} />}
                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-eqp">
                        <div className="popup-content-eqp">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select Equipment</h2>
                                <button className="review-date-close" onClick={handlePopupToggle}>×</button>
                            </div>

                            <div className="review-date-group">
                                <div className="eqp-input-container">
                                    <input
                                        className="search-input-eqp"
                                        type="text"
                                        placeholder="Search Equipment"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                                    {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                                </div>
                            </div>

                            <div className="eqp-table-group">
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
                                                    .filter((item) =>
                                                        item.eqp.toLowerCase().includes(searchTerm.toLowerCase())
                                                    )
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
                            </div>
                            <div className="eqp-buttons">
                                <button onClick={handleSaveSelection} className="eqp-button">Save Selection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedEquipment.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-eqp-eqp">Equipment</th>
                                <th className="col-eqp-act">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.Equipment?.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.eqp}</td>
                                    <td className="procCent">
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
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                    Select
                </button>
            </div>
        </div>
    );
};

export default EquipmentTable;
