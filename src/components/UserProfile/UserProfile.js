import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./UserProfile.css";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScaleBalanced, faCertificate, faListOl, faChevronLeft, faChevronRight, faArrowLeft, faCaretLeft, faCaretRight, faCamera, faLock } from '@fortawesome/free-solid-svg-icons';

import TopBar from "../Notifications/TopBar";
import ChangePassword from "../UserManagement/ChangePassword";

const UserProfile = () => {
    const [role, setRole] = useState('');
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [profilePic, setProfilePic] = useState(null);
    const [user, setUser] = useState({});
    const [userID, setUserID] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [reset, setReset] = useState(false);
    const handleCameraClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileSelected = async (e) => {
        const files = e.target.files;
        if (!files || !files.length) return; // user cancelled

        const file = files[0];

        // Enforce media files (images only)
        if (!/^image\/(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(file.type || "")) {
            toast.error("Please select an image file (PNG, JPG, GIF, WebP, BMP, TIFF).");
            e.target.value = ""; // reset so the same file can be re-chosen later
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token || !userID) {
                toast.error("Not authenticated.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const resp = await fetch(
                `${process.env.REACT_APP_URL}/api/user/${userID}/profile-picture`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`, // DON'T set Content-Type; browser will set multipart boundary
                    },
                    body: formData,
                }
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err?.error || "Upload failed");
            }

            // Re-fetch & cache the latest image
            await fetchAndCacheProfilePic(userID, token);

            // Pull the fresh dataURL from sessionStorage and update UI
            setProfilePic(sessionStorage.getItem("profilePic") || null);

            toast.success("Profile picture updated.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Error uploading profile picture.");
        } finally {
            // allow re-selecting the same file later
            e.target.value = "";
        }
    };

    const saveProfile = async () => {
        // basic guards
        if (!userID) { toast.error("User not loaded yet."); return; }
        const token = localStorage.getItem("token");
        if (!token) { toast.error("Not authenticated."); return; }

        // basic email validation (optional)
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) { toast.error("Please enter a valid email."); return; }

        try {
            setIsSaving(true);

            const resp = await fetch(
                `${process.env.REACT_APP_URL}/api/user/${userID}/profile/updateProfile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ firstName, lastName, email }),
                }
            );

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to save profile");
            }

            toast.success("Profile saved.");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Error saving profile.");
        } finally {
            setIsSaving(false);
        }
    };

    async function fetchAndCacheProfilePic(userId, token) {
        try {
            const resp = await fetch(
                `${process.env.REACT_APP_URL}/api/user/${userId}/profile-picture`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.status === 200) {
                const blob = await resp.blob();
                const toDataURL = (blob) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                const dataUrl = await toDataURL(blob);
                sessionStorage.setItem("profilePic", dataUrl);
            } else {
                sessionStorage.removeItem("profilePic");
            }
        } catch {
            sessionStorage.removeItem("profilePic");
        }
    }

    useEffect(() => {
        // Load from sessionStorage on mount
        const cached = sessionStorage.getItem('profilePic');
        setProfilePic(cached || null);
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) return;
        try {
            const decoded = jwtDecode(storedToken) || {};
            setRole(decoded?.role || "");
            const id = decoded?.userId || decoded?._id || decoded?.id || decoded?.sub || "";
            setUserID(id || "");
        } catch (e) {
            console.warn("Failed to decode token:", e);
            setRole("");
            setUserID("");
        }
    }, []);

    useEffect(() => {
        if (!userID) return; // do nothing until we have an id

        const ac = new AbortController();

        (async () => {
            try {
                const resp = await fetch(
                    `${process.env.REACT_APP_URL}/api/user/userInfo/${userID}`,
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        signal: ac.signal,
                    }
                );

                if (!resp.ok) throw new Error(`Failed to fetch values (${resp.status})`);

                const data = await resp.json();
                if (!data || typeof data !== "object") return;

                setUser(data);
                setEmail(data.email ?? "");

                const derived = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

                setUsername(prev => {
                    // 1) if API sent a username (null/undefined check), use it
                    if (data.username !== null && data.username !== undefined) return data.username;

                    // 2) otherwise keep previous if it’s non-empty
                    if (prev && prev.trim().length) return prev;

                    // 3) otherwise use derived "First Last" if available
                    if (derived) return derived;

                    // 4) final fallback
                    return "";
                });

                const finalUsername =
                    data.username ??
                    (data.firstName || data.lastName ? derived : "");

                if (finalUsername) {
                    const parts = finalUsername.trim().split(/\s+/);
                    if (parts.length === 1) {
                        setFirstName(parts[0]);
                        setLastName("");
                    } else {
                        setFirstName(parts[0]);
                        setLastName(parts.slice(1).join(" "));
                    }
                }
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
                // don't touch state on error
            }
        })();

        return () => ac.abort(); // cancel in-flight request if userID changes/unmounts
    }, [userID, process.env.REACT_APP_URL]);

    return (
        <div className="dc-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/home')} title="Home" />
                        <p className="logo-text-um">Profile Management</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}
            <div className="main-box-user-profile">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar role={role} isProfile={true} />
                </div>

                <div className="scrollable-box-user-profile-home">
                    <div className="up-profile-card">
                        {/* Left: avatar + username */}
                        <div className="up-profile-left">
                            <div className="up-avatar-wrap" title="Change profile picture">
                                <img
                                    src={profilePic}
                                    alt="Profile"
                                    className="up-avatar-img"
                                />

                                {/* Camera badge triggers file picker */}
                                <div className="up-camera-badge" onClick={handleCameraClick}>
                                    <FontAwesomeIcon icon={faCamera} />
                                </div>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleFileSelected}
                                />
                            </div>
                            <div className="up-username">{username}</div>
                        </div>

                        <div className="up-profile-divider" />

                        {/* Right: personal details */}
                        <div className="up-profile-right">
                            <div className="up-section-title">Personal Details</div>
                            <div className="up-section-rule"></div>

                            <div className="up-details-grid">
                                <div className="up-field">
                                    <label>First Name</label>
                                    <input readOnly className="up-input" style={{ cursor: "default" }} placeholder="Insert Name (e.g., John)" value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)} />
                                </div>

                                <div className="up-field">
                                    <label>Last Name</label>
                                    <input readOnly className="up-input" style={{ cursor: "default" }} placeholder="No Last Name" value={lastName}
                                        onChange={(e) => setLastName(e.target.value)} />
                                </div>

                                <div className="up-field">
                                    <label>Email</label>
                                    <input readOnly className="up-input" style={{ cursor: "default" }} placeholder="Insert your email address (e.g., jsmith@tau5.co.za)" value={email}
                                        onChange={(e) => setEmail(e.target.value)} />
                                </div>

                                <div className="up-field readonly">
                                    <label>Reporting To</label>
                                    <div>Set by Admin</div>
                                </div>

                                <div className="up-field readonly">
                                    <label>Department</label>
                                    <div>Set by Admin</div>
                                </div>

                                <div className="up-field readonly">
                                    <label>Designation</label>
                                    <div>Set by Admin</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="up-pw-card">
                        <div className="up-pw-title">Password Management</div>

                        <div className="up-pw-icon-wrap">
                            <FontAwesomeIcon icon={faLock} className="up-pw-icon" />
                        </div>

                        <button
                            className="up-change-pw-btn"
                            onClick={() => setReset(true)}  // or open your modal
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
            <ToastContainer />
            {reset && <ChangePassword onClose={() => setReset(false)} />}
        </div>
    );
};

export default UserProfile;