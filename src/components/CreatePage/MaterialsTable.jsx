import React, { useState, useEffect } from "react";
import "./MaterialsTable.css"; // Add styling here
import MaterialPopup from "../ValueChanges/MaterialPopup";
import ManageMaterial from "../ValueChanges/ManageMaterial";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedMaterial from "../ValueChanges/ModifySuggestedMaterial";

const MaterialsTable = ({ formData, setFormData, usedMaterials, setUsedMaterials, userID }) => {
    // State to control the popup and selected abbreviations
    const [matsData, setMatsData] = useState([]);
    const [originalData, setOriginalData] = useState([])
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set(usedMaterials));
    const [isNA, setIsNA] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [matUpdate, setMatUpdate] = useState("");
    const [updatePopup, setUpdatePopup] = useState(false);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/mat`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setMatsData(data.mats);
            setOriginalData(data.mats);
            localStorage.setItem('cachedMatOptions', JSON.stringify(data.mats));
        } catch (error) {
            console.log(error);
            const cached = localStorage.getItem('cachedMatOptions');
            if (cached) {
                setMatsData(JSON.parse(cached));
            }
        }
    };


    const handleUpdateMat = (newMatObj, oldMat) => {
        const updatedCode = newMatObj.mat;

        // 1. Remove the old abbreviation from usedAbbrCodes
        setUsedMaterials(prev =>
            prev.filter(code => code !== oldMat)
        );

        // 2. Remove from selectedAbbrs and add the new one
        setSelectedMaterials(prev => {
            const updated = new Set(prev);
            updated.delete(oldMat);
            updated.add(updatedCode);
            return updated;
        });

        // 3. Replace the old row in abbrRows with the updated one
        setFormData(prev => ({
            ...prev,
            Materials: prev.Materials.map(row =>
                row.mat === oldMat
                    ? newMatObj
                    : row
            ),
        }));

        // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
        setUsedMaterials(prev => [...prev, updatedCode]);
    };

    const openUpdate = (mat) => {
        setMatUpdate(mat);

        setUpdatePopup(true);
    }

    const closeUpdate = () => {
        setMatUpdate("");

        setUpdatePopup(false);
    }

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


    const openManagePopup = (mat) => {
        setMatUpdate(mat);
        setIsManageOpen(true);
    }

    const closeManagePopup = () => {
        setMatUpdate("");
        setIsManageOpen(false);
    }

    const openAddPopup = () => {
        handleSaveSelection();
        setShowNewPopup(true)
    }

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
                <MaterialPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); }}
                    userID={userID}
                    setMatsData={setMatsData}
                    onAdd={handleNewMat}
                />

                {isManageOpen && <ManageMaterial closePopup={closeManagePopup} onClose={fetchValues} onUpdate={handleMatUpdate}
                    userID={userID}
                    setMatData={setMatsData}
                    onAdd={handleNewMat}
                    mat={matUpdate} />}
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
                                                            <td style={{ whiteSpace: "pre-wrap" }}>{item.mat}</td>
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
                            <div className="abbr-buttons-dual">
                                <button onClick={handleSaveSelection} className="abbr-button-1">Save Selection</button>

                                <button onClick={openAddPopup} className="abbr-button-2">Suggest New</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedMaterials.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-mat-mat" style={{ textAlign: "center" }}>Material</th>
                                <th className="col-mat-act" style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.Materials?.map((row, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.mat}</td>
                                    <td className="procCent">
                                        <div className="term-action-buttons">
                                            <button
                                                className="remove-row-button"
                                                style={{ paddingRight: "6px" }}
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
                                            <button
                                                className="edit-terms-row-button"
                                                style={{ paddingLeft: "6px" }}
                                                onClick={() => {
                                                    if (originalData.some(item => item.mat === row.mat)) { openManagePopup(row.mat) }
                                                    else {
                                                        openUpdate(row.mat);
                                                    }
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} title="Modify Material" />
                                            </button>
                                        </div>
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

            {updatePopup && (<ModifySuggestedMaterial mat={matUpdate} closePopup={closeUpdate} onAdd={handleUpdateMat} setMatData={setMatsData} />)}
        </div>
    );
};

export default MaterialsTable;
