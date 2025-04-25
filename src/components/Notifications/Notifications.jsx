import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const Notifications = ({ setClose }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const getNotifs = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/notifications/`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        "Content-Type": "application/json", // optional but often useful
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch notifications");
                }

                const data = await response.json();

                console.log(data);
                setNotifications(data.notifications);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            }
        };

        getNotifs();
    }, []);

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

            const data = await response.json();

            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    return (
        <div className="notifications-modal-container" onMouseLeave={() => setClose(false)}>
            <div className="notifications-modal-box">
                <div className="notifications-modal-title">Notifications</div>
                {notifications.length === 0 ? (
                    <div className="notifications-modal-empty">No notifications</div>
                ) : (
                    <ul className="notifications-modal-list">
                        {notifications.map((note, index) => (
                            <li
                                key={note._id}
                                className={`notifications-modal-item ${note.read ? 'notifications-read' : 'notifications-unread'}`}
                            >
                                <div
                                    className="notifications-item-text"
                                    onClick={() => markAsRead(note._id)}
                                >
                                    {note.notification}
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