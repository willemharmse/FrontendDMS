import React, { useState, useEffect, useRef } from "react";
import "./SharePage.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast, ToastContainer } from 'react-toastify';
import { faSpinner, faTrash, faTrashCan, faX, faSearch } from '@fortawesome/free-solid-svg-icons';
import RemoveShare from "./RemoveShare";

const SharePage = ({ userIDs, popupVisible, closePopup, setUserIDs, saveData, userID }) => {
    const [usersData, setUsersData] = useState([]);
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(userIDs);
    const [searchTerm, setSearchTerm] = useState("");
    const [userToRemove, setUserToRemove] = useState(null); // Track the user to be removed
    const [showConfirmation, setShowConfirmation] = useState(false);

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

    const clearSearch = () => {
        setSearchTerm("");
    };

    useEffect(() => {
        fetchUsers();
        console.log("Users:", userIDs);
        console.log("Users:", selectedUsers);
    }, []);

    const handleCheckboxChange = (userId, username) => {
        if (selectedUsers.includes(userId)) {
            // If it's in userIDs, show confirmation
            if (userIDs.includes(userId)) {
                setUserToRemove(userId);
                setShowConfirmation(true);
                setUsername(username);
            } else {
                // Just remove the user if selected after the popup opened
                setSelectedUsers(prev => prev.filter(id => id !== userId));
            }
        } else {
            // If the user isn't selected, just add them to the list
            setSelectedUsers(prev => [...prev, userId]);
        }
    };

    const handleConfirmRemoval = () => {
        if (userToRemove !== null) {
            // Remove the user from the selected list and userIDs
            setSelectedUsers(prev => prev.filter(id => id !== userToRemove));
            setUserIDs(prev => prev.filter(id => id !== userToRemove)); // Update the parent component state
            setShowConfirmation(false);
            setUserToRemove(null);
        }
    };

    const handleCancelRemoval = () => {
        setShowConfirmation(false);
        setUserToRemove(null);
    };

    const handleSaveSelection = async () => {
        setUserIDs(selectedUsers);
        saveData(selectedUsers);

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("The draft has been shared successfully.", {
            closeButton: false,
            autoClose: 1500, // 1.5 seconds
            style: {
                textAlign: 'center'
            }
        });

        closePopup();
    };

    return (
        <div className="popup-overlay-share">
            <div className="popup-content-share">
                <div className="review-date-header">
                    <h2 className="review-date-title">Share Draft</h2>
                    <button className="review-date-close" onClick={closePopup} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <div className="share-input-container">
                        <input
                            className="search-input-share"
                            type="text"
                            placeholder="Search member"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>
                </div>

                <div className="share-table-group">
                    <div className="popup-table-wrapper-share">
                        <table className="popup-table font-fam">
                            <thead className="share-headers">
                                <tr>
                                    <th className="inp-size-share">Select</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users
                                        .filter(user => user._id !== userID) // ✅ Exclude the logged-in user
                                        .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase())) // ✅ Apply search filter
                                        .sort((a, b) => a.username.localeCompare(b.username)) // ✅ Sort users alphabetically
                                        .map(user => (
                                            <tr key={user._id} onClick={() => handleCheckboxChange(user._id, user.username)} style={{ cursor: "pointer" }}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox-inp-share"
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
                <div className="share-buttons">
                    <button onClick={handleSaveSelection} className="share-button">Save Selection</button>
                </div>
            </div>
            {showConfirmation && (<RemoveShare handleCancelRemoval={handleCancelRemoval} handleConfirmRemoval={handleConfirmRemoval} setRemove={setShowConfirmation} user={username} />)}
        </div>
    );
};

export default SharePage;
