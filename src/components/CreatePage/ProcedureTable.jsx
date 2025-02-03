import React from "react";
import './ProcedureTable.css';

const ProcedureTable = ({ procedureRows, addRow, removeRow, updateRow }) => {
    const disciplineOptions = ["Engineering", "Finance", "Geology", "Metallurgy", "Mining", "Protection Services", "S&SD", "Survey", "Training", "VOHE"];
    const accountableOptions = ["Abel Moetji", "Andre Coetzee", "Anzel Swanepoel", "Quintin Coetzee", "Rossouw Snyders", "Willem Harmse"];
    const responsibleOptions = ["Abel Moetji", "Andre Coetzee", "Anzel Swanepoel", "Quintin Coetzee", "Rossouw Snyders", "Willem Harmse"];

    const handleInputChange = (index, field, value) => {
        updateRow(index, field, value); // Call a prop function to update the row data
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">Procedure</h3>
            <table className="vcr-table table-borders">
                <thead className="cp-table-header">
                    <tr>
                        <th className="procCent">Nr</th>
                        <th className="procCent">Procedure Main Steps</th>
                        <th className="procCent">Procedure Sub Steps</th>
                        <th className="procCent">Discipline</th>
                        <th className="procCent">Accountable</th>
                        <th className="procCent">Responsible</th>
                        <th className="procCent procAct"></th>
                    </tr>
                </thead>
                <tbody>
                    {procedureRows.map((row, index) => (
                        <tr key={index}>
                            <td>
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
                                <select
                                    className="table-control"
                                    value={row.discipline}
                                    onChange={(e) => handleInputChange(index, "discipline", e.target.value)}
                                >
                                    {disciplineOptions.map((option, i) => (
                                        <option key={i} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select
                                    className="table-control"
                                    value={row.accountable}
                                    onChange={(e) => handleInputChange(index, "accountable", e.target.value)}
                                >
                                    {accountableOptions.map((option, i) => (
                                        <option key={i} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select
                                    className="table-control"
                                    value={row.responsible}
                                    onChange={(e) => handleInputChange(index, "responsible", e.target.value)}
                                >
                                    {responsibleOptions.map((option, i) => (
                                        <option key={i} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
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
            <button className="add-row-button" onClick={addRow}>
                + Add Row
            </button>
        </div>
    );
};

export default ProcedureTable;
