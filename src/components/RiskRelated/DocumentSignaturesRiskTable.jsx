import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./DocumentSignaturesRiskTable.css";
// reuse the floating-dropdown styles
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import RiskAssessmentItemsDelete from "./RiskAssessmentItemsDelete";

const DocumentSignaturesRiskTable = ({
  rows,
  handleRowChange,
  addRow,
  removeRow,
  error,
  updateRows,
  setErrors,
  readOnly = false
}) => {
  const [users, setUsers] = useState([]);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [attendees, setAttendees] = useState([]); // users + stakeholders

  // floating dropdown state
  const [showNameDropdown, setShowNameDropdown] = useState(null);
  const [filteredNameOptions, setFilteredNameOptions] = useState({});
  const [showPosDropdown, setShowPosDropdown] = useState(null);
  const [filteredPosOptions, setFilteredPosOptions] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // refs to compute dropdown position
  const nameInputRefs = useRef([]);
  const posInputRefs = useRef([]);

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
    const authType = newSignatures[insertIndex - 1].auth;
    newSignatures.splice(insertIndex, 0, {
      auth: authType,
      name: "",
      pos: "",
      num: 1,
    });
    updateRows(newSignatures);
  };

  // position the floating dropdown under a given input ref
  const positionDropdown = (inputEl) => {
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  };

  // —— Name dropdown handlers —— //

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

    // auto-fill position from selected username (exact match)
    const matched = attendees.find(a => a.name === value);
    handleRowChange({ target: { value: matched?.pos ?? "" } }, index, "pos");

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

  // —— Position dropdown handlers —— //

  const openPosDropdown = (index) => {
    if (readOnly) return;
    closeDropdowns();
    const base = positionOptions
      .filter(p => p?.trim() !== "");
    const opts = base;
    setFilteredPosOptions(prev => ({ ...prev, [index]: opts }));
    positionDropdown(posInputRefs.current[index]);
    setShowPosDropdown(index);

    setErrors(prev => ({
      ...prev,
      signs: false
    }));
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

  // These auth types must always have at least one row present
  const REQUIRED_AUTH_TYPES = ["Facilitator", "Owner", "Reviewer", "Approver"];

  const canRemoveRow = (idx) => {
    const auth = rows[idx]?.auth;
    if (!REQUIRED_AUTH_TYPES.includes(auth)) return true;

    const countForAuth = rows.filter(r => r.auth === auth).length;
    return countForAuth > 1;
  };

  useEffect(() => {
    const popupSelector = '.floating-dropdown';

    const handleClickOutside = e => {
      const outside =
        !e.target.closest(popupSelector) &&
        !e.target.closest('input');
      if (outside) {
        closeDropdowns();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    const handleScroll = e => {
      const isInsidePopup = e.target.closest(popupSelector);
      if (!isInsidePopup) {
        closeDropdowns();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
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

  return (
    <div className="input-row">
      <div className={`input-box-sig-risk ${error ? "error-sign" : ""}`}>
        <h3 className="font-fam-labels">
          Authorisations <span className="required-field">*</span>
        </h3>
        <table className="vcr-table-2 font-fam table-borders">
          <thead className="cp-table-header">
            <tr>
              <th className="font-fam cent col-sig-auth-risk">Authorisation</th>
              <th className="font-fam cent col-sig-name-risk">Name</th>
              <th className="font-fam cent col-sig-pos-risk">Position</th>
              {!readOnly && (<th className="font-fam cent col-sig-act-risk">Action</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <div className="jra-info-popup-page-select-container">
                    <select
                      className="table-control font-fam remove-default-styling"
                      value={row.auth}
                      onChange={e => handleRowChange(e, idx, "auth")}
                      style={{ fontSize: "14px", color: "black" }}
                      disabled={readOnly}
                    >
                      <option value="Approver">Approver</option>
                      <option value="Facilitator">Facilitator</option>
                      <option value="Owner">Owner</option>
                      <option value="Reviewer">Reviewer</option>
                    </select>
                  </div>
                </td>
                <td>
                  {row.auth === "Approver" || row.auth === "Reviewer" ? (

                    <div className="jra-info-popup-page-select-container">
                      <select
                        className="table-control font-fam remove-default-styling"
                        value={row.name || ""}
                        onChange={(e) => handleSelectName(idx, e.target.value)}
                        disabled={readOnly}
                        style={{ fontSize: "14px" }}
                      >
                        <option value="">Select Name</option>

                        {Array.from(
                          new Set([
                            ...(userNameOptions || []),        // users only
                            ...(row.name ? [row.name] : []),   // keep old saved value
                          ])
                        )
                          .filter((name) => {
                            const usedInCategory = getUsedNamesForAuth(row.auth, idx);
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
                  ) : (
                    // ✅ KEEP INPUT FOR AUTHOR
                    <input
                      className="table-control font-fam"
                      value={row.name}
                      style={{ fontSize: "14px" }}
                      onChange={e => handleNameInputChange(idx, e.target.value)}
                      onFocus={() => openNameDropdown(idx, true)}
                      ref={el => (nameInputRefs.current[idx] = el)}
                      readOnly={readOnly}
                      placeholder="Insert or Select Name"
                    />
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    className="table-control font-fam"
                    value={row.pos}
                    style={{ fontSize: "14px" }}
                    onFocus={() => openPosDropdown(idx)}
                    onChange={e => handlePosInputChange(idx, e.target.value)}
                    ref={el => (posInputRefs.current[idx] = el)}
                    readOnly={readOnly}
                  />
                </td>
                {!readOnly && (<td className="procCent action-cell-auth-risk ">
                  <button
                    className="remove-row-button font-fam"
                    onClick={() => {
                      if (!canRemoveRow(idx)) return;
                      setConfirmDeleteIndex(idx);
                    }}
                    disabled={!canRemoveRow(idx)}
                    style={{
                      fontSize: "14px",
                      opacity: canRemoveRow(idx) ? 1 : 0.4,
                      cursor: canRemoveRow(idx) ? "pointer" : "not-allowed"
                    }}
                    title={canRemoveRow(idx) ? "Remove Row" : `At least one ${row.auth} row is required`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button
                    className="insert-row-button-sig-risk font-fam"
                    onClick={() => insertRowAt(idx + 1)}
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
              width: dropdownPosition.width,
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

        {confirmDeleteIndex != null && (
          <RiskAssessmentItemsDelete
            closeModal={() => setConfirmDeleteIndex(null)}
            type="Authorisation"
            removeRow={() => {
              removeRow(confirmDeleteIndex);
              setConfirmDeleteIndex(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentSignaturesRiskTable;