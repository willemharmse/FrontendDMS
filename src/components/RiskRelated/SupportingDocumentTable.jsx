import React, { useRef, useState } from "react";
import "./SupportingDocumentTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SupportingDocumentTable = ({ formData, setFormData }) => {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const handleFileChange = (event) => {
        const selected = Array.from(event.target.files);
        const newFiles = selected.map((file, index) => ({
            nr: formData.supportingDocuments.length + index + 1,
            name: file.name,
            file: file,
            note: ""
        }));

        const updatedFiles = [...formData.supportingDocuments, ...newFiles];
        setFormData({
            ...formData,
            supportingDocuments: updatedFiles,
        });
        setSelectedFiles(updatedFiles);
    };

    const handleRemoveFile = (indexToRemove) => {
        const updatedDocuments = formData.supportingDocuments.filter((_, i) => i !== indexToRemove);
        const reIndexed = updatedDocuments.map((doc, i) => ({ ...doc, nr: i + 1 }));

        setFormData({
            ...formData,
            supportingDocuments: reIndexed,
        });
        setSelectedFiles(reIndexed);
    };

    const handleNoteChange = (index, newNote) => {
        const updated = formData.supportingDocuments.map((doc, i) =>
            i === index
                ? { ...doc, note: newNote }
                : doc
        );
        setFormData({
            ...formData,
            supportingDocuments: updated
        });
        setSelectedFiles(updated);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <button className="top-left-button-refs" title="Information">
                    <FontAwesomeIcon icon={faInfoCircle} className="icon-um-search" />
                </button>

                <h3 className="font-fam-labels">Supporting Documents</h3>

                {selectedFiles.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="refColCen refNum">Nr</th>
                                <th className="refColCen refRef">Document Name</th>
                                <th className="refColCen refRef">Notes</th>
                                <th className="refColCen refBut">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.supportingDocuments.map((row, index) => (
                                <tr key={index}>
                                    <td className="refCent">{row.nr}</td>
                                    <td className="refCent">{removeFileExtension(row.name)}</td>
                                    <td className="refCent">
                                        <input
                                            type="text"
                                            style={{ color: "black", cursor: "text" }}
                                            className="ibra-popup-page-input-table ibra-popup-page-row-input"
                                            placeholder="Enter Additional Notes"
                                            value={row.note}
                                            onChange={e => handleNoteChange(index, e.target.value)}
                                        />
                                    </td>
                                    <td className="ref-but-row procCent">
                                        <button className="remove-row-button" onClick={() => handleRemoveFile(index)}>
                                            <FontAwesomeIcon icon={faTrash} title="Remove File" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <input
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <button className="add-row-button-ref" onClick={() => fileInputRef.current.click()}>
                    Select
                </button>
            </div>
        </div>
    );
};

export default SupportingDocumentTable;
