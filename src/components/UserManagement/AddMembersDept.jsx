import React, { useState, useEffect, useRef } from "react";
import "./AddMembersDept.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast, ToastContainer } from 'react-toastify';
import { faSpinner, faTrash, faTrashCan, faX, faSearch } from '@fortawesome/free-solid-svg-icons';

const AddMembersDept = ({ deptID, popupVisible, closePopup }) => {
    const [usersData, setUsersData] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const initiallySelectedUsers = useRef(new Set());

    const fetchValues = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/members/${deptID}`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }

            const data = await response.json();

            setUsersData(data.members);
        } catch (error) {
            console.error("Error fetching depteviations:", error)
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {
                    //'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            // Sort users by a specific property, e.g., 'name'
            const sortedUsers = data.users.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.username.localeCompare(b.username);
            });

            setUsers(sortedUsers);
        } catch (error) {
            console.error("Error fetching depteviations:", error)
        }
    };

    useEffect(() => {
        if (popupVisible) {
            const matchedUsers = users.filter(user => usersData.some(dataUser => dataUser._id === user._id));
            setSelectedUsers(matchedUsers.map(user => user._id));
            initiallySelectedUsers.current = new Set(matchedUsers.map(user => user._id));
        }
    }, [popupVisible, usersData, users]);

    const clearSearch = () => {
        setSearchTerm("");
    };

    useEffect(() => {
        fetchValues();
        fetchUsers();
    }, []);

    const handleCheckboxChange = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSaveSelection = async () => {
        const dataToSend = {
            departmentId: deptID,
            users: selectedUsers
        }
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/department/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });
            if (!response.ok) throw new Error('Failed to create department');

            toast.success("Members Added.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })

            closePopup();
        } catch (error) {
            toast.error("Members could not be added.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            })
        }
    };

    return (
        <div className="popup-overlay-dept">
            <div className="popup-content-dept">
                <div className="review-date-header">
                    <h2 className="review-date-title">Add Members</h2>
                    <button className="review-date-close" onClick={closePopup}>×</button>
                </div>

                <div className="review-date-group">
                    <div className="dept-input-container">
                        <input
                            className="search-input-dept"
                            type="text"
                            placeholder="Search member"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i>)}
                        {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>
                </div>

                <div className="dept-table-group">
                    <div className="popup-table-wrapper-dept">
                        <table className="popup-table font-fam">
                            <thead className="dept-headers">
                                <tr>
                                    <th className="inp-size-dept">Select</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users
                                        .filter(user => !initiallySelectedUsers.current.has(user._id)) // ❌ Exclude only initially selected users
                                        .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase())) // ✅ Apply search filter
                                        .sort((a, b) => a.username.localeCompare(b.username)) // ✅ Sort users alphabetically
                                        .map(user => (
                                            <tr key={user._id} onClick={() => handleCheckboxChange(user._id)} style={{ cursor: "pointer" }}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox-inp-dept"
                                                        checked={selectedUsers.includes(user._id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => handleCheckboxChange(user._id)}
                                                    />
                                                </td>
                                                <td>{user.username}</td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">Loading users...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="dept-buttons">
                    <button onClick={handleSaveSelection} className="dept-button">Save Selection</button>
                </div>
            </div>
        </div>
    );
};

export default AddMembersDept;
