import React, { useState, useEffect, useRef } from "react";
import "./Ref.css";

const ReferenceTable = ({ referenceRows, addRefRow, removeRefRow, updateRefRow }) => {
    const [files, setFiles] = useState([]);
    const [showDropdown, setShowDropdown] = useState(null);
    const [filteredOptions, setFilteredOptions] = useState({});
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const inputRefs = useRef([]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/file/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch files");
                }
                const data = await response.json();
                setFiles(data.files);
            } catch (error) {
                console.log(error);
            }
        };
        fetchFiles();
    }, []);

    const handleInputChange = (index, field, value) => {
        updateRefRow(index, field, value);

        if (field === "ref") {
            const filtered = files
                .filter(file => file.fileName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 10); // Show only top 5 results

            setFilteredOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[index]) {
                const rect = inputRefs.current[index].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }

            setShowDropdown(index);
        }
    };

    const handleDescChange = (index, field, value) => {
        updateRefRow(index, field, value);

        if (field === "ref") {
            const filtered = files
                .filter(file => file.fileName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 10); // Show only top 10 results

            setFilteredOptions(prev => ({ ...prev, [index]: filtered }));

            if (inputRefs.current[index]) {
                const rect = inputRefs.current[index].getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }

            setShowDropdown(index);

            // Check if the entered value exactly matches a file name
            const matchedFile = files.find(file => file.fileName === value);
            updateRefRow(index, "refDesc", matchedFile ? matchedFile.docID : ""); // If no match, keep it empty
        }
    };

    const handleSelectOption = (index, value) => {
        const selectedFile = files.find(file => file.fileName === value);

        updateRefRow(index, "ref", value);

        // Set refDesc to the document ID if a file is selected, otherwise leave it empty
        updateRefRow(index, "refDesc", selectedFile ? selectedFile.docID : "");

        setShowDropdown(null);
    };

    return (
        <div className="input-box-2">
            <h3 className="font-fam-labels">References</h3>
            <table className="vcr-table">
                <thead>
                    <tr>
                        <th>Nr</th>
                        <th>Reference</th>
                        <th>Document ID</th>
                        <th className="ref-but-row">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {referenceRows.map((row, index) => (
                        <tr key={index}>
                            <td>{row.nr}</td>
                            <td>
                                <input
                                    type="text"
                                    className="table-control"
                                    value={row.ref}
                                    onChange={(e) => handleDescChange(index, "ref", e.target.value)}
                                    onFocus={() => setShowDropdown(index)}
                                    onBlur={() => setTimeout(() => setShowDropdown(null), 200)}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                />
                            </td>
                            <td>
                                <input
                                    readOnly
                                    type="text"
                                    className="table-control"
                                    value={row.refDesc}
                                    onChange={(e) => handleInputChange(index, "refDesc", e.target.value)}
                                />
                            </td>
                            <td className="ref-but-row">
                                <button className="remove-row-button" onClick={() => removeRefRow(index)}>
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="add-row-button" onClick={addRefRow}>
                + Add Row
            </button>

            {/* Floating Dropdown */}
            {showDropdown !== null && filteredOptions[showDropdown]?.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                    }}
                >
                    {filteredOptions[showDropdown].map((file, i) => (
                        <li key={i} onMouseDown={() => handleSelectOption(showDropdown, file.fileName)}>
                            {file.fileName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ReferenceTable;
