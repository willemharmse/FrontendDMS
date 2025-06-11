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

        const updatedFiles = [
            ...formData.supportingDocuments,
            ...selected.map((file, index) => ({
                nr: formData.supportingDocuments.length + index + 1,
                name: file.name,
                file,
                note: ""
            }))
        ];

        const existingRefs = formData.references || [];
        const newRefEntries = selected.map((file, index) => ({
            nr: existingRefs.length + index + 1,
            ref: file.name,
            refDesc: ""
        }));

        setFormData({
            ...formData,
            supportingDocuments: updatedFiles,
            references: [...existingRefs, ...newRefEntries]
        }
        );

        setSelectedFiles(updatedFiles);
    };

    const handleRemoveFile = (indexToRemove) => {
        const removedName = formData.supportingDocuments[indexToRemove].name;
        const updatedDocuments = formData.supportingDocuments
            .filter((_, i) => i !== indexToRemove)
            .map((doc, i) => ({ ...doc, nr: i + 1 }));

        const updatedRefs = (formData.references || [])
            .filter(entry => entry.ref !== removedName)
            .map((entry, i) => ({ ...entry, nr: i + 1 }));

        setFormData({
            ...formData,
            supportingDocuments: updatedDocuments,
            references: updatedRefs
        });

        setSelectedFiles(updatedDocuments);
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

                <h3 className="font-fam-labels">Supporting Documents</h3>

                {formData.supportingDocuments.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="refColCen refNum" style={{ width: "5%" }}>Nr</th>
                                <th className="refColCen refRef" style={{ width: "40%" }}>Document Name</th>
                                <th className="refColCen refRef" style={{ width: "50%" }}>How and Where Document Was Implemented</th>
                                <th className="refColCen refBut" style={{ width: "5%" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.supportingDocuments.map((row, index) => (
                                <tr key={index}>
                                    <td className="refCent" style={{ fontSize: "14px" }}>{row.nr}</td>
                                    <td className="refCent" style={{ fontSize: "14px", textAlign: "left" }}>{removeFileExtension(row.name)}</td>
                                    <td className="refCent">
                                        <input
                                            type="text"
                                            style={{ color: "black", cursor: "text", fontSize: "14px" }}
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
