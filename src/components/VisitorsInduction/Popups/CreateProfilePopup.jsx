import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import "./CreateProfilePopup.css"
import { toast } from 'react-toastify';
import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js';
import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2';

const CreateProfilePopup = ({ onClose, refresh, openUserLinkShare }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [id, setID] = useState("");
    const [company, setCompany] = useState("");
    const [country, setCountry] = useState('za');

    const normalizeToE164 = (val, ctry) => {
        if (!val) return '';
        const parsed = ctry ? parsePhoneNumberFromString(val, ctry) : parsePhoneNumberFromString(val);
        return parsed ? parsed.number : val;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // minimal client validation to help the user
        const missing = [];
        if (!name.trim()) missing.push('Name');
        if (!surname.trim()) missing.push('Surname');
        if (!number.trim()) missing.push('Contact Number');
        if (!id.trim()) missing.push('ID/ Passport Number');
        if (!company.trim()) missing.push('Company');

        if (missing.length) {
            toast.warn(`Please fill in the required field(s): ${missing.join(', ')}`, { autoClose: 800, closeButton: false });
            return;
        }

        if (email.trim()) {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
            if (!isEmail) {
                toast.warn('Please enter a valid email address (or leave it empty).', { autoClose: 800, closeButton: false });
                return;
            }
        }

        const formattedContact = number.startsWith('+')
            ? number
            : `+${number}`;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.REACT_APP_URL}/api/visitors/createVisitorProfile`,
                {
                    name: name.trim(),
                    surname: surname.trim(),
                    email: email.trim() || undefined,
                    number: formattedContact.trim(),
                    id: id.trim(),
                    company: company.trim()
                },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            const { message, user } = res.data;

            toast.success(message || 'Visitor Profile Created', { autoClose: 800, closeButton: false });

            console.log("New visitor created:", user);

            refresh();
            openUserLinkShare(user);
            onClose?.();
        } catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.error || 'Failed to create visitor profile.';
            if (status === 409 || err?.response?.data?.code === 'duplicate') {
                toast.error('A visitor with that ID number already exists.', { autoClose: 800, closeButton: false });
            } else {
                toast.error(msg, { autoClose: 800, closeButton: false });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-visitor-profile-page-container">
            <div className="create-visitor-profile-page-overlay">
                <div className="create-visitor-profile-page-popup-right">
                    <div className="create-visitor-profile-page-popup-header-right">
                        <h2>Create Visitor Profile</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="create-visitor-profile-page-form-group-main-container">
                        <div className="create-visitor-profile-page-component-wrapper-normal">
                            <div className="create-visitor-profile-page-form-group">
                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>Name <span className="required-field">*</span>
                                                </label>
                                                <input
                                                    className="cea-popup-page-input"
                                                    placeholder="Insert Visitor Name"
                                                    onChange={(e) => setName(e.target.value)}
                                                    value={name}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>Surname <span className="required-field">*</span>
                                                </label>
                                                <input
                                                    className="cea-popup-page-input"
                                                    placeholder="Insert Visitor Surname"
                                                    onChange={(e) => setSurname(e.target.value)}
                                                    value={surname}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="create-visitor-profile-page-additional-row">
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>Email
                                                </label>
                                                <div className="create-visitor-profile-page-select-container">
                                                    <input
                                                        type="email"
                                                        className="cea-popup-page-input"
                                                        placeholder="Insert Visitor Email"
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        value={email}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>Contact Number <span className="required-field">*</span>
                                                </label>
                                                <div className="visitors-induction-input-container-2">
                                                    <PhoneInput
                                                        international
                                                        country={country || 'za'}
                                                        defaultCountry="za"
                                                        placeholder="Contact Number"
                                                        countryCodeEditable={false}
                                                        value={number || undefined} // controlled value
                                                        onChange={(value) =>
                                                            setNumber(value)
                                                        }
                                                        name="contact"
                                                        id="contact"
                                                        required
                                                        style={{ fontSize: "14px" }}
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
                                                <label style={{ fontSize: "15px" }}>ID/ Passport Number <span className="required-field">*</span>
                                                </label>
                                                <div className="create-visitor-profile-page-select-container">
                                                    <input
                                                        className="cea-popup-page-input"
                                                        placeholder="Insert ID Number (Insert Passport Number if not South African citizen)"
                                                        onChange={(e) => setID(e.target.value)}
                                                        value={id}
                                                        style={{ fontSize: id === "" ? "12px" : "" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="create-visitor-profile-page-column-half">
                                        <div className="create-visitor-profile-page-component-wrapper">
                                            <div className="create-visitor-profile-page-form-group">
                                                <label style={{ fontSize: "15px" }}>Company <span className="required-field">*</span>
                                                </label>
                                                <input
                                                    type='text'
                                                    placeholder='Insert Visitor Company Name'
                                                    className="cea-popup-page-input"
                                                    onChange={(e) => setCompany(e.target.value)}
                                                    value={company}
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
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (`Submit`)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProfilePopup;