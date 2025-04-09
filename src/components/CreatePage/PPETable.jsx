import React, { useState, useEffect } from "react";
import "./PPETable.css"; // Add styling here
import PPEPopup from "../ValueChanges/PPEPopup.jsx";
import ManagePPE from "../ValueChanges/ManagePPE.jsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const PPETable = ({ formData, setFormData, usedPPEOptions, setUsedPPEOptions, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [ppeData, setPPEData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedPPE, setSelectedPPE] = useState(new Set(usedPPEOptions));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/ppe`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setPPEData(data.ppe);
        } catch (error) {
            console.error("Error fetching equipment:", error)
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    useEffect(() => {
        setSelectedPPE(new Set(usedPPEOptions));
        if (usedPPEOptions.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedPPEOptions]);

    const handlePopupToggle = () => {
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
                    <button className="top-right-button-ppe-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" /></button>
                )}
                <button className="top-right-button-ppe" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" /></button>
                <PPEPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); if (role === "admin") fetchValues(); }}
                    role={role}
                    userID={userID}
                    setPPEData={setPPEData}  // Pass the setter to update PPE options locally
                />

                {isManageOpen && <ManagePPE closePopup={closeManagePopup} onClose={fetchValues} />}

                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-ppe">
                        <div className="popup-content-ppe">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select PPE</h2>
                                <button className="review-date-close" onClick={handlePopupToggle}>×</button>
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
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
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
                                                            <td>{item.ppe}</td>
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
                                <th className="col-ppe-ppe">PPE</th>
                                <th className="col-ppe-act">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.PPEItems?.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.ppe}</td>
                                    <td className="procCent">
                                        <button
                                            className="remove-row-button"
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

export default PPETable;
