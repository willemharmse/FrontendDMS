import React, { useState, useEffect } from "react";
import "./HandToolsTable.css"; // Add styling here
import ToolPopup from "../ValueChanges/HandToolPopup";
import ManageHandTools from "../ValueChanges/ManageHandTools";

const HandToolTable = ({ formData, setFormData, usedHandTools, setUsedHandTools, role }) => {
    // State to control the popup and selected abbreviations
    const [toolsData, setToolsData] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedTools, setSelectedTools] = useState(new Set(usedHandTools));
    const [isNA, setIsNA] = useState(false);
    const [showNewPopup, setShowNewPopup] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/tool`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setToolsData(data.tools);
        } catch (error) {
            console.error("Error fetching tools:", error)
        }
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
        <div className="tool-input-box">
            <div className="tool-header">
                <h3 className="font-fam-labels">Hand Tools</h3>
                <input
                    type="checkbox"
                    className="na-checkbox-tool"
                    checked={isNA}
                    onChange={handleNAToggle}
                />
            </div>
            {role === "admin" && (
                <button className="top-right-button-tool" onClick={openManagePopup}>Update Tools</button>
            )}
            {role === "admin" && (
                <button className="top-right-button-tool-2" onClick={() => setShowNewPopup(true)}>Add Tool</button>
            )}
            <ToolPopup
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); fetchValues(); }}
            />

            {isManageOpen && <ManageHandTools closePopup={closeManagePopup} onClose={fetchValues} />}
            {/* Popup */}
            {popupVisible && (
                <div className="popup-overlay-tool">
                    <div className="popup-content-tool">
                        <h4 className="center-tools">Select Hand Tools</h4>
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
                        <button className="save-selection-button-tool" onClick={handleSaveSelection}>
                            Save Selection
                        </button>
                        <button className="close-popup-button-tool" onClick={handlePopupToggle}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Display selected abbreviations in a table */}
            {selectedTools.size > 0 && (
                <table className="vcr-table font-fam table-borders">
                    <thead className="cp-table-header">
                        <tr>
                            <th className="col-tool-tool">Tool</th>
                            <th className="col-tool-act"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.HandTools?.map((row, index) => (
                            <tr key={index}>
                                <td>{row.tool}</td>
                                <td>
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
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button className="add-row-button" onClick={handlePopupToggle} disabled={!isNA}>
                Select Hand Tools
            </button>
        </div>
    );
};

export default HandToolTable;