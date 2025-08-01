import React, { useState, useEffect } from "react";
import "./PPETable.css"; // Add styling here
import PPEPopup from "../ValueChanges/PPEPopup.jsx";
import ManagePPE from "../ValueChanges/ManagePPE.jsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedPPE from "../ValueChanges/ModifySuggestedPPE.jsx";

const PPETable = ({ formData, setFormData, usedPPEOptions, setUsedPPEOptions, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [ppeData, setPPEData] = useState([]);
    const [originalData, setOriginalData] = useState([])
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedPPE, setSelectedPPE] = useState(new Set(usedPPEOptions));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [ppeUpdate, setPPEUpdate] = useState("");
    const [updatePopup, setUpdatePopup] = useState(false);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/ppe`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setPPEData(data.ppe);
            setOriginalData(data.ppe);
            localStorage.setItem('cachedPpeOptions', JSON.stringify(data.ppe));
        } catch (error) {
            console.error("Error fetching equipment:", error);
            const cached = localStorage.getItem('cachedPpeOptions');
            if (cached) {
                setPPEData(JSON.parse(cached));
            }
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const handleNewPpe = (newPPE) => {
        const code = newPPE.ppe;
        // add to the “used” codes array
        setUsedPPEOptions((prev) => [...prev, code]);
        setSelectedPPE((prev) => new Set(prev).add(code));
        setFormData((prev) => ({
            ...prev,
            PPEItems: [...prev.PPEItems, newPPE],
        }));
    };

    const handlePpeUpdate = (updatedPPE, oldPPE) => {
        // 1) Swap out the code in usedAbbrCodes
        setUsedPPEOptions(prev =>
            prev.map(code => (code === oldPPE ? updatedPPE.ppe : code))
        );

        // 2) Update the selectedAbbrs Set
        setSelectedPPE(prev => {
            const next = new Set(prev);
            if (next.has(oldPPE)) {
                next.delete(oldPPE);
                next.add(updatedPPE.ppe);
            }
            return next;
        });

        // 3) Remap the rows in formData.abbrRows
        setFormData(prev => ({
            ...prev,
            PPEItems: prev.PPEItems.map(row =>
                row.ppe === oldPPE
                    ? { ppe: updatedPPE.ppe + " *" }
                    : row
            ),
        }));
    };

    const handleUpdatePPE = (newPPEObj, oldPPE) => {
        const updatedCode = newPPEObj.ppe;

        // 1. Remove the old abbreviation from usedAbbrCodes
        setUsedPPEOptions(prev =>
            prev.filter(code => code !== oldPPE)
        );

        // 2. Remove from selectedAbbrs and add the new one
        setSelectedPPE(prev => {
            const updated = new Set(prev);
            updated.delete(oldPPE);
            updated.add(updatedCode);
            return updated;
        });

        // 3. Replace the old row in abbrRows with the updated one
        setFormData(prev => ({
            ...prev,
            PPEItems: prev.PPEItems.map(row =>
                row.ppe === oldPPE
                    ? newPPEObj
                    : row
            ),
        }));

        // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
        setUsedPPEOptions(prev => [...prev, updatedCode]);
    };

    const openUpdate = (ppe) => {
        setPPEUpdate(ppe);

        setUpdatePopup(true);
    }

    const closeUpdate = () => {
        setPPEUpdate("");

        setUpdatePopup(false);
    }

    useEffect(() => {
        setSelectedPPE(new Set(usedPPEOptions));
        if (usedPPEOptions.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedPPEOptions]);

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
        const selectedPPEArray = [...selectedPPE];
        setUsedPPEOptions(selectedPPEArray);

        const selectedRows = selectedPPEArray.map((ppe) => {
            const found = ppeData.find((item) => item.ppe === ppe);
            return found || { ppe }; // Fallback if not found
        });

        setFormData({
            ...formData,
            PPEItems: selectedRows
        });
        setPopupVisible(false);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

    return (
        <div className="input-row">
            <div className="ppe-input-box">
                <div className="ppe-header">
                    <input
                        type="checkbox"
                        className="na-checkbox-ppe"
                        checked={isNA}
                        onChange={handleNAToggle}
                    />
                    <h3 className="font-fam-labels">PPE</h3>
                </div>
                {role === "admin" && (
                    <button className="top-right-button-ppe-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit PPE" /></button>
                )}
                <button className="top-right-button-ppe" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest PPE" /></button>
                <PPEPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); }}
                    role={role}
                    userID={userID}
                    setPPEData={setPPEData}  // Pass the setter to update PPE options locally
                    onAdd={handleNewPpe}
                />

                {isManageOpen && <ManagePPE closePopup={closeManagePopup} onClose={fetchValues} onUpdate={handlePpeUpdate}
                    userID={userID}
                    setPPEData={setPPEData}
                    onAdd={handleNewPpe} />}

                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-ppe">
                        <div className="popup-content-ppe">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select PPE</h2>
                                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
                            </div>

                            <div className="review-date-group">
                                <div className="ppe-input-container">
                                    <input
                                        className="search-input-ppe"
                                        type="text"
                                        placeholder="Search PPE"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                                    {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                                </div>
                            </div>
                            <div className="ppe-table-group">
                                <div className="popup-table-wrapper-ppe">
                                    <table className="popup-table font-fam">
                                        <thead className="ppe-headers">
                                            <tr>
                                                <th className="inp-size-ppe">Select</th>
                                                <th>PPE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ppeData.length > 0 ? (
                                                ppeData
                                                    .filter((item) =>
                                                        item.ppe.toLowerCase().includes(searchTerm.toLowerCase())
                                                    )
                                                    .sort((a, b) => a.ppe.localeCompare(b.ppe))
                                                    .map((item) => (
                                                        <tr key={item.ppe}
                                                            onClick={() => handleCheckboxChange(item.ppe)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox-inp-ppe"
                                                                    checked={selectedPPE.has(item.ppe)}
                                                                    onChange={() => handleCheckboxChange(item.ppe)}
                                                                />
                                                            </td>
                                                            <td style={{ whiteSpace: "pre-wrap" }}>{item.ppe}</td>
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
                            </div>
                            <div className="ppe-buttons">
                                <button onClick={handleSaveSelection} className="ppe-button">Save Selection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedPPE.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-ppe-ppe" style={{ textAlign: "center" }}>PPE</th>
                                <th className="col-ppe-act" style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.PPEItems?.map((row, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.ppe}</td>
                                    <td className="procCent">
                                        <div className="term-action-buttons">
                                            <button
                                                className="remove-row-button"
                                                style={{ paddingRight: "6px" }}
                                                onClick={() => {
                                                    // Remove abbreviation from table and the selected abbreviations set
                                                    setFormData({
                                                        ...formData,
                                                        PPEItems: formData.PPEItems.filter((_, i) => i !== index),
                                                    });
                                                    setUsedPPEOptions(
                                                        usedPPEOptions.filter((ppe) => ppe !== row.ppe)
                                                    );

                                                    // Update the selectedAbbrs state to reflect the removal
                                                    const newSelectedPPE = new Set(selectedPPE);
                                                    newSelectedPPE.delete(row.ppe);
                                                    setSelectedPPE(newSelectedPPE);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                            </button>
                                            <button
                                                className="edit-terms-row-button"
                                                disabled={
                                                    originalData.some(item => item.ppe === row.ppe)
                                                }
                                                style={{ color: originalData.some(item => item.ppe === row.ppe) ? "lightgray" : "", paddingLeft: "6px" }}
                                                onClick={() => {
                                                    openUpdate(row.ppe)
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} title="Modify PPE" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {(selectedPPE.size === 0 && isNA) && (
                    <button className="add-row-button-ppe" onClick={handlePopupToggle} disabled={!isNA}>
                        Select
                    </button>
                )}

                {selectedPPE.size > 0 && (
                    <button className="add-row-button-ppe-plus" onClick={handlePopupToggle}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}
            </div>

            {updatePopup && (<ModifySuggestedPPE ppe={ppeUpdate} closePopup={closeUpdate} onAdd={handleUpdatePPE} setPPEData={setPPEData} />)}
        </div>
    );
};

export default PPETable;
