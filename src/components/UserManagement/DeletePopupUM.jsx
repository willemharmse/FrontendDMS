import React, { useEffect, useState } from "react";
import "./DeletePopupUM.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const DeletePopupUM = ({ form, setIsDeleteModalOpen, deleteUser, userToDelete, department }) => {
    const message = () => {
        if (form === "user") {
            return `Do you want to delete this user?`
        }
        else {
            return `Do you want to remove this user from ${department}?`
        }
    }

    return (
        <div className="delete-popup-overlay-um">
            <div className="delete-popup-content-um">
                <div className="delete-file-header-um">
                    <h2 className="delete-file-title-um">{form === "user" ? "Delete User" : "Remove User"}</h2>
                    <button className="delete-file-close-um" onClick={() => setIsDeleteModalOpen(false)}>×</button>
                </div>

                <div className="delete-file-group-um">
                    <div className="delete-file-text-um">{message()}</div>
                    <div>{userToDelete?.username}</div>
                </div>

                <div className="delete-file-buttons-um">
                    <button className="delete-file-button-delete-um" onClick={() => deleteUser(userToDelete._id)}>
                        {form === "user" ? 'Delete' : "Remove"}
                    </button>
                    <button className="delete-file-button-cancel-um" onClick={() => setIsDeleteModalOpen(false)}>
                        Keep
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletePopupUM;