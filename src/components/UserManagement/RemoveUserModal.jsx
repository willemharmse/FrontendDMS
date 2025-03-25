import React from 'react';

const RemoveUserModal = ({ isDeleteModalOpen, setIsDeleteModalOpen, deleteUser, userToDelete, department }) => {
    if (!isDeleteModalOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Removal</h2>
                <p>Are you sure you want to remove {userToDelete?.username} from {department}?</p>
                <div className="modal-actions">
                    <button
                        className="modal-button confirm"
                        onClick={() => deleteUser(userToDelete._id)}
                    >
                        Remove
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

export default RemoveUserModal;
