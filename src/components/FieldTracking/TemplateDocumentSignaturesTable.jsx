import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

const TemplateDocumentSignaturesTable = ({
  rows,
  handleRowChange,
  addRow,
  removeRow,
  error,
  updateRows,
  setErrors,
  readOnly = false
}) => {
  const [nameLists, setNameLists] = useState([]);
  const [posLists, setPosLists] = useState([]);
  const [nameToPositionMap, setNameToPositionMap] = useState({});
  const [users, setUsers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedNames, setSelectedNames] = useState(new Set()); // usernames

  // floating dropdown state
  const [showNameDropdown, setShowNameDropdown] = useState(null);
  const [filteredNameOptions, setFilteredNameOptions] = useState({});
  const [showPosDropdown, setShowPosDropdown] = useState(null);
  const [filteredPosOptions, setFilteredPosOptions] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // refs for inputs
  const nameInputRefs = useRef([]);
  const posInputRefs = useRef([]);

  const closeDropdowns = () => {
    setShowNameDropdown(null);
    setShowPosDropdown(null);
  };

  const usernameOptions = useMemo(() => {
    const list = attendees
      .map(a => a.name)
      .filter(Boolean);

    return Array.from(new Set(list)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [attendees]);

  const userNameOptions = useMemo(() => {
    const list = users
      .map(u => (u.username ?? "").trim())
      .filter(Boolean);

    return Array.from(new Set(list)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [users]);

  const positionOptions = useMemo(() => {
    const list = attendees
      .map(a => (a.pos ?? "").trim())
      .filter(Boolean);

    return Array.from(new Set(list)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [attendees]);

  const getUsedNamesForAuth = (auth, excludeIndex) => {
    const used = new Set();

    rows.forEach((r, i) => {
      if (i === excludeIndex) return;
      if ((r?.auth ?? "") !== auth) return;

      const n = (r?.name ?? "").trim();
      if (n) used.add(n);
    });

    return used;
  };

  useEffect(() => {
    const popupSelector = '.floating-dropdown';

    const handleClickOutside = (e) => {
      const outside =
        !e.target.closest(popupSelector) &&
        !e.target.closest('input');
      if (outside) {
        closeDropdowns();
      }
    };

    const handleScroll = (e) => {
      const isInsidePopup = e.target.closest(popupSelector);
      if (!isInsidePopup) {
        closeDropdowns();
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    const closeDropdowns = () => {
      setShowNameDropdown(null);
      setShowPosDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showNameDropdown, showPosDropdown]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, stkRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_URL}/api/user/`),
          axios.get(`${process.env.REACT_APP_URL}/api/riskInfo/stk`),
        ]);

        const users = userRes.data.users || [];
        const stakeholders = stkRes.data.stakeholders || [];

        const userAttendees = users.map(u => ({
          kind: "user",
          id: u._id,
          name: (u.username ?? "").trim(),
          pos: (u.designation ?? "").trim(),
        }));

        const stakeholderAttendees = stakeholders.map(s => ({
          kind: "stakeholder",
          id: s._id,
          name: (s.name ?? "").trim(),
          pos: (s.pos ?? "").trim(),
        }));

        const combined = [...userAttendees, ...stakeholderAttendees]
          .filter(a => a.name)
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

        setUsers(users);          // keep if you still use it elsewhere
        setAttendees(combined);

        localStorage.setItem("cachedNameLists", JSON.stringify({ users, stakeholders }));
      } catch (e) {
        const cached = localStorage.getItem("cachedNameLists");
        if (cached) {
          const { users = [], stakeholders = [] } = JSON.parse(cached);

          const combined = [
            ...users.map(u => ({
              kind: "user",
              id: u._id,
              name: (u.username ?? "").trim(),
              pos: (u.designation ?? "").trim(),
            })),
            ...stakeholders.map(s => ({
              kind: "stakeholder",
              id: s._id,
              name: (s.name ?? "").trim(),
              pos: (s.pos ?? "").trim(),
            })),
          ]
            .filter(a => a.name)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

          setUsers(users);
          setAttendees(combined);
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

  const openNameDropdown = (index) => {
    if (readOnly) return;

    const auth = rows[index]?.auth;
    const usedInCategory = getUsedNamesForAuth(auth, index);
    const currentName = (rows[index]?.name ?? "").trim();
    const typed = currentName.toLowerCase();

    const opts = usernameOptions
      .filter(n => (!usedInCategory.has(n) || n === currentName))
      .filter(n => n.toLowerCase().includes(typed));

    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]); // ✅ positions the floating dropdown
    setShowNameDropdown(index);
    setShowPosDropdown(null);
  };

  const handleNameInputChange = (index, value) => {
    // update name
    handleRowChange({ target: { value } }, index, "name");

    const matched = attendees.find(a => a.name === value);
    handleRowChange({ target: { value: matched?.pos ?? "" } }, index, "pos")

    setErrors?.(prev => ({ ...prev, signs: false }));

    // filter dropdown results
    const auth = rows[index]?.auth;
    const usedInCategory = getUsedNamesForAuth(auth, index);
    const lower = (value ?? "").toLowerCase();

    const opts = usernameOptions.filter(n =>
      n.toLowerCase().includes(lower) &&
      (!usedInCategory.has(n) || n === rows[index].name)
    );

    setFilteredNameOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(nameInputRefs.current[index]);
    setShowNameDropdown(index);
    setShowPosDropdown(null);
  };

  const handleSelectName = (index, name) => {
    const auth = rows[index]?.auth;
    const usedInCategory = getUsedNamesForAuth(auth, index);

    if (name && usedInCategory.has(name)) {
      setShowNameDropdown(null);
      return;
    }

    const matched = attendees.find(a => (a.name ?? "") === name);
    if (matched?.pos) {
      handleRowChange({ target: { value: matched.pos } }, index, "pos");
    }
    handleRowChange({ target: { value: name } }, index, "name");

    setShowNameDropdown(null);
  };

  // —— Position handlers —— //

  const openPosDropdown = (index, all = false) => {
    if (readOnly) return;
    closeDropdowns();
    const base = positionOptions
      .filter(p => p?.trim() !== "");
    const opts = base;
    setErrors(prev => ({
      ...prev,
      signs: false
    }));

    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);
  };

  const handlePosInputChange = (index, value) => {
    handleRowChange({ target: { value } }, index, "pos");
    const opts = positionOptions
      .filter(p => p.toLowerCase().includes(value.toLowerCase()));

    setErrors(prev => ({
      ...prev,
      signs: false
    }));
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
    <div className="input-row" style={{ marginBottom: "10px" }}>
      <div className={`input-box-2 ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Template Approvals <span className="required-field">*</span>
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent">Authorisation</th>
              <th className="font-fam cent">Name</th>
              <th className="font-fam cent">Position</th>
              {!readOnly && (<th className="font-fam cent col-sig-act">Action</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <div className="jra-info-popup-page-select-container">
                    <select
                      className="table-control font-fam remove-default-styling"
                      value={row.auth}
                      style={{ fontSize: "14px", color: "black" }}
                      onChange={e => handleRowChange(e, index, "auth")}
                      disabled={readOnly}
                    >
                      <option value="Author">Author</option>
                      <option value="Approver">Approver</option>
                      <option value="Reviewer">Reviewer</option>
                    </select>
                  </div>
                </td>
                <td>
                  <div className="jra-info-popup-page-select-container">
                    <select
                      style={{ fontSize: "14px" }}
                      className="table-control font-fam remove-default-styling"
                      value={row.name || ""}
                      onChange={(e) => handleSelectName(index, e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="">Select Name</option>

                      {Array.from(
                        new Set([
                          ...(userNameOptions || []),        // users only
                          ...(row.name ? [row.name] : []),   // keep old saved value
                        ])
                      )
                        .filter((name) => {
                          const usedInCategory = getUsedNamesForAuth(row.auth, index);
                          return !usedInCategory.has(name) || name === row.name;
                        })
                        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.pos}
                    style={{ fontSize: "14px" }}
                    onChange={e => handlePosInputChange(index, e.target.value)}
                    onFocus={() => openPosDropdown(index, true)}
                    ref={el => (posInputRefs.current[index] = el)}
                    readOnly={readOnly}
                  />
                </td>
                {!readOnly && (<td className="procCent action-cell-auth-risk ">
                  <button
                    className="remove-row-button font-fam"
                    onClick={() => {
                      removeRow(index);
                    }}

                    style={{ fontSize: "14px" }}
                    title="Remove Row"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    className="insert-row-button-sig-risk font-fam"
                    onClick={() => insertRowAt(index + 1)}
                    title="Add Row"
                    style={{ fontSize: "15px" }}
                  >
                    <FontAwesomeIcon icon={faPlusCircle} />
                  </button>
                </td>)}
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

export default TemplateDocumentSignaturesTable;
