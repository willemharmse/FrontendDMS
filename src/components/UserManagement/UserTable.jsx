import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './UserTable.css';

const UserTable = ({ filteredUsers, openEditModal, setUserToDelete, setIsDeleteModalOpen, formatRole, loggedInUserId }) => {
    const [isMenuOpenUser, setIsMenuOpenUser] = useState(false);
    const [isMenuOpenRole, setIsMenuOpenRole] = useState(false);
    const [usernameFilter, setUsernameFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");

    const toggleMenuUser = () => {
        setIsMenuOpenUser((prevState) => !prevState);
    };

    const toggleMenuRole = () => {
        setIsMenuOpenRole((prevState) => !prevState);
    };

    const handleUsernameFilterChange = (e) => {
        setUsernameFilter(e.target.value.toLowerCase());
    };

    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value.toLowerCase());
    };

    const filteredUsersList = filteredUsers.filter((user) =>
        user.username.toLowerCase().includes(usernameFilter) &&
        user.role.toLowerCase().includes(roleFilter)
    );

    return (
        <div className="table-container-user">
            <table>
                <thead>
                    <tr>
                        <th className="doc-num-user">Nr</th>
                        <th className="col-name-user">
                            <div className="name-container-user">
                                <span className="username-title" onClick={toggleMenuUser}>Username</span>
                                {isMenuOpenUser && (
                                    <div
                                        className="name-menu-user"
                                        onMouseLeave={() => setIsMenuOpenUser(false)}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Filter by username"
                                            value={usernameFilter}
                                            onChange={handleUsernameFilterChange}
                                            className="filter-input"
                                        />
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className="col-role-user">
                            <div className="role-container-user">
                                <span className="role-title" onClick={toggleMenuRole}>Role</span>
                                {isMenuOpenRole && (
                                    <div
                                        className="role-menu-user"
                                        onMouseLeave={() => setIsMenuOpenRole(false)}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Filter by role"
                                            value={roleFilter}
                                            onChange={handleRoleFilterChange}
                                            className="filter-input"
                                        />
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className="col-action-user">Edit</th>
                        <th className="col-action-user">Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsersList.map((user, index) => (
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
