import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './UserTable.css';

const UserTable = ({ filteredUsers, openEditModal, setUserToDelete, setIsDeleteModalOpen, formatRole, loggedInUserId }) => {
    const [isMenuOpenUser, setIsMenuOpenUser] = useState(false);
    const [isMenuOpenRole, setIsMenuOpenRole] = useState(false);
    const [usernameFilter, setUsernameFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const navigate = useNavigate();

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

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${day}.${month}.${year}`;
    };

    return (
        <div className="table-container-user">
            <table>
                <thead>
                    <tr>
                        <th className="user-man-num-user">Nr</th>
                        <th className="user-man-name-user">Username</th>
                        <th className="user-man-email-user">Email</th>
                        <th className="user-man-role-user">Role</th>
                        <th className="user-man-day-user">Date Added</th>
                        <th className="user-man-rt-user">Reporting To</th>
                        <th className="user-man-dept-user">Department</th>
                        <th className="user-man-des-user">Designation</th>
                        <th className="user-man-action-user">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsersList.map((user, index) => (
                        <tr key={user._id}>
                            <td className="col-um">{index + 1}</td>
                            <td className="col-um" onClick={() => navigate(`/userActivity/${user._id}`)} style={{ cursor: "pointer" }}>{user.username}</td>
                            <td className="col-um">{user.email ? user.email : ""}</td>
                            <td className="col-um">{formatRole(user.role)}</td>
                            <td className="col-um">{user.dateAdded ? formatDate(user.dateAdded) : ""}</td>
                            <td className="col-um">{user.reportingTo ? user.reportingTo.username : "N/A"}</td>
                            <td className="col-um">{user.department ? user.department : "N/A"}</td>
                            <td className="col-um">{user.designation ? user.designation : "N/A"}</td>
                            <td className="col-um">
                                <div className='inline-actions-um'>
                                    <button
                                        className={user._id !== loggedInUserId ? `action-button-user edit-button-user` : "action-button-user edit-button-user-hidden"}
                                        onClick={() => openEditModal(user)}
                                        disabled={!(user._id !== loggedInUserId)}
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} title="Edit User" />
                                    </button>
                                    <button
                                        className={user._id !== loggedInUserId ? "action-button-user delete-button-user" : "action-button-user edit-button-user-hidden"}
                                        onClick={() => {
                                            setUserToDelete(user);
                                            setIsDeleteModalOpen(true);
                                        }}
                                        disabled={!(user._id !== loggedInUserId)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} title="Delete User" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
};

export default UserTable;
