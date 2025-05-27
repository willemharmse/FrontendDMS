import React, { useState, useEffect, useRef } from "react";
import "./AttendanceTable.css";
import "../CreatePage/ReferenceTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faInfoCircle, faPlusCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
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

    const fetchAuthors = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/stk`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setAuthors(data.stakeholders);
        } catch (error) {
            console.error("Error fetching authors:", error);
        }
    };

    const fetchDesignations = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreateVals/des`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setDesignations(data.designations);
        } catch (error) {
            console.error("Error fetching designations:", error);
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
        fetchDesignations();
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
            ).slice(0, 15);

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
                designation.designation.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 15);

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
            ).slice(0, 15);

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
            ).slice(0, 15);

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
                designation.designation.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 15);

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
            ).slice(0, 15);

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
        const updatedRow = { ...rows[index], [field]: value };
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
                    Attendance Register <span className="required-field">*</span>
                </h3>
                <button
                    className="top-right-button-ar"
                    title="Generate Attendance Register"
                    onClick={generateAR}
                >
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>

                <table className="vcr-table-2 font-fam table-borders">
                    <thead className="cp-table-header">
                        <tr>
                            <th className="font-fam cent">Nr</th>
                            <th className="font-fam cent">Name & Surname</th>
                            <th className="font-fam cent">Company/Site</th>
                            <th className="font-fam cent">Company Number</th>
                            <th className="font-fam cent">Designation</th>
                            <th className="font-fam cent col-sig-act">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={index}>
                                <td className="cent">{index + 1}</td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.name || ""}
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
                                        onChange={(e) => handleInputChange(index, "site", e)}
                                        placeholder="Enter company/site"
                                        ref={(el) => (inputRefs.current[`site-${index}`] = el)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="table-control font-fam"
                                        value={row.num || ""}
                                        onChange={(e) => handleInputChange(index, "num", e)}
                                        placeholder="Enter company number"
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
                                        ref={(el) => (inputRefs.current[`designation-${index}`] = el)}
                                    />
                                </td>
                                <td className="procCent action-cell">
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
                    {filteredDesignationOptions[showDropdown].map((designation, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, "designation", designation.designation)}>
                            {designation.designation}
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
                    {filteredCompanyOptions[showDropdown].map((company, i) => (
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