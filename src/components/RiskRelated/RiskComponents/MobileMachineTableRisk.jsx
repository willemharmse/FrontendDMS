import React, { useState, useEffect } from "react";
import "./MobileMachineTableRisk.css"; // Add styling here
import RiskMobileMachinePopup from "../RiskValueChanges/RiskMobileMachinePopup"
import RiskManageMobileMachines from "../RiskValueChanges/RiskManageMobileMachines"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedMobileMachines from "../../ValueChanges/ModifySuggestedMobileMachines";

const MobileMachineTableRisk = ({ formData, setFormData, usedMobileMachine, setUsedMobileMachine, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [macData, setMacData] = useState([]);
    const [originalData, setOriginalData] = useState([])
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedMMachine, setSelectedMMachine] = useState(new Set(usedMobileMachine));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [macUpdate, setMacUpdate] = useState("");
    const [updatePopup, setUpdatePopup] = useState(false);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/mac`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setMacData(data.macs);
            setOriginalData(data.macs);
            localStorage.setItem('cachedMacOptions', JSON.stringify(data.macs));
        } catch (error) {
            console.log(error);
            const cached = localStorage.getItem('cachedMacOptions');
            if (cached) {
                setMacData(JSON.parse(cached));
            }
        }
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const handleNewMac = (newMac, newNormal) => {
        const code = newMac.machine;
        // add to the “used” codes array
        setUsedMobileMachine((prev) => [...prev, code]);
        setSelectedMMachine((prev) => new Set(prev).add(code));
        setFormData((prev) => ({
            ...prev,
            MobileMachine: [...prev.MobileMachine, newNormal],
        }));
    };

    const handleMacUpdate = (updatedMac, oldMac) => {
        // 1) Swap out the code in usedAbbrCodes
        setUsedMobileMachine(prev =>
            prev.map(code => (code === oldMac ? updatedMac.mac : code))
        );

        // 2) Update the selectedAbbrs Set
        setSelectedMMachine(prev => {
            const next = new Set(prev);
            if (next.has(oldMac)) {
                next.delete(oldMac);
                next.add(updatedMac.machine);
            }
            return next;
        });

        // 3) Remap the rows in formData.abbrRows
        setFormData(prev => ({
            ...prev,
            MobileMachine: prev.MobileMachine.map(row =>
                row.mac === oldMac
                    ? { mac: updatedMac.machine + " *" }
                    : row
            ),
        }));
    };

    const handleUpdateMac = (newMacObj, oldMac, newNormal) => {
        const updatedCode = newMacObj.machine;

        // 1. Remove the old abbreviation from usedAbbrCodes
        setUsedMobileMachine(prev =>
            prev.filter(code => code !== oldMac)
        );

        // 2. Remove from selectedAbbrs and add the new one
        setSelectedMMachine(prev => {
            const updated = new Set(prev);
            updated.delete(oldMac);
            updated.add(updatedCode);
            return updated;
        });

        // 3. Replace the old row in abbrRows with the updated one
        setFormData(prev => ({
            ...prev,
            MobileMachine: prev.MobileMachine.map(row =>
                row.mac === oldMac
                    ? newNormal
                    : row
            ),
        }));

        // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
        setUsedMobileMachine(prev => [...prev, updatedCode]);
    };

    const openUpdate = (mac) => {
        setMacUpdate(mac);

        setUpdatePopup(true);
    }

    const closeUpdate = () => {
        setMacUpdate("");

        setUpdatePopup(false);
    }
    useEffect(() => {
        setSelectedMMachine(new Set(usedMobileMachine));
        if (usedMobileMachine.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedMobileMachine]);

    const handlePopupToggle = () => {
        setSearchTerm("")
        setPopupVisible(!popupVisible);
    };

    const clearSearch = () => {
        setSearchTerm("");
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
        <div className="input-row">
            <div className="mac-input-box">
                <div className="mac-header">
                    <input
                        type="checkbox"
                        className="na-checkbox-mac"
                        checked={isNA}
                        onChange={handleNAToggle}
                    />
                    <h3 className="font-fam-labels">Mobile Machinery</h3>
                </div>
                {role === "admin" && (
                    <button className="top-right-button-mac-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit Mobile Machines" /></button>
                )}
                <button className="top-right-button-mac" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest Mobile Machine" /></button>
                <RiskMobileMachinePopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); }}
                    role={role}
                    userID={userID}
                    setMacData={setMacData}
                    onAdd={handleNewMac}
                />

                {isManageOpen && <RiskManageMobileMachines closePopup={closeManagePopup} onClose={fetchValues} onUpdate={handleMacUpdate}
                    userID={userID}
                    setMachineData={setMacData}
                    onAdd={handleNewMac} />}

                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-mac">
                        <div className="popup-content-mac">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select Mobile Machinery</h2>
                                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
                            </div>

                            <div className="review-date-group">
                                <div className="mac-input-container">
                                    <input
                                        className="search-input-mac"
                                        type="text"
                                        placeholder="Search Mobile Machine"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                                    {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                                </div>
                            </div>

                            <div className="mac-table-group">
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
                                                            <td style={{ whiteSpace: "pre-wrap" }}>{item.machine}</td>
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
                            <div className="mac-buttons">
                                <button onClick={handleSaveSelection} className="mac-button">Save Selection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedMMachine.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-mac-mac" style={{ textAlign: "center" }}>Mobile Machine</th>
                                <th className="col-mac-act" style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.MobileMachine?.map((row, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.mac}</td>
                                    <td className="procCent">
                                        <div className="term-action-buttons">
                                            <button
                                                className="remove-row-button"
                                                style={{ paddingRight: "6px" }}
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
                                                <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                            </button>
                                            <button
                                                className="edit-terms-row-button"
                                                disabled={
                                                    originalData.some(item => item.machine === row.mac)
                                                }
                                                style={{ color: originalData.some(item => item.machine === row.mac) ? "lightgray" : "", paddingLeft: "6px" }}
                                                onClick={() => {
                                                    openUpdate(row.mac)
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} title="Modify Mobile Machine" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {(selectedMMachine.size === 0 && isNA) && (
                    <button className="add-row-button-mac" onClick={handlePopupToggle} disabled={!isNA}>
                        Select
                    </button>
                )}

                {selectedMMachine.size > 0 && (
                    <button className="add-row-button-mac-plus" onClick={handlePopupToggle}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}
            </div>

            {updatePopup && (<ModifySuggestedMobileMachines mac={macUpdate} closePopup={closeUpdate} onAdd={handleUpdateMac} setMachineData={setMacData} />)}
        </div>
    );
};

export default MobileMachineTableRisk;
