import React, { useState } from "react";
import "./VisitorsInductionSite.css";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faEnvelope,
    faPhone,
    faIdCard,
    faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";

const VisitorsInductionSite = () => {
    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        contact: "",
        idNumber: "",
        company: "",
    });
    const [consent1, setConsent1] = useState(false);
    const [consent2, setConsent2] = useState(false);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!consent1 || !consent2) {
            toast.error("Please agree to both confirmations to continue.", {
                autoClose: 1400,
            });
            return;
        }
        // TODO: submit to your API
        toast.success("Submitted!", { autoClose: 1200 });
    };

    return (
        <div className="visitors-induction-container">
            <div className="visitors-induction-card visitors-induction-card-wide">
                {/* Logo (already good) */}
                <img src="/CH_Logo.svg" alt="ComplianceHub" className="visitors-induction-logo-img" />

                {/* Title */}
                <div className="visitors-induction-login-title">ComplianceHub{"\u2122"}</div>

                {/* Section heading */}
                <div className="visitor-info-heading">Visitor Information</div>

                <form onSubmit={handleSubmit} noValidate>
                    {/* 2-column grid */}
                    <div className="visitors-grid">
                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faUser} /></i>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Name"
                                    value={form.name}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faUser} /></i>
                                <input
                                    type="text"
                                    name="surname"
                                    placeholder="Surname"
                                    value={form.surname}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faEnvelope} /></i>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faPhone} /></i>
                                <input
                                    type="tel"
                                    name="contact"
                                    placeholder="Contact Number"
                                    value={form.contact}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faIdCard} /></i>
                                <input
                                    type="text"
                                    name="idNumber"
                                    placeholder="ID Number (Insert Passport Number if not RSA citizen)"
                                    value={form.idNumber}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faBuilding} /></i>
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="Company"
                                    value={form.company}
                                    onChange={onChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Consents */}
                    <label className="consent-row">
                        <input
                            type="checkbox"
                            checked={consent1}
                            onChange={(e) => setConsent1(e.target.checked)}
                        />
                        <span>
                            By submitting this form, I consent to the collection, storage, and
                            use of my personal information for visitor verification, site
                            access, and compliance with safety and security requirements.
                            <span className="required-asterisk"> *</span>
                        </span>
                    </label>

                    <label className="consent-row" style={{ display: "block", marginBottom: "30px" }}>
                        <input
                            type="checkbox"
                            checked={consent2}
                            onChange={(e) => setConsent2(e.target.checked)}
                        />
                        <span>
                            I confirm that my information provided above is accurate.
                            <span className="required-asterisk"> *</span>
                        </span>
                    </label>

                    {/* Submit */}
                    <div className="visitors-induction-login-button-container">
                        <button type="submit" className="visitors-induction-login-button visitors-submit">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};

export default VisitorsInductionSite;
