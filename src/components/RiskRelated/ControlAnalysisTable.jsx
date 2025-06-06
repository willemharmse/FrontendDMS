import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faSearch, faTrash, faArrowUpRightFromSquare, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import "./ControlAnalysisTable.css";
import { v4 as uuidv4 } from "uuid";
import ControlEAPopup from "./ControlEAPopup";

const ControlAnalysisTable = ({ rows, updateRows, ibra, addRow, removeRow, updateRow }) => {
    const [insertPopup, setInsertPopup] = useState();
    const [selectedRowData, setSelectedRowData] = useState();

    const insertRowAt = (insertIndex) => {
        const newRows = [...rows];

        const newRow = {
            id: uuidv4(), nr: 0, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: ""
        }

        newRows.splice(insertIndex, 0, newRow);
        newRows.forEach((r, i) => {
            r.nr = i + 1;
        });

        updateRow(newRows);
    };

    const closeInsertPopup = () => {
        setInsertPopup(false);
    }

    const getClass = (type) => {
        switch (type) {
            case "Very Effective":
                return 'cea-table-page-input-green';
            case "Could Improve":
                return 'cea-table-page-input-yellow';
            case "Not Effective":
                return 'cea-table-page-input-red';
            default:
                return ''; // Or some fallback class
        }
    }

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-attendance`}>
                <h3 className="font-fam-labels">
                    Control Effectiveness Analysis (CEA)<span className="required-field">*</span>
                </h3>

                <div className="control-analysis-labels">
                    <label className="control-analysis-label">Only the controls identified in the Risk Assessment are included in the table below.</label>
                    <label className="control-analysis-label">The Facilitator and Risk Assessment Team may update control attributes where deemed necessary.</label>
                    <label className="control-analysis-label">Open the popup  {<FontAwesomeIcon icon={faArrowUpRightFromSquare} />}  to edit or view more information regarding a control and its attributes.
                    </label>
                </div>

                <button
                    className="top-right-button-ar"
                    title="Search"
                >
                    <FontAwesomeIcon icon={faSearch} className="icon-um-search" />
                </button>

                <table className="vcr-table-cea font-fam table-borders">
                    <thead className="control-analysis-head">
                        <tr>
                            <th colSpan={3} className="control-analysis-split">Control Identification</th>
                            <th colSpan={7} className="control-analysis-split">Control Effectiveness Rating (CER)</th>
                            <th colSpan={1} className="control-analysis-th" rowSpan={2}>Action</th>
                        </tr>
                        <tr>
                            <th className="control-analysis-nr">Nr</th>
                            <th className="control-analysis-control">Control</th>
                            <th className="control-analysis-critcal">Critical Control</th>
                            <th className="control-analysis-act">Act, Object or System</th>
                            <th className="control-analysis-activation">Control Activation (Pre or Post Unwanted Event)</th>
                            <th className="control-analysis-hiearchy">Hierarchy of Controls</th>
                            <th className="control-analysis-cons">Specific Consequence Addressed</th>
                            <th className="control-analysis-quality">Quality (%)</th>
                            <th className="control-analysis-cer">Control Effectiveness Rating (CER)</th>
                            <th className="control-analysis-notes">Notes Regarding the Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index} className={row.nr % 2 === 0 ? `evenTRColour` : ``}>
                                <td className="cent" style={{ alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: "14px" }}>{row.nr}</span>
                                    <FontAwesomeIcon
                                        style={{ fontSize: "14px" }}
                                        icon={faArrowUpRightFromSquare}
                                        className="ue-popup-icon"
                                        title="Evaluate Control"
                                        onClick={() => {
                                            setSelectedRowData(row)
                                            setInsertPopup(true)
                                        }}
                                    /></td>
                                <td style={{ fontSize: "14px" }}>
                                    {row.control || ""}
                                </td>
                                <td className={`${row.critical === "Yes" ? 'cea-table-page-critical' : ''}`} style={{ textAlign: 'center', fontSize: "14px" }}>
                                    {row.critical || ""}
                                </td>
                                <td style={{ textAlign: 'center', fontSize: "14px" }}>
                                    {row.act || ""}
                                </td>
                                <td style={{ fontSize: "14px" }}>
                                    {row.activation || ""}
                                </td>
                                <td style={{ fontSize: "14px" }}>
                                    {row.hierarchy || ""}
                                </td>
                                <td style={{ fontSize: "14px" }}>
                                    {row.cons || ""}
                                </td>
                                <td style={{ textAlign: 'center', fontSize: "14px" }}>
                                    {row.quality || ""}
                                </td>
                                <td className={getClass(row.cer)} style={{ textAlign: 'center', fontSize: "14px" }}>
                                    {row.cer || ""}
                                </td>
                                <td style={{ fontSize: "14px" }}>
                                    {row.notes || ""}
                                </td>
                                <td className="procCent action-cell">
                                    <div className="ibra-action-buttons">
                                        <button
                                            className="remove-row-button font-fam"
                                            title="Remove Row"
                                            type="button"
                                            onClick={() => removeRow(row.id)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {insertPopup && (<ControlEAPopup data={selectedRowData} onClose={closeInsertPopup} onSave={updateRows} />)}
        </div>
    );
};

export default ControlAnalysisTable;