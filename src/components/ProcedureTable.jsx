import React from "react";

const ProcedureTable = ({ procedureRows, addRow, removeRow, updateRow }) => {
    const handleInputChange = (index, field, value) => {
        updateRow(index, field, value); // Call a prop function to update the row data
    };

    return (
        <div className="input-box-2">
            <h3>Procedures</h3>
            <table className="signature-table">
                <thead>
                    <tr>
                        <th>Nr</th>
                        <th>Procedure Main Steps</th>
                        <th>Procedure Sub Steps</th>
                        <th>Accountable and Responsible</th>
                        <th>General Comments</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {procedureRows.map((row, index) => (
                        <tr key={index}>
                            <td>
                                {row.nr}
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.mainStep}
                                    onChange={(e) => handleInputChange(index, "mainStep", e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.SubStep}
                                    onChange={(e) => handleInputChange(index, "SubStep", e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.ar}
                                    onChange={(e) => handleInputChange(index, "ar", e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.general}
                                    onChange={(e) => handleInputChange(index, "general", e.target.value)}
                                />
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
