import React, { useState, useEffect, useRef } from "react";
import "./ReferenceTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

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
                localStorage.setItem('cachedRefOptions', JSON.stringify(data.files));
            } catch (error) {
                console.log(error);
                const cached = localStorage.getItem('cachedRefOptions');
                if (cached) {
                    setFiles(JSON.parse(cached));
                }
            }
        };
        fetchFiles();
    }, []);

    const handleInputChange = (index, field, value) => {
        updateRefRow(index, field, value);

        if (field === "ref") {
            const filtered = files
                .filter(file => file.fileName.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 15); // Show only top 5 results

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
                .slice(0, 15); // Show only top 10 results

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
            const matchedFile = files.find(file => file.fileName === value.toLowerCase());
            updateRefRow(index, "refDesc", matchedFile ? matchedFile.docID : ""); // If no match, keep it empty
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const handleSelectOption = (index, value) => {
        const selectedFile = files.find(file => removeFileExtension(file.fileName) === value);

        updateRefRow(index, "ref", value);

        // Set refDesc to the document ID if a file is selected, otherwise leave it empty
        updateRefRow(index, "refDesc", selectedFile ? selectedFile.docID : "");

        setShowDropdown(null);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <button
                    className="top-left-button-refs"
                    title="Information"
                >
                    <FontAwesomeIcon icon={faInfoCircle} className="icon-um-search" />
                </button>

                <h3 className="font-fam-labels">References</h3>
                {referenceRows.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="refColCen refNum">Nr</th>
                                <th className="refColCen refRef">Document Name</th>
                                <th className="refColCen refDocID">Document Reference</th>
                                <th className="refColCen refBut">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referenceRows.map((row, index) => (
                                <tr key={index}>
                                    <td className="refCent">{row.nr}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className="table-control"
                                            value={removeFileExtension(row.ref)}
                                            onChange={(e) => handleDescChange(index, "ref", e.target.value)}
                                            onFocus={() => {
                                                setShowDropdown(index);
                                                setFilteredOptions(prev => ({ ...prev, [index]: files.slice(0, 15) }));

                                                // Ensure dropdown is positioned correctly on focus
                                                if (inputRefs.current[index]) {
                                                    const rect = inputRefs.current[index].getBoundingClientRect();
                                                    setDropdownPosition({
                                                        top: rect.bottom + window.scrollY + 5,
                                                        left: rect.left + window.scrollX,
                                                        width: rect.width,
                                                    });
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setShowDropdown(null), 200)}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="table-control"
                                            value={row.refDesc}
                                            onChange={(e) => handleInputChange(index, "refDesc", e.target.value)}
                                        />
                                    </td>
                                    <td className="ref-but-row procCent">
                                        <button className="remove-row-button" onClick={() => removeRefRow(index)}>
                                            <FontAwesomeIcon icon={faTrash} title="Remove Row" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {referenceRows.length === 0 && (
                    <button className="add-row-button-ref" onClick={addRefRow}>
                        Select
                    </button>
                )}

                {referenceRows.length > 0 && (
                    <button className="add-row-button-ref-plus" onClick={addRefRow}>
                        <FontAwesomeIcon icon={faPlusCircle} title="Add Row" />
                    </button>
                )}

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
                            <li key={i} onMouseDown={() => handleSelectOption(showDropdown, removeFileExtension(file.fileName))}>
                                {removeFileExtension(file.fileName)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ReferenceTable;
