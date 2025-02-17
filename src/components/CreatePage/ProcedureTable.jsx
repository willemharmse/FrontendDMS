import React from "react";
import './ProcedureTable.css';

const ProcedureTable = ({ procedureRows, addRow, removeRow, updateRow }) => {
    const accountableOptions = [
        "Engineering Manager", "Section Engineer", "Engineering Superintendent",
        "Engineering Foreman (Mechanical/Electrical)", "Control and Instrumentation (C&I) Technician",
        "Mechanical Technician", "Electrical Technician", "Maintenance Planner", "Fitter",
        "Electrician", "Boilermaker", "Diesel Mechanic", "Instrumentation Mechanic",
        "Millwright", "Engineering Assistant"
    ];

    const responsibleOptions = [
        "Engineering Manager", "Section Engineer", "Engineering Superintendent",
        "Engineering Foreman (Mechanical/Electrical)", "Control and Instrumentation (C&I) Technician",
        "Mechanical Technician", "Electrical Technician", "Maintenance Planner", "Fitter",
        "Electrician", "Boilermaker", "Diesel Mechanic", "Instrumentation Mechanic",
        "Millwright", "Engineering Assistant"
    ];



    const handleInputChange = (index, field, value) => {
        updateRow(index, field, value); // Call a prop function to update the row data
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Procedure <span className="required-field">*</span></h3>
            {procedureRows.length > 0 && (
                <table className="vcr-table table-borders">
                    <thead className="cp-table-header">
                        <tr>
                            <th className="procCent procNr">Nr</th>
                            <th className="procCent procMain">Procedure Main Steps</th>
                            <th className="procCent procSub">Procedure Sub Steps</th>
                            <th className="procCent procAR">Accountable and Responsible</th>
                            <th className="procCent procAct"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {procedureRows.map((row, index) => (
                            <tr key={index}>
                                <td className="procCent">
                                    {row.nr}
                                </td>
                                <td>
                                    <textarea
                                        name="mainStep"
                                        className="aim-textarea-pt font-fam"
                                        value={row.mainStep}
                                        onChange={(e) => handleInputChange(index, "mainStep", e.target.value)}
                                        rows="4"   // Adjust the number of rows for initial height
                                        placeholder="Enter the main step of the procedure here..." // Optional placeholder text
                                    />
                                </td>
                                <td>
                                    <textarea
                                        name="SubStep"
                                        className="aim-textarea-pt font-fam"
                                        value={row.SubStep}
                                        onChange={(e) => handleInputChange(index, "SubStep", e.target.value)}
                                        rows="4"   // Adjust the number of rows for initial height
                                        placeholder="Enter the sub steps of the procedure here..." // Optional placeholder text
                                    />
                                </td>
                                <td>
                                    <div className="select-container-proc">
                                        <div className="select-wrapper">
                                            <label className="select-label-proc">R:</label>
                                            <select
                                                className="table-control-proc"
                                                value={row.responsible}
                                                onChange={(e) => handleInputChange(index, "responsible", e.target.value)}
                                            >
                                                <option value="">Select an option</option>
                                                {responsibleOptions.sort().map((option, i) => (
                                                    <option key={i} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="select-wrapper">
                                            <label className="select-label-proc">A:</label>
                                            <select
                                                className="table-control-proc"
                                                value={row.accountable}
                                                onChange={(e) => handleInputChange(index, "accountable", e.target.value)}
                                            >
                                                <option value="">Select an option</option>
                                                {accountableOptions.sort().map((option, i) => (
                                                    <option key={i} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <button
                                        className="remove-row-button"
                                        onClick={() => removeRow(index)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button className="add-row-button" onClick={addRow}>
                + Add Row
            </button>
        </div>
    );
};

export default ProcedureTable;
