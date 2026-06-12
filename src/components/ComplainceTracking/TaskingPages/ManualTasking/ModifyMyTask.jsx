import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faCalendarDays, faTrash } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const ModifyMyTask = ({ onClose, data, onSaved }) => {
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState([]);

    // Track which existing server-side IDs were removed so we can tell the API
    const removedServerIdsRef = useRef([]);

    const attachmentInputRef = useRef(null);
    const [pendingInsertAfterId, setPendingInsertAfterId] = useState(null);

    // ── Seed state from the task prop ──────────────────────────────────────────
    useEffect(() => {
        if (!data) return;

        setComments(data.userComments || "");
        removedServerIdsRef.current = [];
        const existing = (data.userAttachments || []).map((a) => ({
            id: a._id ?? a.id ?? String(Math.random()),
            name: a.fileName ?? a.name ?? "",
            displayName: getDisplayFileName(a.fileName ?? a.name ?? ""),
            isExisting: true,
            _serverId: a._id ?? a.id,
        }));

        setAttachments(existing);
    }, [data]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const generateAttachmentId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    };

    const getDisplayFileName = (fileName = "") => {
        const lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex <= 0) return fileName;
        return fileName.slice(0, lastDotIndex);
    };

    // ── File picker ────────────────────────────────────────────────────────────
    const handleOpenAttachmentPicker = (afterId = null) => {
        setPendingInsertAfterId(afterId);
        attachmentInputRef.current?.click();
    };

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    const handleAttachmentChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (!selectedFiles.length) return;

        setAttachments((prev) => {
            const existingNames = new Set(
                prev.map((item) => String(item.name || "").toLowerCase().trim())
            );

            const validFiles = [];

            selectedFiles.forEach((file) => {
                const normalizedName = String(file.name || "").toLowerCase().trim();

                const alreadyExists =
                    existingNames.has(normalizedName) ||
                    validFiles.some(
                        (item) =>
                            String(item.name || "").toLowerCase().trim() === normalizedName
                    );

                if (alreadyExists) {
                    toast.warn(
                        `"${getDisplayFileName(file.name)}" was not added because a file with the same name already exists.`,
                        { autoClose: 2000, closeButton: false }
                    );
                    return;
                }

                if (file.size > MAX_FILE_SIZE_BYTES) {
                    toast.warn(
                        `"${getDisplayFileName(file.name)}" was not added because it is larger than 5 MB.`,
                        { autoClose: 2000, closeButton: false }
                    );
                    return;
                }

                validFiles.push({
                    id: generateAttachmentId(),
                    file,
                    name: file.name,
                    displayName: getDisplayFileName(file.name),
                    isExisting: false,
                });

                existingNames.add(normalizedName);
            });

            if (!validFiles.length) return prev;

            if (!pendingInsertAfterId || prev.length === 0) {
                return [...prev, ...validFiles];
            }

            const insertIndex = prev.findIndex((item) => item.id === pendingInsertAfterId);

            if (insertIndex === -1) return [...prev, ...validFiles];

            const updated = [...prev];
            updated.splice(insertIndex + 1, 0, ...validFiles);
            return updated;
        });

        setPendingInsertAfterId(null);
        e.target.value = "";
    };

    const handleRemoveAttachment = (attachmentId) => {
        setAttachments((prev) => {
            const target = prev.find((item) => item.id === attachmentId);

            // If it was already on the server, mark it for deletion in the API call
            if (target?.isExisting && target._serverId) {
                removedServerIdsRef.current = [
                    ...removedServerIdsRef.current,
                    target._serverId,
                ];
            }

            return prev.filter((item) => item.id !== attachmentId);
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!data?._id) {
            toast.error("Task ID is missing. Please close and reopen the task.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        setLoading(true);

        try {
            const storedToken = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("comments", comments);

            const removedIds = removedServerIdsRef.current;
            if (removedIds.length > 0) {
                formData.append("removeUserAttachmentIds", JSON.stringify(removedIds));
            }

            const newFiles = attachments.filter((a) => !a.isExisting && a.file);
            newFiles.forEach((a) => {
                formData.append("userAttachments", a.file, a.name);
            });

            const apiBase =
                data?._taskSource === "autoAuto"
                    ? `${process.env.REACT_APP_URL}/api/auto-auto-tasks`
                    : data?._taskSource === "autoManual"
                        ? `${process.env.REACT_APP_URL}/api/auto-manual-tasks`
                        : `${process.env.REACT_APP_URL}/api/complainceTasks`;

            const response = await axios.put(
                `${apiBase}/${data._id}/update-my-task`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                    },
                }
            );

            toast.success("Task updated successfully.", {
                autoClose: 2000,
                closeButton: false,
            });

            // Notify the parent so it can update the table row in place
            if (typeof onSaved === "function") {
                onSaved(response.data.task);
            }

            onClose();
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                "An error occurred while updating the task. Please try again.";

            toast.error(message, { autoClose: 3000, closeButton: false });
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Update My Task</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">

                            {/* Task description – read only so the user knows what they're updating */}
                            {data?.taskDescription && (
                                <div className="cea-popup-page-component-wrapper">
                                    <div className="ibra-popup-page-form-group">
                                        <label style={{ fontSize: "15px" }}>Title</label>
                                        <p style={{ margin: 0, fontSize: "14px", color: "black", textAlign: "center" }}>
                                            {data.taskTitle}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Comments / Notes</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Additional Comments or Notes"
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>

                            {/* User Attachments */}
                            <div className="cea-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Upload Supporting Information</label>

                                    <input
                                        ref={attachmentInputRef}
                                        type="file"
                                        multiple
                                        style={{ display: "none" }}
                                        onChange={handleAttachmentChange}
                                    />

                                    {attachments.length === 0 ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                paddingTop: "8px",
                                                paddingBottom: "4px"
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="ibra-popup-page-action-button-add-hazard"
                                                onClick={() => handleOpenAttachmentPicker(null)}
                                                title="Add Attachment"
                                                style={{ fontSize: "22px" }}
                                            >
                                                <FontAwesomeIcon icon={faCirclePlus} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="cea-popup-page-component-wrapper"
                                                    style={{ marginBottom: "0px", padding: "10px 12px" }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            gap: "12px"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                                flex: 1,
                                                                fontSize: "14px",
                                                                color: attachment.isExisting ? "#333" : "#1a5276",
                                                                wordBreak: "break-word",
                                                            }}
                                                            title={attachment.isExisting ? "Existing attachment" : "New – not yet uploaded"}
                                                        >
                                                            {attachment.displayName}
                                                            {!attachment.isExisting && (
                                                                <span style={{ fontSize: "11px", color: "#888", marginLeft: "6px" }}>
                                                                    (new)
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button"
                                                                onClick={() => handleRemoveAttachment(attachment.id)}
                                                                title="Remove Attachment"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button-add-hazard"
                                                                onClick={() => handleOpenAttachmentPicker(attachment.id)}
                                                                title="Add Attachment Below"
                                                            >
                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModifyMyTask;