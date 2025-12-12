import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import DatePicker from 'react-multi-date-picker';

const AddVisitorDevicePopup = ({ onClose, refresh, visitorId, insertAfterIndex }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [arrival, setArrival] = useState("");
    const [exit, setExit] = useState("");
    const [serial, setSerial] = useState("");

    const todayString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    };

    const isFormValid =
        type.trim() &&
        name.trim() &&
        arrival &&
        exit &&
        serial.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFormValid) {
            toast.error("Please fill in all required fields", {
                autoClose: 2000,
                closeButton: false
            });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                deviceType: type,
                deviceName: name,
                serialNumber: serial,
                arrivalDate: arrival,
                exitDate: exit,
                insertAfterIndex: insertAfterIndex ?? null // 👈 send index to backend
            };

            const token = sessionStorage.getItem("visitorToken");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/visitorDevices/addDevice/${visitorId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (response.ok && result.ok) {
                toast.success("Device created successfully", {
                    autoClose: 2000,
                    closeButton: false
                });

                setTimeout(() => {
                    if (typeof refresh === "function") {
                        refresh(); // 👈 pull fresh devices from DB, correct order
                    }
                    if (typeof onClose === "function") {
                        onClose();
                    }
                }, 2000);
            } else {
                toast.error(result.message || "Failed to create device", {
                    autoClose: 2000,
                    closeButton: false
                });
            }
        } catch (err) {
            console.error("Error creating device:", err);
            toast.error("An error occurred while creating the device", {
                autoClose: 2000,
                closeButton: false
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-visitor-devices">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>Add Visitor Device</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="create-visitor-profile-page-form-group-main-container" style={{ overflow: "visible" }}>
                        <div className="create-visitor-profile-page-component-wrapper-normal" style={{ marginBottom: "0px", paddingBottom: "0px" }}>
                            <div className="create-visitor-profile-page-form-group">
                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>
                                                    Device Type <span className="required-field">*</span>
                                                </label>
                                                <input
                                                    className="cea-popup-page-input"
                                                    placeholder="Insert Device Type"
                                                    onChange={(e) => setType(e.target.value)}
                                                    value={type}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>
                                                    Device Name <span className="required-field">*</span>
                                                </label>
                                                <input
                                                    className="cea-popup-page-input"
                                                    placeholder="Insert Device Name"
                                                    onChange={(e) => setName(e.target.value)}
                                                    value={name}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label>Arrival Date <span className="ump-required">*</span></label>
                                                <div className='date-container-license' style={{ position: "relative" }}>
                                                    <DatePicker
                                                        value={arrival || ""}
                                                        format="YYYY-MM-DD"
                                                        onChange={(val) => {
                                                            const v = val?.format("YYYY-MM-DD");
                                                            setArrival(v);
                                                        }}
                                                        rangeHover={false}
                                                        highlightToday={false}
                                                        editable={false}
                                                        placeholder="YYYY-MM-DD"
                                                        hideIcon={false}
                                                        inputClass='ump-input-select-new-3'
                                                        minDate={todayString()}
                                                    />
                                                    <FontAwesomeIcon
                                                        icon={faCalendarDays}
                                                        className="date-input-calendar-icon"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label>Exit Date <span className="ump-required">*</span></label>
                                                <div className='date-container-license' style={{ position: "relative" }}>
                                                    <DatePicker
                                                        value={exit || ""}
                                                        format="YYYY-MM-DD"
                                                        onChange={(val) => {
                                                            const v = val?.format("YYYY-MM-DD");
                                                            setExit(v);
                                                        }}
                                                        rangeHover={false}
                                                        highlightToday={false}
                                                        editable={false}
                                                        placeholder="YYYY-MM-DD"
                                                        hideIcon={false}
                                                        inputClass='ump-input-select-new-3'
                                                        minDate={arrival}
                                                    />
                                                    <FontAwesomeIcon
                                                        icon={faCalendarDays}
                                                        className="date-input-calendar-icon"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>
                                                    Serial Number <span className="required-field">*</span>
                                                </label>
                                                <div className="create-visitor-profile-page-select-container">
                                                    <input
                                                        className="cea-popup-page-input"
                                                        placeholder="Insert Serial Number"
                                                        onChange={(e) => setSerial(e.target.value)}
                                                        value={serial}
                                                    />
                                                </div>
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
                                disabled={loading || !isFormValid}
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

export default AddVisitorDevicePopup;