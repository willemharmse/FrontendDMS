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

        const updatedFiles = [
            ...formData.supportingDocuments,
            ...selected.map((file, index) => ({
                nr: formData.supportingDocuments.length + index + 1,
                name: file.name,
                file,
                note: ""
            }))
        ];

        setFormData({
            ...formData,
            supportingDocuments: updatedFiles
        }
        );

        setSelectedFiles(updatedFiles);
    };

    const handleRemoveFile = (indexToRemove) => {
        const updatedDocuments = formData.supportingDocuments
            .filter((_, i) => i !== indexToRemove)
            .map((doc, i) => ({ ...doc, nr: i + 1 }));

        setFormData({
            ...formData,
            supportingDocuments: updatedDocuments,
        });

        setSelectedFiles(updatedDocuments);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">

                <h3 className="font-fam-labels">External Support Documents</h3>

                {formData.supportingDocuments.length > 0 && (
                    <table className="vcr-table table-borders">
                        <thead className="cp-table-header">
                            <tr>
                                <th className="refColCen refNum" style={{ width: "5%" }}>Nr</th>
                                <th className="refColCen refRef" style={{ width: "90%" }}>Name</th>
                                <th className="refColCen refBut" style={{ width: "5%" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.supportingDocuments.map((row, index) => (
                                <tr key={index}>
                                    <td className="refCent" style={{ fontSize: "14px" }}>{row.nr}</td>
                                    <td className="refCent" style={{ fontSize: "14px", textAlign: "left" }}>{removeFileExtension(row.name)}</td>
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
