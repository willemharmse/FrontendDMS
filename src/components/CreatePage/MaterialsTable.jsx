import React, { useState, useEffect } from "react";
import "./MaterialsTable.css"; // Add styling here
import MaterialPopup from "../ValueChanges/MaterialPopup";
import ManageMaterial from "../ValueChanges/ManageMaterial";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

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
            localStorage.setItem('cachedMatOptions', JSON.stringify(data.mats));
        } catch (error) {
            console.log(error);
            const cached = localStorage.getItem('cachedMatOptions');
            if (cached) {
                setMatsData(JSON.parse(cached));
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const handleNewMat = (newMat) => {
        const code = newMat.mat;
        // add to the “used” codes array
        setUsedMaterials((prev) => [...prev, code]);
        setSelectedMaterials((prev) => new Set(prev).add(code));
        setFormData((prev) => ({
            ...prev,
            Materials: [...prev.Materials, newMat],
        }));
    };

    const handleMatUpdate = (updatedMat, oldMat) => {
        // 1) Swap out the code in usedAbbrCodes
        setUsedMaterials(prev =>
            prev.map(code => (code === oldMat ? updatedMat.mat : code))
        );

        // 2) Update the selectedAbbrs Set
        setSelectedMaterials(prev => {
            const next = new Set(prev);
            if (next.has(oldMat)) {
                next.delete(oldMat);
                next.add(updatedMat.mat);
            }
            return next;
        });

        // 3) Remap the rows in formData.abbrRows
        setFormData(prev => ({
            ...prev,
            Materials: prev.Materials.map(row =>
                row.mat === oldMat
                    ? { mat: updatedMat.mat + " *" }
                    : row
            ),
        }));
    };

    useEffect(() => {
        setSelectedMaterials(new Set(usedMaterials));
        if (usedMaterials.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedMaterials]);

    const handlePopupToggle = () => {
        setSearchTerm("")
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
        <div className="input-row">
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
                    <button className="top-right-button-mat-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit Materials" /></button>
                )}
                <button className="top-right-button-mat" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest Material" /></button>
                <MaterialPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); }}
                    role={role}
                    userID={userID}
                    setMatsData={setMatsData}
                    onAdd={handleNewMat}
                />

                {isManageOpen && <ManageMaterial closePopup={closeManagePopup} onClose={fetchValues} onUpdate={handleMatUpdate}
                    userID={userID}
                    setMatData={setMatsData}
                    onAdd={handleNewMat} />}
                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-mat">
                        <div className="popup-content-mat">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select Materials</h2>
                                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
                            </div>

                            <div className="review-date-group">
                                <div className="mat-input-container">
                                    <input
                                        className="search-input-mat"
                                        type="text"
                                        placeholder="Search Material"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                                    {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                                </div>
                            </div>

                            <div className="mat-table-group">
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
                            </div>
                            <div className="mat-buttons">
                                <button onClick={handleSaveSelection} className="mat-button">Save Selection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedMaterials.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-mat-mat">Material</th>
                                <th className="col-mat-act">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.Materials?.map((row, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: "14px" }}>{row.mat}</td>
                                    <td className="procCent">
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
                                            <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {(selectedMaterials.size === 0 && isNA) && (
                    <button className="add-row-button-mat" onClick={handlePopupToggle} disabled={!isNA}>
                        Select
                    </button>
                )}

                {selectedMaterials.size > 0 && (
                    <button className="add-row-button-mat-plus" onClick={handlePopupToggle}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MaterialsTable;
