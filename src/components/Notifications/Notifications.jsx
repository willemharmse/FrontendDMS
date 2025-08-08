import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTimes, faBrush, faBroom } from "@fortawesome/free-solid-svg-icons";

const Notifications = ({ setClose, getCount }) => {
    const [notifications, setNotifications] = useState([]);
    const [selectedPill, setSelectedPill] = useState("Actions");

    useEffect(() => {
        const getNotifs = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch notifications");
                }

                const data = await response.json();

                setNotifications(data.notifications);
                getCount();
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            }
        };

        getNotifs();
    }, []);

    const clearAllNotifications = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/clearRead/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }

            setNotifications(prev =>
                prev.map(n => ({
                    ...n,
                    read: true
                }))
            );

            getCount();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/clearNotifs/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }

            setNotifications([]);
            getCount();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/remove/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }

            setNotifications((prev) => prev.filter((n) => n._id !== id));
            getCount();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/read/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to mark notification as read");
            }

            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            getCount();
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    // Function to format the date and time
    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleString(); // You can customize this format as per your preference
    };

    const filteredNotifications = selectedPill === "All"
        ? notifications
        : notifications.filter(n => n.type?.toLowerCase() === selectedPill.toLowerCase());

    return (
        <div className="notifications-modal-container" onMouseLeave={() => setClose(false)}>
            <div className="notifications-modal-box">
                <div className="notifications-modal-title">
                    <span>Notifications</span>
                    <div className="notifications-title-icons">
                        <FontAwesomeIcon
                            icon={faBroom}
                            title="Mark All As Read"
                            className="notifications-clear-all-icon"
                            onClick={clearAllNotifications}
                        />
                        <FontAwesomeIcon
                            icon={faTrash}
                            title="Delete All Notifications"
                            className="notifications-close-icon"
                            onClick={deleteAllNotifications}
                        />
                    </div>
                </div>
                <div className="notifications-pill-bar">
                    {["Actions", "Admin", "All"].map((pill, idx) => (
                        <div
                            key={idx}
                            className={`notifications-pill ${selectedPill === pill ? 'active' : ''}`}
                            onClick={() => setSelectedPill(pill)}
                        >
                            {pill}
                        </div>
                    ))}
                </div>
                {filteredNotifications.length === 0 ? (
                    <div className="notifications-modal-empty">
                        {selectedPill === "All" ? "No notifications" : `No notifications of this type`}
                    </div>
                ) : (
                    <ul className="notifications-modal-list">
                        {filteredNotifications.map((note) => (
                            <li
                                key={note._id}
                                className={`notifications-modal-item ${note.read ? 'notifications-read' : 'notifications-unread'}`}
                            >
                                <div className="notifications-item-content" onClick={() => markAsRead(note._id)}>
                                    <div className="notifications-item-text">
                                        {note.notification}
                                    </div>
                                    <div className="notifications-item-time">
                                        {formatDateTime(note.timestamp)}
                                    </div>
                                </div>
                                <FontAwesomeIcon
                                    icon={faTrash}
                                    title="Remove Notification"
                                    className="notifications-trash-icon"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering markAsRead
                                        deleteNotification(note._id);
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Notifications;
