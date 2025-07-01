import React, { useState, useEffect, useRef } from "react";
import "./AttendanceTable.css";
import "../CreatePage/ReferenceTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faInfoCircle, faPlusCircle, faTableColumns, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";

const AttendanceTable = ({ rows = [], addRow, removeRow, error, updateRows, generateAR }) => {
    const [designations, setDesignations] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [filteredAuthorOptions, setFilteredAuthorOptions] = useState({});
    const [filteredDesignationOptions, setFilteredDesignationOptions] = useState({});
    const [filteredCompanyOptions, setFilteredCompanyOptions] = useState({});
    const [showDropdown, setShowDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [activeField, setActiveField] = useState(null); // Track which field (name or designation)
    const inputRefs = useRef({});
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const popupRef = useRef(null);
    const [nameToPositionMap, setNameToPositionMap] = useState({});

    const availableColumns = [
        { id: "nr", title: "Nr" },
        { id: "name", title: "Name & Surname" },
        { id: "site", title: "Company/Site" },
        { id: "attendance", title: "Attendance" },
        { id: "designation", title: "Designation" },
        { id: "num", title: "Company/ ID Number" },
        { id: "action", title: "Action" },
    ];

    useEffect(() => {
        const popupSelector = '.floating-dropdown';
        const columnSelector = '.column-selector-popup';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest(columnSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector) || e.target.closest(columnSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }
        };

        const closeDropdowns = () => {
            setShowDropdown(null);
            setShowColumnSelector(null);

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showDropdown, showColumnSelector]);

    const toggleColumn = (columnId) => {
        setShowColumns(prev => {
            if (prev.includes(columnId)) {
                if (columnId === 'action' || columnId === 'nr') return prev;
                return prev.filter(id => id !== columnId);
            } else {
                const actionIndex = prev.indexOf('action');
                if (actionIndex !== -1) {
                    return [...prev.slice(0, actionIndex), columnId, ...prev.slice(actionIndex)];
                } else {
                    return [...prev, columnId];
                }
            }
        });
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            const allColumns = availableColumns
                .map(col => col.id)
                .filter(id => id !== 'action');
            setShowColumns([...allColumns, 'action',]);
        } else {
            setShowColumns(['nr', 'action', 'attendance', 'name', 'site', 'designation']);
        }
    };

    const areAllColumnsSelected = () => {
        const selectableColumns = availableColumns
            .filter(col => col.id !== 'action')
            .map(col => col.id);

        return selectableColumns.every(colId =>
            showColumns.includes(colId) || colId === 'nr'
        );
    };

    const [showColumns, setShowColumns] = useState([
        "nr", "name", "site", "designation", "attendance", "action",
    ]);

    const fetchAuthors = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();

            const positionMap = {};
            data.stakeholders.forEach(({ name, pos }) => {
                positionMap[name] = pos;
            });
            setNameToPositionMap(positionMap);

            const positions = Array.from(new Set(data.stakeholders.map(d => d.pos))).sort();
            setDesignations(positions);
            setAuthors(data.stakeholders);
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    };

    const fetchSites = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/sites`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setCompanies(data.sites.map(s => s.site));
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    useEffect(() => {
        fetchAuthors();
        fetchSites();
    }, []);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown !== null &&
                !event.target.closest('.floating-dropdown') &&
                !event.target.closest('input')) {
                setTimeout(() => setShowDropdown(null), 200);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const handleInputChange = (index, field, e) => {
        const value = e.target.value;

        // Update the row data
        const updatedRow = { ...rows[index], [field]: value };
        const newRows = [...rows];
        newRows[index] = updatedRow;
        updateRows(newRows);

        // Update filtered options and show dropdown
        if (field === "name") {
            const filtered = authors.filter(author =>
                author.name.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredAuthorOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("name");

            if (inputRefs.current[`name-${index}`]) {
                const rect = inputRefs.current[`name-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "designation") {
            const filtered = designations.filter(designation =>
                designation.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredDesignationOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("designation");

            if (inputRefs.current[`designation-${index}`]) {
                const rect = inputRefs.current[`designation-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "site") { // For company/site field
            const filtered = companies.filter(company =>
                company.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredCompanyOptions(prev => ({ ...prev, [index]: filtered }));
            setActiveField("site");

            if (inputRefs.current[`site-${index}`]) {
                const rect = inputRefs.current[`site-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }
    };

    const handleFocus = (index, field) => {
        setActiveField(field);

        if (field === "name") {
            // Show all authors or filtered options on focus
            const value = rows[index].name || "";
            const filtered = authors.filter(author =>
                author.name.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredAuthorOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`name-${index}`]) {
                const rect = inputRefs.current[`name-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "designation") {
            // Show all designations or filtered options on focus
            const value = rows[index].designation || "";
            const filtered = designations.filter(designation =>
                designation.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredDesignationOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`designation-${index}`]) {
                const rect = inputRefs.current[`designation-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }

        if (field === "site") { // For company/site field
            const value = rows[index].site || "";
            const filtered = companies.filter(company =>
                company.toLowerCase().includes(value.toLowerCase())
            );

            setFilteredCompanyOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[`site-${index}`]) {
                const rect = inputRefs.current[`site-${index}`].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
                setShowDropdown(index);
            }
        }
    };

    const handleSelectOption = (index, field, value) => {
        // start with whatever was in the row before...
        const updatedRow = { ...rows[index], [field]: value };

        // if the user just picked a name, auto‐populate designation
        if (field === "name") {
            // look up the title; if no match, fall back to empty string
            const title = nameToPositionMap[value] || "";

            if (index !== 0)
                updatedRow.designation = title;
        }

        const newRows = [...rows];
        newRows[index] = updatedRow;
        updateRows(newRows);
        setShowDropdown(null);
    };

    const insertRowAt = (insertIndex) => {
        const newRows = [...rows];
        const newRow = {
            name: "",
            site: "",
            num: "",
            designation: "",
        };
        newRows.splice(insertIndex, 0, newRow);
        updateRows(newRows);
    };

    return (
        <div className="input-row-risk-create">
            <div className={`input-box-attendance ${error ? "error-sign" : ""}`}>
                <h3 className="font-fam-labels">
                    Attendance Register
                </h3>
                <button
                    className="top-right-button-ar"
                    title="Show / Hide Columns"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                >
                    <FontAwesomeIcon icon={faTableColumns} className="icon-um-search" />
                </button>

                <button
                    className="top-right-button-ar-2"
                    title="Generate Attendance Register"
                    onClick={generateAR}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>

                {showColumnSelector && (
                    <div className="column-selector-popup" ref={popupRef}>
                        <div className="column-selector-header">
                            <h4>Select Columns</h4>
                            <button
                                className="close-popup-btn"
                                onClick={() => setShowColumnSelector(false)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="column-selector-content">
                            <p className="column-selector-note">Select columns to display</p>

                            <div className="select-all-container">
                                <label className="select-all-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={areAllColumnsSelected()}
                                        onChange={(e) => toggleAllColumns(e.target.checked)}
                                    />
                                    <span className="select-all-text">Select All</span>
                                </label>
                            </div>

                            <div className="column-checkbox-container">
                                {availableColumns.map(column => (
                                    <div className="column-checkbox-item" key={column.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={showColumns.includes(column.id)}
                                                disabled={column.id === 'action' || column.id === 'nr' || column.id === 'attendance' || column.id === 'name' || column.id === 'site' || column.id === 'designation'}
                                                onChange={() => toggleColumn(column.id)}
                                            />
                                            <span>{column.title}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="column-selector-footer">
                                <p>{showColumns.length - 1} columns selected</p>
                                <button
                                    className="apply-columns-btn"
                                    onClick={() => setShowColumnSelector(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <table className="vcr-table-2 font-fam table-borders">
                    <thead className="cp-table-header">
                        <tr>
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-nr` : `attend-nr`}`}>Nr</th>
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-name` : `attend-name-exp`}`}>Name & Surname</th>
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-comp` : `attend-comp-exp`}`}>Company/Site</th>
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-desg` : `attend-desg-exp`}`}>Designation</th>
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-pres` : `attend-pres-exp`}`}>Attendance</th>
                            {showColumns.includes("num") && (<th className="font-fam cent attend-id">Company / ID Number</th>)}
                            <th className={`font-fam cent ${!showColumns.includes("num") ? `attend-act` : `attend-act-exp`}`}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td className="cent" >{index + 1}</td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.name || ""}
                                        style={{ fontSize: "14px" }}
                                        onChange={(e) => handleInputChange(index, "name", e)}
                                        onFocus={() => handleFocus(index, "name")}
                                        placeholder="Enter or select name"
                                        ref={(el) => (inputRefs.current[`name-${index}`] = el)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.site || ""}
                                        onFocus={() => handleFocus(index, "site")}
                                        style={{ fontSize: "14px" }}
                                        onChange={(e) => handleInputChange(index, "site", e)}
                                        placeholder="Enter company/site"
                                        ref={(el) => (inputRefs.current[`site-${index}`] = el)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.designation || ""}
                                        onChange={(e) => handleInputChange(index, "designation", e)}
                                        onFocus={() => handleFocus(index, "designation")}
                                        placeholder="Enter or select designation"
                                        readOnly={index === 0}
                                        style={{ fontSize: "14px" }}
                                        ref={(el) => (inputRefs.current[`designation-${index}`] = el)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        className="checkbox-inp-attend"
                                        checked={row.presence === "Present"}
                                        onChange={(e) => {
                                            const updatedRow = {
                                                ...rows[index],
                                                presence: e.target.checked ? "Present" : "Absent"
                                            };
                                            const newRows = [...rows];
                                            newRows[index] = updatedRow;
                                            updateRows(newRows);
                                        }}
                                    />
                                </td>
                                {showColumns.includes("num") && (<td className="font-fam cent">
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.num || ""}
                                        style={{ fontSize: "14px" }}
                                        onChange={(e) => handleInputChange(index, "num", e)}
                                        placeholder="Enter company / ID number"
                                    />
                                </td>)}
                                <td className="procCent action-cell-auth-risk">
                                    <button
                                        className="remove-row-button font-fam"
                                        onClick={() => {
                                            if (index !== 0) { // Prevent removal of the first row
                                                removeRow(index);
                                            } else {
                                                toast.dismiss();
                                                toast.clearWaitingQueue();
                                                toast.warn("The Facilitator cannot be removed.", {
                                                    closeButton: false,
                                                    autoClose: 800,
                                                    style: {
                                                        textAlign: 'center'
                                                    }
                                                });
                                            }
                                        }}
                                        title="Remove Row"
                                        type="button"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                        className="insert-row-button-sig font-fam"
                                        onClick={() => insertRowAt(index + 1)}
                                        title="Add row"
                                        type="button"
                                        style={{ fontSize: "15px" }}
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Floating Dropdown - Rendered outside the table structure */}
            {showDropdown !== null && activeField === "name" && filteredAuthorOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredAuthorOptions[showDropdown].map((author, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "name", author.name)}>
                            {author.name}
                        </li>
                    ))}
                </ul>
            )}

            {showDropdown !== null && activeField === "designation" && filteredDesignationOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredDesignationOptions[showDropdown].filter(term => term && term.trim() !== "").map((designation, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "designation", designation)}>
                            {designation}
                        </li>
                    ))}
                </ul>
            )}

            {showDropdown !== null && activeField === "site" && filteredCompanyOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredCompanyOptions[showDropdown].sort().map((company, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "site", company)}>
                            {company}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AttendanceTable;