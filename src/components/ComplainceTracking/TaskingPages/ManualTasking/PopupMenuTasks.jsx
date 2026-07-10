import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const POPUP_GAP = 8;

const PopupMenuTasks = ({ isOpen, setHoveredId, hoveredId, file, view, allowed, onAddSubTask, onViewSubtasks, onViewMainTask }) => {
    const navigate = useNavigate();
    // anchorRef sits where this component is actually inserted in the row.
    // It's used only to find the real anchor text (its previous sibling) —
    // the "marginTop: 30px" wrapper itself is not aligned with the visible
    // text, so it can't be used as the position reference.
    const anchorRef = useRef(null);
    const menuRef = useRef(null);
    const [position, setPosition] = useState("below");
    const [coords, setCoords] = useState(null);
    const [subtaskCount, setSubtaskCount] = useState(0);
    const [subtasks, setSubtasks] = useState([]);

    const isSubTask = !!file?.isSubTask;
    // On "My Tasks" (viewer), a manual task must be accepted before a sub task can be added.
    const isAcceptedOrNotViewer = view !== "viewer" || file?.acceptanceStatus === "Accepted";
    const canHaveSubtasks = allowed && !isSubTask;
    const canAddSubtask = canHaveSubtasks && isAcceptedOrNotViewer;
    const menuIsVisible = isOpen && allowed;

    // Position the menu using real viewport coordinates (via a portal to
    // document.body) so it can never be misplaced by a scrollable or
    // positioned ancestor (e.g. the table) sitting between it and the anchor.
    useLayoutEffect(() => {
        if (!menuIsVisible) {
            setCoords(null);
            return;
        }

        const recalculatePosition = () => {
            // The actual visible anchor is the text/element this component
            // was rendered right after — not this wrapper div itself.
            const referenceEl = anchorRef.current?.previousElementSibling || anchorRef.current;
            if (!referenceEl) return;

            const anchorRect = referenceEl.getBoundingClientRect();
            const menuHeight = menuRef.current?.getBoundingClientRect().height || 0;
            const spaceBelow = window.innerHeight - anchorRect.bottom;
            const spaceAbove = anchorRect.top;

            const showAbove =
                spaceBelow < menuHeight + POPUP_GAP + 20 && spaceAbove > menuHeight + POPUP_GAP;

            setPosition(showAbove ? "above" : "below");
            setCoords({
                left: anchorRect.left,
                top: showAbove
                    ? anchorRect.top - menuHeight - POPUP_GAP
                    : anchorRect.bottom + POPUP_GAP,
            });
        };

        // Measure once now, then again on the next frame once the menu has
        // actually rendered its real content/height.
        recalculatePosition();
        const raf = requestAnimationFrame(recalculatePosition);

        window.addEventListener("resize", recalculatePosition);
        window.addEventListener("scroll", recalculatePosition, true);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", recalculatePosition);
            window.removeEventListener("scroll", recalculatePosition, true);
        };
    }, [menuIsVisible, subtaskCount, canAddSubtask, isSubTask]);

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

    const menu = menuIsVisible ? (
        <div
            className={`popup-content-pub-files popup-content-pub-files-${position}`}
            ref={menuRef}
            onMouseEnter={() => setHoveredId(file._id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
                position: "fixed",
                top: coords ? coords.top : 0,
                left: coords ? coords.left : 0,
                visibility: coords ? "visible" : "hidden",
                zIndex: 100000,
            }}
        >
            <ul style={{ fontSize: "13px" }}>
                <li onClick={() => navigate(`/FrontendDMS/manual-tasks-history/${file._id}`)}>Version History</li>

                {isSubTask && (
                    <li
                        onClick={() => {
                            onViewMainTask?.(file);
                            setHoveredId(null);
                        }}
                    >
                        View Main Task
                    </li>
                )}

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
    ) : null;

    return (
        <div className="popup-menu-container-FI" ref={anchorRef}>
            <div className="popup-menu-container-pub-files">
                {menu && createPortal(menu, document.body)}
            </div>
        </div>
    );
};

export default PopupMenuTasks;