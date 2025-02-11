import React, { useState, useEffect } from "react";
import "./PPETable.css"; // Add styling here
import PPEPopup from "../ValueChanges/PPEPopup.jsx";
import ManagePPE from "../ValueChanges/ManagePPE.jsx";

const PPETable = ({ formData, setFormData, usedPPEOptions, setUsedPPEOptions, role }) => {
    // State to control the popup and selected abbreviations
    const [ppeData, setPPEData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedPPE, setSelectedPPE] = useState(new Set(usedPPEOptions));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

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

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

    return (
        <div className="ppe-input-box">
            <h3 className="font-fam-labels">PPE</h3>
            {role === "admin" && (
                <button className="top-right-button-ppe" onClick={openManagePopup}>Update PPE</button>
            )}
            {role === "admin" && (
                <button className="top-right-button-ppe-2" onClick={() => setShowNewPopup(true)}>Add PPE</button>
            )}
            <PPEPopup
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); fetchValues(); }}
            />

            {isManageOpen && <ManagePPE closePopup={closeManagePopup} onClose={fetchValues} />}
            <div className="na-checkbox-container-ppe">
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
                <div className="popup-overlay-ppe">
                    <div className="popup-content-terms">
                        <h4 className="center-ppe">Select PPE Options</h4>
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
                        <button className="save-selection-button-ppe" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-ppe" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            <table className="vcr-table font-fam table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="col-ppe-ppe">PPE</th>
                        <th className="col-ppe-act"></th>
                    </tr>
                </thead>
                <tbody>
                    {formData.PPEItems?.map((row, index) => (
                        <tr key={index}>
                            <td>{row.ppe}</td>
                            <td>
                                <button
                                    className="remove-row-button"
                                    onClick={() => {
                                        // Remove abbreviation from table and the selected abbreviations set
                                        setFormData({
                                            ...formData,
                                            PPEItems: formData.PPEItems.filter((_, i) => i !== index),
                                        });
                                        setUsedPPEOptions(
                                            usedPPEOptions.filter((PPE) => PPE !== row.PPE)
                                        );

                                        // Update the selectedAbbrs state to reflect the removal
                                        const newSelectedPPE = new Set(selectedPPE);
                                        newSelectedPPE.delete(row.PPE);
                                        setSelectedPPE(newSelectedPPE);
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
                Select PPE
            </button>
        </div>
    );
};

export default PPETable;
