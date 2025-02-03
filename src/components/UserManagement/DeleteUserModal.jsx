import React from 'react';

const DeleteUserModal = ({ isDeleteModalOpen, setIsDeleteModalOpen, deleteUser, userToDelete }) => {
    if (!isDeleteModalOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Delete</h2>
                <p>Are you sure you want to delete {userToDelete?.username}?</p>
                <div className="modal-actions">
                    <button
                        className="modal-button confirm"
                        onClick={() => deleteUser(userToDelete._id)}
                    >
                        Yes, Delete
                    </button>
                    <button
                        className="modal-button cancel"
                        onClick={() => setIsDeleteModalOpen(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserModal;
