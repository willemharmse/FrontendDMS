import React, { useState, useEffect } from "react";
import "./HandToolsTableRisk.css"; // Add styling here
import RiskHandToolPopup from "../RiskValueChanges/RiskHandToolPopup"
import RiskManageHandTools from "../RiskValueChanges/RiskManageHandTools"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import ModifySuggestedHandTools from "../../ValueChanges/ModifySuggestedHandTools";

const HandToolsTableRisk = ({ formData, setFormData, usedHandTools, setUsedHandTools, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [toolsData, setToolsData] = useState([]);
    const [originalData, setOriginalData] = useState([])
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedTools, setSelectedTools] = useState(new Set(usedHandTools));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [toolUpdate, setToolUpdate] = useState("");
    const [updatePopup, setUpdatePopup] = useState(false);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/tool`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setOriginalData(data.tools)
            setToolsData(data.tools);
            localStorage.setItem('cachedToolOptions', JSON.stringify(data.tools));
        } catch (error) {
            console.log(error);
            const cached = localStorage.getItem('cachedToolOptions');
            if (cached) {
                setToolsData(JSON.parse(cached));
            }
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    useEffect(() => {
        fetchValues();
    }, []);

    const handleNewTool = (newTool) => {
        const code = newTool.tool;
        // add to the “used” codes array
        setUsedHandTools((prev) => [...prev, code]);
        setSelectedTools((prev) => new Set(prev).add(code));
        setFormData((prev) => ({
            ...prev,
            HandTools: [...prev.HandTools, newTool],
        }));
    };

    const handleToolUpdate = (updatedTool, oldTool) => {
        // 1) Swap out the code in usedAbbrCodes
        setUsedHandTools(prev =>
            prev.map(code => (code === oldTool ? updatedTool.tool : code))
        );

        // 2) Update the selectedAbbrs Set
        setUsedHandTools(prev => {
            const next = new Set(prev);
            if (next.has(oldTool)) {
                next.delete(oldTool);
                next.add(updatedTool.tool);
            }
            return next;
        });

        // 3) Remap the rows in formData.abbrRows
        setFormData(prev => ({
            ...prev,
            HandTools: prev.HandTools.map(row =>
                row.tool === oldTool
                    ? { tool: updatedTool.tool + " *" }
                    : row
            ),
        }));
    };

    const handleUpdateTool = (newToolObj, oldTool) => {
        const updatedCode = newToolObj.tool;

        // 1. Remove the old abbreviation from usedAbbrCodes
        setUsedHandTools(prev =>
            prev.filter(code => code !== oldTool)
        );

        // 2. Remove from selectedAbbrs and add the new one
        setSelectedTools(prev => {
            const updated = new Set(prev);
            updated.delete(oldTool);
            updated.add(updatedCode);
            return updated;
        });

        // 3. Replace the old row in abbrRows with the updated one
        setFormData(prev => ({
            ...prev,
            HandTools: prev.HandTools.map(row =>
                row.tool === oldTool
                    ? newToolObj
                    : row
            ),
        }));

        // 4. Optionally add to usedAbbrCodes again if needed (if not already added)
        setUsedHandTools(prev => [...prev, updatedCode]);
    };

    const openUpdate = (tool) => {
        setToolUpdate(tool);

        setUpdatePopup(true);
    }

    const closeUpdate = () => {
        setToolUpdate("");

        setUpdatePopup(false);
    }

    useEffect(() => {
        setSelectedTools(new Set(usedHandTools));
        if (usedHandTools.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedHandTools]);

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
            setSelectedTools(new Set());
            setUsedHandTools([]);
            setFormData({ ...formData, HandTools: [] });
        }
    };

    const handleCheckboxChange = (tool) => {
        const newSelectedTools = new Set(selectedTools);
        if (newSelectedTools.has(tool)) {
            newSelectedTools.delete(tool);
        } else {
            newSelectedTools.add(tool);
        }
        setSelectedTools(newSelectedTools);
    };

    const handleSaveSelection = () => {
        const selectedToolArray = [...selectedTools];
        setUsedHandTools(selectedToolArray);

        const selectedRows = selectedToolArray.map((tool) => {
            const found = toolsData.find((item) => item.tool === tool);
            return found || { tool }; // Fallback if not found
        });

        setFormData({
            ...formData,
            HandTools: selectedRows
        });
        setPopupVisible(false);
    };

    const openManagePopup = (tool) => {
        setToolUpdate(tool);
        setIsManageOpen(true);
    }

    const closeManagePopup = () => {
        setToolUpdate("");
        setIsManageOpen(false);
    }

    const openAddPopup = () => {
        handleSaveSelection();
        setShowNewPopup(true)
    }

    return (
        <div className="input-row">
            <div className="tool-input-box">
                <div className="tool-header">
                    <input
                        type="checkbox"
                        className="na-checkbox-tool"
                        checked={isNA}
                        onChange={handleNAToggle}
                    />
                    <h3 className="font-fam-labels">Hand Tools</h3>
                </div>
                <RiskHandToolPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); }}
                    role={role}
                    userID={userID}
                    setToolsData={setToolsData}
                    onAdd={handleNewTool}
                />

                {isManageOpen && <RiskManageHandTools closePopup={closeManagePopup} onClose={fetchValues} onUpdate={handleToolUpdate}
                    userID={userID}
                    setToolData={setToolsData}
                    onAdd={handleNewTool}
                    tool={toolUpdate} />}

                {/* Popup */}
                {popupVisible && (
                    <div className="popup-overlay-tool">
                        <div className="popup-content-tool">
                            <div className="review-date-header">
                                <h2 className="review-date-title">Select Hand Tools</h2>
                                <button className="review-date-close" onClick={handlePopupToggle} title="Close Popup">×</button>
                            </div>

                            <div className="review-date-group">
                                <div className="tool-input-container">
                                    <input
                                        className="search-input-tool"
                                        type="text"
                                        placeholder="Search Hand Tool"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                                    {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                                </div>
                            </div>

                            <div className="tool-table-group">
                                <div className="popup-table-wrapper-tool">
                                    <table className="popup-table font-fam">
                                        <thead className="tool-headers">
                                            <tr>
                                                <th className="inp-size-tool">Select</th>
                                                <th>Tool</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {toolsData.length > 0 ? (
                                                toolsData
                                                    .filter((item) =>
                                                        item.tool.toLowerCase().includes(searchTerm.toLowerCase())
                                                    )
                                                    .sort((a, b) => a.tool.localeCompare(b.tool))
                                                    .map((item) => (
                                                        <tr key={item.tool}
                                                            onClick={() => handleCheckboxChange(item.tool)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="checkbox-inp-tool"
                                                                    checked={selectedTools.has(item.tool)}
                                                                    onChange={() => handleCheckboxChange(item.tool)}
                                                                />
                                                            </td>
                                                            <td style={{ whiteSpace: "pre-wrap" }}>{item.tool}</td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3">Loading tools...</td>
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
                {selectedTools.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-tool-tool" style={{ textAlign: "center" }}>Tool</th>
                                <th className="col-tool-act" style={{ textAlign: "center" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.HandTools?.map((row, index) => (
                                <tr key={index}>
                                    <td style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{row.tool}</td>
                                    <td className="procCent">
                                        <div className="term-action-buttons">
                                            <button
                                                className="remove-row-button"
                                                style={{ paddingRight: "6px" }}
                                                onClick={() => {
                                                    // Remove abbreviation from table and the selected abbreviations set
                                                    setFormData({
                                                        ...formData,
                                                        HandTools: formData.HandTools.filter((_, i) => i !== index),
                                                    });
                                                    setUsedHandTools(
                                                        usedHandTools.filter((tool) => tool !== row.tool)
                                                    );

                                                    // Update the selectedAbbrs state to reflect the removal
                                                    const newSelectedTools = new Set(selectedTools);
                                                    newSelectedTools.delete(row.tool);
                                                    setSelectedTools(newSelectedTools);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                            </button>
                                            <button
                                                className="edit-terms-row-button"
                                                style={{ paddingLeft: "6px" }}
                                                onClick={() => {
                                                    if (originalData.some(item => item.tool === row.tool)) { openManagePopup(row.tool) }
                                                    else {
                                                        openUpdate(row.tool);
                                                    }
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} title="Modify Hand Tool" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {(selectedTools.size === 0 && isNA) && (
                    <button className="add-row-button-tool" onClick={handlePopupToggle} disabled={!isNA}>
                        Select
                    </button>
                )}

                {selectedTools.size > 0 && (
                    <button className="add-row-button-tool-plus" onClick={handlePopupToggle}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}
            </div>

            {updatePopup && (<ModifySuggestedHandTools tool={toolUpdate} closePopup={closeUpdate} onAdd={handleUpdateTool} setToolData={setToolsData} />)}
        </div>
    );
};

export default HandToolsTableRisk;