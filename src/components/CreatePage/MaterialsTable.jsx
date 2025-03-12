import React, { useState, useEffect } from "react";
import "./MaterialsTable.css"; // Add styling here
import MaterialPopup from "../ValueChanges/MaterialPopup";
import ManageMaterial from "../ValueChanges/ManageMaterial";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const MaterialsTable = ({ formData, setFormData, usedMaterials, setUsedMaterials, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [matsData, setMatsData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set(usedMaterials));
    const [isNA, setIsNA] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/mat`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setMatsData(data.mats);
        } catch (error) {
            console.error("Error fetching equipment:", error)
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    useEffect(() => {
        setSelectedMaterials(new Set(usedMaterials));
        if (usedMaterials.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedMaterials]);

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
        const selectedMatArray = [...selectedMaterials];
        setUsedMaterials(selectedMatArray);

        const selectedRows = selectedMatArray.map((mat) => {
            const found = matsData.find((item) => item.mat === mat);
            return found || { mat }; // Fallback if not found
        });

        setFormData({
            ...formData,
            Materials: selectedRows
        });
        setPopupVisible(false);
    };

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

    return (
        <div className="mat-input-box">
            <div className="materials-header">
                <input
                    type="checkbox"
                    className="na-checkbox-mat"
                    checked={isNA}
                    onChange={handleNAToggle}
                />
                <h3 className="font-fam-labels">Materials</h3>
            </div>
            {role === "admin" && (
                <button className="top-right-button-mat-2" onClick={openManagePopup}>Update Materials</button>
            )}
            <button className="top-right-button-mat" onClick={() => setShowNewPopup(true)}>Add Materials</button>
            <MaterialPopup
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); fetchValues(); }}
                role={role}
                userID={userID}
            />

            {isManageOpen && <ManageMaterial closePopup={closeManagePopup} onClose={fetchValues} />}
            {/* Popup */}
            {popupVisible && (
                <div className="popup-overlay-mat">
                    <div className="popup-content-terms">
                        <h4 className="center-mat">Select Materials</h4>
                        <input
                            type="text"
                            className="search-bar-mat"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="popup-table-wrapper-mat">
                            <table className="popup-table font-fam">
                                <thead className="mat-headers">
                                    <tr>
                                        <th className="inp-size-mat">Select</th>
                                        <th>Material</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matsData.length > 0 ? (
                                        matsData
                                            .filter((item) =>
                                                item.mat.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .sort((a, b) => a.mat.localeCompare(b.mat))
                                            .map((item) => (
                                                <tr key={item.mat}
                                                    onClick={() => handleCheckboxChange(item.mat)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-inp-mat"
                                                            checked={selectedMaterials.has(item.mat)}
                                                            onChange={() => handleCheckboxChange(item.mat)}
                                                        />
                                                    </td>
                                                    <td>{item.mat}</td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">Loading materials...</td>
                                        </tr>
                                    )}
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
            {selectedMaterials.size > 0 && (
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
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                Select Materials
            </button>
        </div>
    );
};

export default MaterialsTable;
