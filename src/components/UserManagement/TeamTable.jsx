import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import './UserTable.css';
import './TeamTable.css';

const TeamTable = ({ team, setUserToDelete, setIsDeleteModalOpen, formatRole, loggedInUserId }) => {
    const [isMenuOpenUser, setIsMenuOpenUser] = useState(false);
    const [isMenuOpenRole, setIsMenuOpenRole] = useState(false);

    const toggleMenuUser = () => {
        setIsMenuOpenUser((prevState) => !prevState);
    };

    const toggleMenuRole = () => {
        setIsMenuOpenRole((prevState) => !prevState);
    };

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
                        <th className="doc-num-team">Nr</th>
                        <th className="col-name-team">
                            <div className="name-container-user">
                                <span className="username-title" onClick={toggleMenuUser}>Username</span>
                            </div>
                        </th>
                        <th className="col-role-team">
                            <div className="role-container-user">
                                <span className="role-title" onClick={toggleMenuRole}>Role</span>
                            </div>
                        </th>
                        <th className="col-day-team">Date Added</th>
                        <th className="col-action-user">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {team.map((user, index) => (
                        <tr key={user._id}>
                            <td className="col-um">{index + 1}</td>
                            <td className="col-um">{user.username}</td>
                            <td className="col-um">{formatRole(user.role)}</td>
                            <td className="col-um">{user.dateAdded ? formatDate(user.dateAdded) : ""}</td>
                            <td className="col-um">
                                <button
                                    className={"action-button-user delete-button-user"}
                                    onClick={() => {
                                        setUserToDelete(user);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    disabled={!(user._id !== loggedInUserId)}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
};

export default TeamTable;
