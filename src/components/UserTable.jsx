import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

const UserTable = ({ filteredUsers, openEditModal, setUserToDelete, setIsDeleteModalOpen, formatRole, loggedInUserId }) => {
    return (
        <div className="table-container-user">
            <table>
                <thead>
                    <tr>
                        <th className="doc-num-user">Nr.</th>
                        <th className="col-name-user">Username</th>
                        <th className="col-role-user">Role</th>
                        <th className="col-action-user">Action</th>
                        <th className="col-action-user">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user, index) => (
                        <tr key={user._id}>
                            <td className="col">{index + 1}</td>
                            <td className="col">{user.username}</td>
                            <td className="col">{formatRole(user.role)}</td>
                            <td className="col">
                                {user._id !== loggedInUserId && (
                                    <button
                                        className="action-button-user edit-button-user"
                                        onClick={() => openEditModal(user)}
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} />
                                    </button>
                                )}
                            </td>
                            <td className="col">
                                {user._id !== loggedInUserId && (
                                    <button
                                        className="action-button-user delete-button-user"
                                        onClick={() => {
                                            setUserToDelete(user);
                                            setIsDeleteModalOpen(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
