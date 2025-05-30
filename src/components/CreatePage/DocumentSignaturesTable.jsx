import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./DocumentSignaturesTable.css";
// bring in floating-dropdown styles
import "./ReferenceTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

const DocumentSignaturesTable = ({
  rows,
  handleRowChange,
  addRow,
  removeRow,
  error,
  updateRows
}) => {
  const [nameLists, setNameLists] = useState([]);
  const [posLists, setPosLists] = useState([]);
  const [nameToPositionMap, setNameToPositionMap] = useState({});
  const [selectedNames, setSelectedNames] = useState(new Set());

  // floating dropdown state
  const [showNameDropdown, setShowNameDropdown] = useState(null);
  const [filteredNameOptions, setFilteredNameOptions] = useState({});
  const [showPosDropdown, setShowPosDropdown] = useState(null);
  const [filteredPosOptions, setFilteredPosOptions] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // refs for inputs
  const nameInputRefs = useRef([]);
  const posInputRefs = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
        const data = res.data.stakeholders;
        // names list + map
        const positionMap = {};
        data.forEach(({ name, pos }) => positionMap[name] = pos);
        // unique positions
        const positions = Array.from(new Set(data.map(d => d.pos))).sort();

        localStorage.setItem('cachedNameLists', JSON.stringify({ data, positionMap }));
        setNameLists(data.map(d => d.name).sort());
        setPosLists(positions);
        setNameToPositionMap(positionMap);
      } catch {
        const cached = localStorage.getItem('cachedNameLists');
        if (cached) {
          const { data, positionMap } = JSON.parse(cached);
          setNameLists(data.map(d => d.name).sort());
          setPosLists(Array.from(new Set(data.map(d => d.pos))).sort());
          setNameToPositionMap(positionMap || {});
        }
      }
    };
    fetchData();
  }, []);

  const insertRowAt = (insertIndex) => {
    const newSignatures = [...rows];
    const type = newSignatures[insertIndex - 1].auth;
    const newRow = { auth: type, name: "", pos: "", num: 1 };
    newSignatures.splice(insertIndex, 0, newRow);
    updateRows(newSignatures);
  };

  // —— Name handlers —— //

  const openNameDropdown = (index, all = false) => {
    const base = all
      ? nameLists
      : nameLists.filter(n => !selectedNames.has(n) || n === rows[index].name);
    const opts = base.slice(0, 15);
    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
  };

  const handleNameInputChange = (index, value) => {
    // update row name immediately
    handleRowChange({ target: { value } }, index, "name");
    // auto-fill pos
    handleRowChange(
      { target: { value: nameToPositionMap[value] || "" } },
      index,
      "pos"
    );
    // filter dropdown
    const opts = nameLists
      .filter(n =>
        n.toLowerCase().includes(value.toLowerCase()) &&
        (!selectedNames.has(n) || n === rows[index].name)
      )
      .slice(0, 15);
    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
  };

  const handleSelectName = (index, name) => {
    const prev = rows[index].name;
    setSelectedNames(s => {
      const copy = new Set(s);
      if (prev) copy.delete(prev);
      copy.add(name);
      return copy;
    });
    // finalize name and auto-pos
    handleRowChange({ target: { value: name } }, index, "name");
    handleRowChange(
      { target: { value: nameToPositionMap[name] || "" } },
      index,
      "pos"
    );
    setShowNameDropdown(null);
  };

  // —— Position handlers —— //

  const openPosDropdown = (index, all = false) => {
    const base = all ? posLists : posLists;
    const opts = base.slice(0, 15);
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handlePosInputChange = (index, value) => {
    handleRowChange({ target: { value } }, index, "pos");
    const opts = posLists
      .filter(p => p.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 15);
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handleSelectPos = (index, pos) => {
    handleRowChange({ target: { value: pos } }, index, "pos");
    setShowPosDropdown(null);
  };

  // compute dropdown coords
  const positionDropdown = (inputEl) => {
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  return (
    <div className="input-row">
      <div className={`input-box-2 ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Document Signatures <span className="required-field">*</span>
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent">Authorisation</th>
              <th className="font-fam cent">Name</th>
              <th className="font-fam cent">Position</th>
              <th className="font-fam cent col-sig-act">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <select
                    className="table-control font-fam"
                    value={row.auth}
                    onChange={e => handleRowChange(e, index, "auth")}
                  >
                    <option value="Author">Author</option>
                    <option value="Approver">Approver</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.name}
                    onChange={e => handleNameInputChange(index, e.target.value)}
                    onFocus={() => openNameDropdown(index, true)}
                    onBlur={() => setTimeout(() => setShowNameDropdown(null), 200)}
                    ref={el => (nameInputRefs.current[index] = el)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.pos}
                    onChange={e => handlePosInputChange(index, e.target.value)}
                    onFocus={() => openPosDropdown(index, true)}
                    onBlur={() => setTimeout(() => setShowPosDropdown(null), 200)}
                    ref={el => (posInputRefs.current[index] = el)}
                  />
                </td>
                <td className="procCent action-cell">
                  <button
                    className="remove-row-button font-fam"
                    onClick={() => {
                      setSelectedNames(s => {
                        const copy = new Set(s);
                        copy.delete(row.name);
                        return copy;
                      });
                      removeRow(index);
                    }}
                    title="Remove Row"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    className="insert-row-button-sig font-fam"
                    onClick={() => insertRowAt(index + 1)}
                    title="Add row"
                  >
                    <FontAwesomeIcon icon={faPlusCircle} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Name dropdown */}
        {showNameDropdown !== null && filteredNameOptions[showNameDropdown]?.length > 0 && (
          <ul
            className="floating-dropdown"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {filteredNameOptions[showNameDropdown].map((n, i) => (
              <li key={i} onMouseDown={() => handleSelectName(showNameDropdown, n)}>
                {n}
              </li>
            ))}
          </ul>
        )}

        {/* Position dropdown */}
        {showPosDropdown !== null && filteredPosOptions[showPosDropdown]?.length > 0 && (
          <ul
            className="floating-dropdown"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            {filteredPosOptions[showPosDropdown].map((p, i) => (
              <li key={i} onMouseDown={() => handleSelectPos(showPosDropdown, p)}>
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentSignaturesTable;
