import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import DatePicker from 'react-multi-date-picker';

const ModifyVisitorDevicePopup = ({ onClose, refresh, data }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [arrival, setArrival] = useState("");
    const [exit, setExit] = useState("");
    const [serial, setSerial] = useState("");

    useEffect(() => {
        console.log('ModifyVisitorDevicePopup data:', data);
        if (data && data.device) {
            const d = data.device;
            setName(d.deviceName || "");
            setType(d.deviceType || "");
            setArrival(
                d.arrivalDate
                    ? new Date(d.arrivalDate).toISOString().split('T')[0]
                    : ""
            );
            setExit(
                d.exitDate
                    ? new Date(d.exitDate).toISOString().split('T')[0]
                    : ""
            );
            setSerial(d.serialNumber || "");
        }
    }, [data]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Front-end required-field validation
        if (
            !type.trim() ||
            !name.trim() ||
            !arrival ||
            !exit ||
            !serial.trim()
        ) {
            toast.error('Please fill in all required fields', {
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
                arrivalDate: arrival || null,
                exitDate: exit || null
            };

            const token = sessionStorage.getItem('visitorToken') || localStorage.getItem('token');
            const deviceId = data?.device?._id || null;
            const visitorId = data?.visitorId;

            const isCreate = !deviceId;

            const url = isCreate
                ? `${process.env.REACT_APP_URL}/api/visitorDevices/addDevice/${visitorId}`
                : `${process.env.REACT_APP_URL}/api/visitorDevices/modifyDevice/${visitorId}/${deviceId}`;

            const method = isCreate ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.ok) {
                toast.success(
                    isCreate
                        ? 'Device created successfully'
                        : 'Device updated successfully',
                    { autoClose: 2000, closeButton: false }
                );
                setTimeout(() => {
                    if (typeof refresh === 'function') refresh();
                    if (typeof onClose === 'function') onClose();
                }, 2000);
            } else {
                toast.error(result.message || 'Failed to save device', {
                    autoClose: 2000,
                    closeButton: false
                });
            }
        } catch (error) {
            console.error('Error saving device:', error);
            toast.error('An error occurred while saving the device', {
                autoClose: 2000,
                closeButton: false
            });
        } finally {
            setLoading(false);
        }
    };

    const todayString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    };

    const isCreate = !data?.device?._id;

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right-visitor-devices">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>{isCreate ? 'Add Visitor Device' : 'Edit Visitor Device'}</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div
                        className="create-visitor-profile-page-form-group-main-container"
                        style={{ overflow: "visible" }}
                    >
                        <div
                            className="create-visitor-profile-page-component-wrapper-normal"
                            style={{ marginBottom: "0px", paddingBottom: "0px" }}
                        >
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
                                                <label>
                                                    Arrival Date <span className="ump-required">*</span>
                                                </label>

                                                <div
                                                    className='date-container-license'
                                                    style={{ position: "relative" }}
                                                >
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
                                                <label>
                                                    Exit Date <span className="ump-required">*</span>
                                                </label>

                                                <div
                                                    className='date-container-license'
                                                    style={{ position: "relative" }}
                                                >
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
                            >
                                {loading
                                    ? <FontAwesomeIcon icon={faSpinner} spin />
                                    : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModifyVisitorDevicePopup;