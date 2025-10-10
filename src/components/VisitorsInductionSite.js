import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./VisitorsInductionSite.css";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone, faIdCard, faBuilding } from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";
import VisitorOTPLink from "./VisitorsInduction/VisitorOTPLink";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reasonToMessage = (reason, extra) => {
    switch (reason) {
        case "not_found": return "This visitor link could not be found.";
        case "no_link": return "No link is associated with this visitor.";
        case "mismatch": return "The link does not match the one on record.";
        case "expired": return `This visitor link has expired${extra ? ` (${extra})` : ""}.`;
        case "server_error":
        default: return "Unable to validate your link at the moment.";
    }
};

const VisitorsInductionSite = ({
    // keep for clarity; we'll construct the final endpoint including id + ?link=...
    submitUrlBase = `${process.env.REACT_APP_URL}/api/visitors/updateVisitorFromLink`,
    validateUrlBase = `${process.env.REACT_APP_URL}/api/visitors/validateVisitorLink`,
    loginRedirectPath = "/",
}) => {
    const location = useLocation();
    const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const visitorId = qs.get("id") || "";
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const [visitor, setVisitor] = useState(null);
    const [form, setForm] = useState({
        name: "",
        surname: "",
        email: "",
        contact: "",
        idNumber: "",
        company: "",
    });
    const navigate = useNavigate();
    const [otpCompleted, setOTPCompleted] = useState(false);

    const [consent1, setConsent1] = useState(false);
    const [consent2, setConsent2] = useState(false);

    const [isValidating, setIsValidating] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false); // when true, the page is disabled
    const [submitting, setSubmitting] = useState(false);

    // Validate the link BEFORE allowing any interaction
    useEffect(() => {
        (async () => {
            // No id in query? Treat as invalid.
            if (!visitorId) {
                toast.error("Missing visitor ID in the link.");
                setIsBlocked(true);
                setIsValidating(false);
                setTimeout(() => (window.location.href = loginRedirectPath), 5000);
                return;
            }

            try {
                const res = await fetch(
                    `${validateUrlBase}/${visitorId}`
                );

                if (res.status === 201) {
                    navigate("/FrontendDMS/visitorLogin");
                    return;
                }

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    const msg = reasonToMessage(data?.reason, data?.expiredAt);
                    toast.error(msg, { autoClose: 4000 });
                    setIsBlocked(true);
                    setIsValidating(false);
                    setTimeout(() => (window.location.href = loginRedirectPath), 5000);
                    return;
                }

                setIsBlocked(false);
                setIsValidating(false);
            } catch (e) {
                console.error("Validation error:", e);
                toast.error("Network error while validating the link.");
                setIsBlocked(true);
                setIsValidating(false);
                setTimeout(() => (window.location.href = loginRedirectPath), 5000);
            }
        })();
    }, [visitorId, validateUrlBase, loginRedirectPath, currentUrl]);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    useEffect(() => {
        if (visitor) {
            setForm({
                name: visitor.name || "",
                surname: visitor.surname || "",
                email: visitor.email || "",
                contact: visitor.contactNr || visitor.contact || "",
                idNumber: visitor.idNumber || visitor.passport || "",
                company: visitor.company || "",
            });
        }
    }, [visitor]);

    const validate = () => {
        const f = {
            name: form.name.trim(),
            surname: form.surname.trim(),
            email: form.email.trim(),
            contact: form.contact.replace(/\s+/g, ""),
            idNumber: form.idNumber.replace(/\s+/g, ""),
            company: form.company.trim(),
        };

        if (!consent1 || !consent2) return "Please agree to both confirmations to continue.";

        for (const [k, v] of Object.entries(f)) {
            if (!v) return `Please fill in the ${k === "idNumber" ? "ID Number" : k} field.`;
        }

        if (!EMAIL_RE.test(f.email)) return "Please enter a valid email address.";
        if (f.contact.length !== 10) return "Contact number must be exactly 10 digits.";
        if (f.idNumber.length !== 13) return "ID number must be exactly 13 characters.";

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isBlocked || isValidating) return; // hard block if validation failed or still running

        const error = validate();
        if (error) {
            toast.error(error, { autoClose: 1600 });
            return;
        }

        const payload = {
            name: form.name.trim(),
            surname: form.surname.trim(),
            email: form.email.trim(),
            contactNr: form.contact.replace(/\s+/g, ""),
            idNumber: form.idNumber.replace(/\s+/g, ""),
            company: form.company.trim(),
        };

        try {
            setSubmitting(true);
            const res = await fetch(
                `${submitUrlBase}/${visitorId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `HTTP ${res.status}`);
            }

            toast.success("Submitted!", { autoClose: 1500 });

            setTimeout(() => {
                navigate("/FrontendDMS/visitorLogin");
            }, 1500);
        } catch (err) {
            console.error("Submit failed:", err);
            toast.error("Submission failed. Please try again.", { autoClose: 1600 });
        } finally {
            setSubmitting(false);
        }
    };

    // Simple overlay to prevent interaction while validating or blocked
    const pageDisabled = isBlocked || isValidating;

    return (
        <div className="visitors-induction-container" style={{ position: "relative" }}>
            {pageDisabled && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(2px)",
                        zIndex: 5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                    }}
                >
                    {isValidating ? "Validating link…" : "Access denied"}
                </div>
            )}

            <div className="visitors-induction-card visitors-induction-card-wide" aria-disabled={pageDisabled}>
                <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="ComplianceHub" className="visitors-induction-logo-img" />
                <div className="visitors-induction-login-title">ComplianceHub{"\u2122"}</div>
                <div className="visitor-info-heading">Visitor Information</div>

                <form onSubmit={handleSubmit} noValidate style={{ pointerEvents: pageDisabled ? "none" : "auto", opacity: pageDisabled ? 0.5 : 1 }}>
                    <div className="visitors-grid">
                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faUser} /></i>
                                <input type="text" name="name" placeholder="Name" value={form.name} onChange={onChange} required />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faUser} /></i>
                                <input type="text" name="surname" placeholder="Surname" value={form.surname} onChange={onChange} required />
                            </div>
                        </div>

                        <div className="visitors-induction-form-group">
                            <div className="visitors-induction-input-container">
                                <i><FontAwesomeIcon icon={faEnvelope} /></i>
                                <input type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
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
                                    maxLength={20}
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
                                    maxLength={32}
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

                    <label className="consent-row" style={{ marginBottom: "30px" }}>
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

                    <div className="visitors-induction-login-button-container">
                        <button
                            type="submit"
                            className="visitors-induction-login-button visitors-submit"
                            disabled={submitting || pageDisabled}
                        >
                            {submitting ? "Submitting…" : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
            {!otpCompleted && (<VisitorOTPLink otpCompleted={otpCompleted} setOtpCompleted={setOTPCompleted} userID={visitorId} setVisitor={setVisitor} />)}
            <ToastContainer />
        </div>
    );
};

export default VisitorsInductionSite;
