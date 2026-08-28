import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";
// NOTE: adjust this path to wherever WorkOrderAssignment.jsx actually lives
// relative to this file - it was built alongside TemplatePreview in the FTS
// template folder, which may not be the same folder as this component.
import WorkOrderAssignment from "../WorkOrderManagementPopups/WorkOrderAssignment";

const AddWorkOrderInstance = ({ onClose, onWorkOrderAdded }) => {
    const [currentOwners, setCurrentOwners] = useState([]); // List of people who currently own files
    const [fetchedOptions, setFetchedOptions] = useState([]);

    const [selectedOldOwner, setSelectedOldOwner] = useState('');
    const [selectedNewOwner, setSelectedNewOwner] = useState('');
    const [ownerFiles, setOwnerFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState('');
    const [ownershipChanges, setOwnershipChanges] = useState({});

    // Work Order Assignment popup - opened when a template row is clicked
    const [assignmentTemplate, setAssignmentTemplate] = useState(null);
    const [assignmentFormData, setAssignmentFormData] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, []);

    // 1. Fetch Distinct Owners (People who actually own  now)
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_URL}/api/valuesUpload/workOrderTypes`
                );

                if (!res.ok) {
                    throw new Error(`Request failed: ${res.status}`);
                }

                const data = await res.json();

                const sortedOptions = Array.isArray(data.workOrderTypes)
                    ? [...data.workOrderTypes].sort((a, b) => {
                        const aType = String(a.type ?? "").trim();
                        const bType = String(b.type ?? "").trim();

                        const aIsOther = aType.toLowerCase() === "other";
                        const bIsOther = bType.toLowerCase() === "other";

                        if (aIsOther && !bIsOther) return 1;
                        if (!aIsOther && bIsOther) return -1;

                        return aType.localeCompare(bType, "en", {
                            sensitivity: "base",
                        });
                    })
                    : [];

                setFetchedOptions(sortedOptions);
            } catch (err) {
                console.error("Error fetching work order types:", err);
                setFetchedOptions([]);
            }
        };

        fetchTypes();
    }, []);

    useEffect(() => {
        const fetchOwnerFiles = async () => {
            if (!selectedOldOwner) {
                setOwnerFiles([]);
                setOwnershipChanges({});
                return;
            }

            setFilesLoading(true);

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_URL}/api/valuesUpload/publishedTemplatesByWorkOrderType`,
                    {
                        params: { workOrderType: selectedOldOwner },
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                setOwnerFiles(response.data.templates || []);
                const initialChanges = {};
                (response.data.templates || []).forEach(template => {
                    initialChanges[template._id] = null;
                });
                setOwnershipChanges(initialChanges);
            } catch (error) {
                console.error("Failed to fetch published templates:", error);
                toast.error("Failed to load work order templates");
                setOwnerFiles([]);
            } finally {
                setFilesLoading(false);
            }
        };

        fetchOwnerFiles();
    }, [selectedOldOwner]);

    const removeFileExtension = (fileName = "") => {
        if (!fileName) return "";
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const handleOwnershipChange = (fileId, value) => {
        setOwnershipChanges(prev => ({
            ...prev,
            [fileId]: value || null
        }));
    };

    const handleTemplateRowClick = (template) => {
        setAssignmentTemplate(template);
        // WorkOrderAssignment/TemplatePreviewContent read straight off
        // formData, so seed it from the template that was clicked.
        setAssignmentFormData(template.formData || {});
    };

    const closeAssignmentPopup = () => {
        setAssignmentTemplate(null);
        setAssignmentFormData(null);
    };

    // Used for both Cancel and (after a successful) Submit on the assignment
    // popup - either way we close the assignment popup, close this Add Work
    // Order popup, and let the main page refetch its list.
    const closeAllAndRefetch = () => {
        closeAssignmentPopup();
        onClose && onClose();
        onWorkOrderAdded && onWorkOrderAdded();
    };

    return (
        <div className="batch-popup-overlay">
            <div className="migrate-owner-content">
                <div className="batch-file-header">
                    <h2 className="batch-file-title">Add Work Order</h2>
                    <button className="batch-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                {/* Dropdown 1: Select Current Owner */}
                <div className="migrate-owner-group">
                    <div className="batch-file-text">Work Order Type</div>
                    <div className="migrate-owner-page-select-container">
                        <select
                            value={selectedOldOwner}
                            className="migrate-owner-page-select"
                            onChange={(e) => setSelectedOldOwner(e.target.value)}
                        >
                            <option value="">Select Work Order Type</option>
                            {fetchedOptions.map((type, index) => (
                                <option key={index} value={type.type}>
                                    {type.type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="migrate-owner-group" style={{ fontFamily: "Arial", marginBottom: "0px" }}>
                    <div className="batch-file-text">Available Work Order Templates</div>

                    <div className="migrate-owner-files-box">
                        {!selectedOldOwner ? (
                            <div className="migrate-owner-empty-state">
                                Select a work order type to load work order templates.
                            </div>
                        ) : filesLoading ? (
                            <div className="migrate-owner-empty-state">
                                <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: "8px" }} />
                                Loading work order templates...
                            </div>
                        ) : ownerFiles.length === 0 ? (
                            <div className="migrate-owner-empty-state">
                                No work order templates found for this work order type.
                            </div>
                        ) : (
                            <table className="migrate-owner-files-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "10%", textAlign: "center", fontSize: "16px" }}>Nr</th>
                                        <th style={{ width: "90%", textAlign: "center", fontSize: "16px" }}>Template</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ownerFiles.map((template, index) => (
                                        <tr
                                            key={template._id || index}
                                            onClick={() => handleTemplateRowClick(template)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td className="migrate-owner-file-name-cell" style={{ textAlign: "center" }}>
                                                {index + 1}
                                            </td>
                                            <td className="migrate-owner-file-name-cell">
                                                {removeFileExtension(template.formData?.title) || template.fileName || "Untitled Template"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {assignmentTemplate && (
                <WorkOrderAssignment
                    formData={assignmentFormData}
                    setFormData={setAssignmentFormData}
                    onCancel={closeAllAndRefetch}
                    onSubmit={closeAllAndRefetch}
                />
            )}

            <ToastContainer />
        </div>
    );
};

export default AddWorkOrderInstance;