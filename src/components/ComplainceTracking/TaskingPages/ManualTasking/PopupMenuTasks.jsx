import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PopupMenuTasks = ({ isOpen, setHoveredId, hoveredId, file, view, allowed, onAddSubTask, onViewSubtasks }) => {
    const navigate = useNavigate();
    const popupRef = useRef(null);
    const [position, setPosition] = useState("below");
    const [subtaskCount, setSubtaskCount] = useState(0);
    const [subtasks, setSubtasks] = useState([]);

    useEffect(() => {
        if (isOpen && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.top;
            const spaceAbove = rect.top;

            // If not enough space below and more above, show above
            if (spaceBelow < rect.height + 20 && spaceAbove > rect.height) {
                setPosition("above");
            } else {
                setPosition("below");
            }
        }
    }, [isOpen]);

    // Only main tasks (not sub-tasks themselves) can have sub-tasks, so only
    // check for sub-tasks when this popup is open for a non-sub-task.
    useEffect(() => {
        const fetchSubtasks = async () => {
            if (!isOpen || !allowed || !file?._id || file?.isSubTask) {
                setSubtaskCount(0);
                setSubtasks([]);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${process.env.REACT_APP_URL}/api/complainceTasks/${file._id}/subtasks`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const fetched = response.data?.tasks ?? [];
                setSubtasks(fetched);
                setSubtaskCount(fetched.length);
            } catch (error) {
                setSubtasks([]);
                setSubtaskCount(0);
            }
        };

        fetchSubtasks();
    }, [isOpen, allowed, file?._id, file?.isSubTask]);

    const isSubTask = !!file?.isSubTask;
    // On "My Tasks" (viewer), a manual task must be accepted before a sub task can be added.
    const isAcceptedOrNotViewer = view !== "viewer" || file?.acceptanceStatus === "Accepted";
    const canHaveSubtasks = allowed && !isSubTask;
    const canAddSubtask = canHaveSubtasks && isAcceptedOrNotViewer;

    return (
        <div className="popup-menu-container-FI" style={{ marginTop: "30px" }}>
            <div className="popup-menu-container-pub-files">
                {(isOpen && allowed) && (
                    <div className="popup-content-pub-files"
                        ref={popupRef}
                        onMouseEnter={() => setHoveredId(file._id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <ul>
                            <li onClick={() => navigate(`/manual-tasks-history/${file._id}`)}>Version History</li>

                            {canAddSubtask && (
                                <li
                                    onClick={() => {
                                        onAddSubTask?.(file);
                                        setHoveredId(null);
                                    }}
                                >
                                    Add Sub Task
                                </li>
                            )}

                            {canHaveSubtasks && subtaskCount > 0 && (
                                <li
                                    onClick={() => {
                                        onViewSubtasks?.(file, subtasks);
                                        setHoveredId(null);
                                    }}
                                >
                                    View All Sub Tasks
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopupMenuTasks;