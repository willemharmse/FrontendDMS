import React from 'react';

const EditUserModal = ({ isEditModalOpen, setIsEditModalOpen, updateUser, formError, userToEdit, setUserToEdit }) => {
    if (!isEditModalOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit User</h2>
                {formError && <p className="form-error">{formError}</p>}
                <form onSubmit={(e) => { e.preventDefault(); updateUser(); }}>
                    <div className="form-group">
                        <label htmlFor="edit-username">Username:</label>
                        <input
                            type="text"
                            id="edit-username"
                            value={userToEdit?.username || ''}
                            onChange={(e) =>
                                setUserToEdit({ ...userToEdit, username: e.target.value })
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-role">Role:</label>
                        <select
                            id="edit-role"
                            value={userToEdit?.role || ''}
                            onChange={(e) =>
                                setUserToEdit({ ...userToEdit, role: e.target.value })
                            }
                        >
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="teamleader">Team Leader</option>
                            <option value="standarduser">Standard User</option>
                            <option value="guest">Guest</option>
                            <option value="auditor">Auditor</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-password">Password:</label>
                        <input
                            type="password"
                            id="edit-password"
                            placeholder="Leave blank to keep current password"
                            onChange={(e) =>
                                setUserToEdit({
                                    ...userToEdit,
                                    password: e.target.value === "" ? "" : e.target.value
                                })
                            }
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="modal-button confirm">
                            Save Changes
                        </button>
                        <button
                            type="button"
                            className="modal-button cancel"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
