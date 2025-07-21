import React, { useEffect } from "react";
import "./CreateUserModal.css";

const AddUserModal = ({ isModalOpen, closeModal, createUser, formError, newUser, setNewUser, role }) => {
    const closeModalAdd = () => {
        setNewUser({ username: "", email: "", role: "" });
        closeModal();
    };

    if (!isModalOpen) return null;

    return (
        <div className="create-user-overlay">
            <div className="create-user-modal">
                <div className="create-user-header">
                    <h2 className="create-user-title">Add New User</h2>
                    <button className="create-user-close" onClick={closeModalAdd} title="Close Popup">×</button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createUser(); }}>
                    <div className="create-user-group">
                        <label className="create-user-label" htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            className="create-user-input"
                            placeholder="Insert Username (e.g., Jane Doe)"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>

                    <div className="create-user-group">
                        <label className="create-user-label" htmlFor="email">User Email</label>
                        <input
                            type="email"
                            id="email"
                            className="create-user-input"
                            placeholder="Insert User Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                    </div>

                    <div className="create-user-group">
                        <label className="create-user-label" htmlFor="role">Role</label>

                        <div className="uc-info-popup-page-select-container">
                            <select
                                id="role"
                                className={newUser.role === "" ? `create-user-select def-colour` : `create-user-select`}
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="" className="def-colour">Select Role</option>
                                {role === "admin" && <option value="admin" className="norm-colour">Admin</option>}
                                <option value="auditor" className="norm-colour">Auditor</option>
                                {role === "admin" && <option value="developer" className="norm-colour">Developer</option>}
                                <option value="guest" className="norm-colour">Guest</option>
                                <option value="standarduser" className="norm-colour">Standard User</option>
                                {role === "admin" && <option value="teamleader" className="norm-colour">Team Leader</option>}
                            </select>
                        </div>
                    </div>

                    <div className="create-user-buttons">
                        <button type="submit" className="create-user-button">Add User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
