import React, { useState, useEffect } from "react";
import "./HandToolsTable.css"; // Add styling here
import ToolPopup from "../ValueChanges/HandToolPopup";
import ManageHandTools from "../ValueChanges/ManageHandTools";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faX, faSearch, faHistory, faPlus, faPenToSquare, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

const HandToolTable = ({ formData, setFormData, usedHandTools, setUsedHandTools, role, userID }) => {
    // State to control the popup and selected abbreviations
    const [toolsData, setToolsData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedTools, setSelectedTools] = useState(new Set(usedHandTools));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/tool`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

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

    useEffect(() => {
        setSelectedTools(new Set(usedHandTools));
        if (usedHandTools.length > 0) {
            setIsNA(true); // Automatically check the box if equipment data exists
        }
    }, [usedHandTools]);

    const handlePopupToggle = () => {
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

    const openManagePopup = () => setIsManageOpen(true);
    const closeManagePopup = () => setIsManageOpen(false);

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
                {role === "admin" && (
                    <button className="top-right-button-tool-2" onClick={openManagePopup}><FontAwesomeIcon icon={faPenToSquare} onClick={clearSearch} className="icon-um-search" title="Edit Tools" /></button>
                )}
                <button className="top-right-button-tool" onClick={() => setShowNewPopup(true)}><FontAwesomeIcon icon={faPlusCircle} onClick={clearSearch} className="icon-um-search" title="Suggest Tool" /></button>
                <ToolPopup
                    isOpen={showNewPopup}
                    onClose={() => { setShowNewPopup(false); if (role === "admin") fetchValues(); }}
                    role={role}
                    userID={userID}
                    setToolsData={setToolsData}
                />

                {isManageOpen && <ManageHandTools closePopup={closeManagePopup} onClose={fetchValues} />}
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
                                                            <td>{item.tool}</td>
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
                            <div className="tool-buttons">
                                <button onClick={handleSaveSelection} className="tool-button">Save Selection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display selected abbreviations in a table */}
                {selectedTools.size > 0 && (
                    <table className="vcr-table font-fam table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="col-tool-tool">Tool</th>
                                <th className="col-tool-act">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.HandTools?.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.tool}</td>
                                    <td className="procCent">
                                        <button
                                            className="remove-row-button"
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {selectedTools.size === 0 && (
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
        </div>
    );
};

export default HandToolTable;