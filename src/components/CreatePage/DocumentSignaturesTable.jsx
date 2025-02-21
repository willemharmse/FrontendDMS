import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DocumentSignaturesTable.css";

const DocumentSignaturesTable = ({ rows, handleRowChange, addRow, removeRow }) => {
  const [nameLists, setNameLists] = useState({
    Approver: [],
    Author: [],
    Reviewer: [],
  });

  const [selectedNames, setSelectedNames] = useState(new Set());

  const [nameToPositionMap, setNameToPositionMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsRes, approversRes, reviewersRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/auth`),
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/app`),
          axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/rev`),
        ]);

        const authors = authorsRes.data.authors.map((author) => ({
          name: author.author,
          position: author.pos,
        }));

        const approvers = approversRes.data.approvers.map((approver) => ({
          name: approver.approver,
          position: approver.pos,
        }));

        const reviewers = reviewersRes.data.reviewers.map((reviewer) => ({
          name: reviewer.reviewer,
          position: reviewer.pos,
        }));

        // Create a mapping of names to positions
        const positionMap = {};
        [...authors, ...approvers, ...reviewers].forEach(({ name, position }) => {
          positionMap[name] = position;
        });

        setNameLists({
          Approver: approvers.map((a) => a.name),
          Author: authors.map((a) => a.name),
          Reviewer: reviewers.map((a) => a.name),
        });

        setNameToPositionMap(positionMap);
      } catch (error) {
        console.error("Error fetching names:", error);
      }
    };

    fetchData();
  }, []);

  const [selectedNamesByAuth, setSelectedNamesByAuth] = useState({
    Author: [],
    Approver: [],
    Reviewer: [],
  });

  const handleNameChange = (e, index) => {
    const selectedName = e.target.value;
    const prevName = rows[index].name;

    setSelectedNames((prev) => {
      const updatedNames = new Set(prev);
      if (prevName) updatedNames.delete(prevName);
      if (selectedName) updatedNames.add(selectedName);
      return updatedNames;
    });

    handleRowChange(e, index, "name");

    // Update position based on the selected name
    handleRowChange({ target: { value: nameToPositionMap[selectedName] || "" } }, index, "pos");
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
                  {nameLists[row.auth]
                    .filter((name) => !selectedNames.has(name) || name === row.name)
                    .sort()
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
                    setSelectedNames((prev) => {
                      const updatedNames = new Set(prev);
                      updatedNames.delete(row.name);
                      return updatedNames;
                    });
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
