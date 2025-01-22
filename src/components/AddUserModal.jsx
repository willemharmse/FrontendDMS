import React, { useState } from 'react';

const AddUserModal = ({ isModalOpen, closeModal, createUser, formError, newUser, setNewUser, role }) => {
    if (!isModalOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add New User</h2>
                {formError && <p className="form-error">{formError}</p>}
                <form onSubmit={(e) => { e.preventDefault(); createUser(); }}>
                    <div className="form-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">Role:</label>
                        <select
                            id="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="">Select Role</option>
                            {role === 'admin' && (
                                <option value="admin">Admin</option>
                            )}
                            {role === 'admin' && (
                                <option value="teamleader">Team Leader</option>
                            )}
                            <option value="standarduser">Standard User</option>
                            <option value="guest">Guest</option>
                            <option value="auditor">Auditor</option>
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="modal-button confirm">Add User</button>
                        <button type="button" className="modal-button cancel" onClick={closeModal}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
