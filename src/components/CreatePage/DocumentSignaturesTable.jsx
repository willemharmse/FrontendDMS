import React, { useState } from "react";
import "./DocumentSignaturesTable.css";

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow }) => {
  const [selectedNames, setSelectedNames] = useState([]);

  // Function to handle name selection
  const handleNameChange = (e, index) => {
    const selectedName = e.target.value;
    const prevName = rows[index].name;

    // If the name is changed (not just cleared), update the selected names array
    if (selectedName && selectedName !== prevName) {
      setSelectedNames((prevNames) => {
        // Add the new name to the selected names if it's not already selected
        return [...prevNames.filter((name) => name !== prevName), selectedName];
      });
    } else if (!selectedName) {
      // If the name is cleared (i.e., selectedName is ""), remove it from the selected names
      setSelectedNames((prevNames) => prevNames.filter((name) => name !== prevName));
    }

    // Update the selected name for the current row
    handleRowChange(e, index, "name");
  };

  return (
    <div className="input-box-2">
      <h3 className="font-fam-labels">
        Document Signatures <span className="required-field">*</span>
      </h3>
      <table className="vcr-table-2 font-fam table-borders">
        <thead className="cp-table-header">
          <tr>
            <th className="font-fam cent">Authorizations</th>
            <th className="font-fam cent">Name</th>
            <th className="font-fam cent">Position</th>
            <th className="font-fam cent col-sig-act"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <select
                  className="table-control font-fam"
                  value={row.auth}
                  onChange={(e) => handleRowChange(e, index, "auth")}
                >
                  <option value="Author">Author</option>
                  <option value="Approver">Approver</option>
                  <option value="Reviewer">Reviewer</option>
                </select>
              </td>
              <td>
                <select
                  className="table-control font-fam"
                  value={row.name}
                  onChange={(e) => handleNameChange(e, index)}
                >
                  <option value="">Select Name</option>
                  {["Abel Moetji", "Andre Coetzee", "Anzel Swanepoel", "Quintin Coetzee", "Rossouw Snyders", "Willem Harmse"]
                    .filter((name) => !selectedNames.includes(name) || name === row.name) // Exclude already selected names, but allow the current name to stay
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="table-control font-fam"
                  value={row.pos}
                  readOnly
                />
              </td>
              <td>
                <button
                  className="remove-row-button font-fam"
                  onClick={() => {
                    // Remove the name from selected names when a row is removed
                    setSelectedNames((prevNames) => prevNames.filter((name) => name !== row.name));
                    removeRow(index);
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="add-row-button font-fam" onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
};

export default DocumentSignaturesTable;
