import React, { useRef, useState } from "react";
import "./SupportingDocumentTable.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle, faInfoCircle, faDownload } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import {
    faChevronDown,
    faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import RiskAssessmentItemsDelete from "./RiskAssessmentItemsDelete";

const SupportingDocumentTable = ({ collapsible = false, formData, setFormData, readOnly = false }) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
    };

    const isDownloadable = (row) => {
        return Boolean(row?.file || row?.storageId);
    };

    const triggerBrowserDownload = (blob, fileName) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadFile = async (row) => {
        try {
            // Unsaved file still only in memory
            if (row?.file instanceof File) {
                triggerBrowserDownload(row.file, row.name);
                return;
            }

            // Saved file on backend
            if (row?.storageId) {
                const response = await fetch(
                    `${process.env.REACT_APP_URL}/api/file/draft-supporting/download/${row.storageId}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to download file");
                }

                const blob = await response.blob();
                triggerBrowserDownload(blob, row.name);
                return;
            }

            toast.error("This file is not available for download.");
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Could not download file.");
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const MAX_FILE_SIZE_MB = 5;
    const MAX_TOTAL_SIZE_MB = 15;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

    const handleFileChange = (event) => {
        const selected = Array.from(event.target.files || []);
        const existingFiles = formData.supportingDocuments || [];

        const exactDuplicates = [];
        const sameNameDifferentExtension = [];
        const invalidTypeFiles = [];
        const oversizedFiles = [];
        const acceptedFiles = [];

        const existingBaseNames = new Set(
            existingFiles.map((doc) => removeFileExtension(doc.name).trim().toLowerCase())
        );

        const existingExactKeys = new Set(
            existingFiles.map((doc) => {
                const size = doc.file?.size ?? doc.size ?? 0;
                return `${doc.name}__${size}`;
            })
        );

        const newBaseNames = new Set();
        const newExactKeys = new Set();

        const existingTotalSize = existingFiles.reduce((total, doc) => {
            return total + (doc.file?.size ?? doc.size ?? 0);
        }, 0);

        let runningNewSize = 0;

        selected.forEach((file) => {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                oversizedFiles.push(file);
                return;
            }

            const baseName = removeFileExtension(file.name).trim().toLowerCase();
            const exactKey = `${file.name}__${file.size}`;

            const isExactDuplicate =
                existingExactKeys.has(exactKey) || newExactKeys.has(exactKey);

            const hasSameBaseName =
                existingBaseNames.has(baseName) || newBaseNames.has(baseName);

            if (isExactDuplicate) {
                exactDuplicates.push(file);
                return;
            }

            if (hasSameBaseName) {
                sameNameDifferentExtension.push(file);
                return;
            }

            if (existingTotalSize + runningNewSize + file.size > MAX_TOTAL_SIZE_BYTES) {
                toast.error("Total uploaded files cannot exceed 15 MB.");
                return;
            }

            acceptedFiles.push(file);
            runningNewSize += file.size;
            newBaseNames.add(baseName);
            newExactKeys.add(exactKey);
        });

        const updatedFiles = [
            ...existingFiles,
            ...acceptedFiles.map((file, index) => ({
                nr: existingFiles.length + index + 1,
                name: file.name,
                file,
                note: "",
                saved: false,
                size: file.size,
            }))
        ];

        if (invalidTypeFiles.length > 0) {
            toast.error("Only PDF files may be uploaded.");
        }

        if (oversizedFiles.length > 0) {
            toast.error("Each file must be 5 MB or smaller.");
        }

        if (exactDuplicates.length > 0) {
            toast.error("Some files were already added and were skipped.");
        }

        if (sameNameDifferentExtension.length > 0) {
            toast.error("A file with the same name already exists. Please rename the file or remove the existing one before uploading a different extension.");
        }

        setFormData({
            ...formData,
            supportingDocuments: updatedFiles
        });

        setSelectedFiles(updatedFiles);
        event.target.value = null;
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

    const requestRemoveFile = (indexToRemove) => {
        setConfirmDeleteIndex(indexToRemove);
    };

    const confirmRemoveFile = () => {
        if (confirmDeleteIndex != null) {
            handleRemoveFile(confirmDeleteIndex);
        }
        setConfirmDeleteIndex(null);
    };

    const cancelRemoveFile = () => {
        setConfirmDeleteIndex(null);
    };

    return (
        <div className="input-row">
            <div className="input-box-ref">

                <h3 className="font-fam-labels">External Support Documents</h3>

                {collapsible && (<button
                    className="top-right-button-ibra"
                    title={collapsed ? "Expand Section" : "Collapse Section"}
                    onClick={toggleCollapse}
                    style={{ color: "gray" }}
                    type="button"
                >
                    <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                </button>)}

                {(!isCollapsed) && (
                    <>
                        {formData.supportingDocuments.length > 0 && (
                            <table className="vcr-table table-borders">
                                <thead className="cp-table-header">
                                    <tr>
                                        <th className="refColCen refNum" style={{ width: "5%" }}>Nr</th>
                                        <th className="refColCen refRef" style={{ width: "90%" }}>Name</th>
                                        {!readOnly && (<th className="refColCen refBut" style={{ width: "5%" }}>Action</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.supportingDocuments.map((row, index) => (
                                        <tr key={index}>
                                            <td className="refCent" style={{ fontSize: "14px" }}>{row.nr}</td>
                                            <td className="refCent" style={{ fontSize: "14px", textAlign: "left" }}>{removeFileExtension(row.name)}</td>
                                            {!readOnly && (
                                                <td className="ref-but-row procCent">
                                                    <div
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "8px",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {isDownloadable(row) ? (
                                                            <button
                                                                type="button"
                                                                className="download-support-row-button"
                                                                onClick={() => handleDownloadFile(row)}
                                                                title="Download File"
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                }}
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                            </button>
                                                        ) : null}

                                                        <button
                                                            type="button"
                                                            className="remove-row-button"
                                                            onClick={() => requestRemoveFile(index)}
                                                            title="Remove File"
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
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
                        {!readOnly && (<button className="add-row-button-ref" onClick={() => fileInputRef.current.click()}>
                            Select
                        </button>)}
                    </>
                )}
            </div>

            {confirmDeleteIndex != null && (
                <RiskAssessmentItemsDelete
                    closeModal={cancelRemoveFile}
                    type="External Supporting Document"
                    removeRow={confirmRemoveFile}
                />
            )}
        </div>
    );
};

export default SupportingDocumentTable;