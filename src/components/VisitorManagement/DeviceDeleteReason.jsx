import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const DeviceDeleteReason = ({ onClose, refresh, visitorId, deviceId }) => {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error("Please insert a reason for device deletion", {
                autoClose: 2000,
                closeButton: false,
            });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/visitorDevices/deleteDevice/${visitorId}/${deviceId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            const result = await response.json();

            if (response.ok && result.ok) {
                toast.success("Device deleted successfully", {
                    autoClose: 2000,
                    closeButton: false,
                });

                setTimeout(() => {
                    if (typeof refresh === "function") refresh();
                    if (typeof onClose === "function") onClose();
                }, 2000);
            } else {
                toast.error(result.message || "Failed to delete device", {
                    autoClose: 2000,
                    closeButton: false,
                });
            }
        } catch (err) {
            console.error("Error deleting device:", err);
            toast.error("An error occurred while deleting the device", {
                autoClose: 2000,
                closeButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-visitor-reason">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>Delete Visitor Device</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="create-visitor-profile-page-form-group-main-container" style={{ overflowY: "scroll" }}>
                        <div className="create-visitor-profile-page-component-wrapper-normal" style={{ marginBottom: "0px", paddingBottom: "0px", paddingTop: "10px", paddingRight: "2px" }}>
                            <div className="create-visitor-profile-page-form-group">
                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>
                                                    Insert Reason for Device Deletion
                                                </label>
                                                <textarea
                                                    className="ibra-popup-page-textarea-full-textable"
                                                    placeholder="Insert reason"
                                                    onChange={(e) => setReason(e.target.value)}
                                                    value={reason}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="create-visitor-profile-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="create-visitor-profile-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading || !reason.trim()}
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

export default DeviceDeleteReason;