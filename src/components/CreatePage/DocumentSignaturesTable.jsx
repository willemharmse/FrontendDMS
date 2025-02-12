import React, { useState } from "react";
import "./DocumentSignaturesTable.css";

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow }) => {
  // Define separate name lists for each authorization type
  const nameLists = {
    Approver: ["Quintin Coetzee", "Rossouw Snyders", "Phil Johnson", "Colbert Smith", "Sizwe Dlamini", "Ernest Van Der Merwe", "Jacqualine Botha", "Simon Mbedzi", "Tshidi Molea", "Bryan Singo"],
    Author: [],  // Placeholder
    Reviewer: ["Anzel Swanepoel", "Andre Coetzee", "Abel Moetji"],
  };

  // Copy the Approver array into Author
  nameLists.Author = [...nameLists.Approver];
  nameLists.Author.push(...nameLists.Reviewer);
  nameLists.Reviewer.push(...nameLists.Approver);

  const [selectedNamesByAuth, setSelectedNamesByAuth] = useState({
    Author: [],
    Approver: [],
    Reviewer: [],
  });

  // Function to handle name selection
  const handleNameChange = (e, index) => {
    const selectedName = e.target.value;
    const prevName = rows[index].name;
    const authType = rows[index].auth;

    setSelectedNamesByAuth((prev) => {
      const updatedAuthNames = { ...prev };

      // Remove the previous name if it exists
      if (prevName) {
        updatedAuthNames[authType] = updatedAuthNames[authType].filter((name) => name !== prevName);
      }

      // Add the new name if it's not empty
      if (selectedName) {
        updatedAuthNames[authType] = [...updatedAuthNames[authType], selectedName];
      }

      return updatedAuthNames;
    });

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
                  {nameLists[row.auth] // Get the correct name list based on the auth type
                    .filter(
                      (name) =>
                        !selectedNamesByAuth[row.auth]?.includes(name) || name === row.name
                    ) // Allow current row's name but exclude already selected ones
                    .sort() // Sort alphabetically
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
                    setSelectedNamesByAuth((prev) => ({
                      ...prev,
                      [row.auth]: prev[row.auth].filter((name) => name !== row.name),
                    }));
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
