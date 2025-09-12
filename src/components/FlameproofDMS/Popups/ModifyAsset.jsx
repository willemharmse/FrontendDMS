import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "./ModifyAsset.css";

const ModifyAsset = ({ isOpen, onClose, asset, refresh, siteID, area }) => {
    const [newAssetNumber, setNewAssetNumber] = useState(asset?.assetNr || "");
    const [areas, setAreas] = useState([]);
    const [newArea, setNewArea] = useState(asset?.operationalArea || "");
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [newOwner, setNewOwner] = useState(asset?.departmentHead || "");
    const [newHead, setNewHead] = useState(asset?.assetOwner || "");

    useEffect(() => {
        setNewAssetNumber(asset?.assetNr || "");
        setNewArea(asset?.operationalArea || "");
    }, [asset]);

    const handleAssetChange = (e) => {
        setNewAssetNumber(e.target.value);
    };

    const norm = (s) =>
        (s ?? "")
            .normalize("NFC")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof//getSiteAssetNumbers/by-asset/${asset?._id}`);
                if (!response.ok) throw new Error("Failed to fetch asset numbers");
                const data = await response.json();

                const filtered = (data.assetNumbers || []).filter(a => a.assetNr !== asset?.assetNr);

                setAssets(filtered);
                console.log(filtered);
            } catch (error) {
                console.log(error);
            }
        };

        const fetchAreas = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getUploadAreas`);
                if (!response.ok) throw new Error("Failed to fetch areas");
                const data = await response.json();

                const sorted = (data.areas || []).sort((a, b) => a.area.localeCompare(b.area));

                setAreas(sorted);

                const current = asset?.operationalArea || "";
                const exists = sorted.some(x => x.area === current);

                const withCurrent = !exists && current
                    ? [{ _id: "__current__", area: current }, ...sorted]
                    : sorted;
                setAreas(withCurrent);

                if (!current) setNewArea("");
            } catch (error) {
                console.log(error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
                if (!response.ok) throw new Error("Failed to fetch users");

                const data = await response.json();
                const users = Array.isArray(data.users) ? data.users : [];

                // Sort alphabetically (case-insensitive)
                let sortedUsers = users.sort((a, b) =>
                    a.username.localeCompare(b.username, undefined, { sensitivity: "base" })
                );

                const currentOwner = asset?.assetOwner || "";
                const currentHead = asset?.departmentHead || "";

                // Check for Owner in list
                const ownerExists = sortedUsers.some(
                    (u) => norm(u.username) === norm(currentOwner)
                );
                if (currentOwner && !ownerExists) {
                    sortedUsers = [
                        { _id: "__current_owner__", username: currentOwner },
                        ...sortedUsers,
                    ];
                }

                // Check for Head in list
                const headExists = sortedUsers.some(
                    (u) => norm(u.username) === norm(currentHead)
                );
                if (currentHead && !headExists) {
                    sortedUsers = [
                        { _id: "__current_head__", username: currentHead },
                        ...sortedUsers,
                    ];
                }

                setUsers(sortedUsers);

                // Set state for selects
                setNewOwner(currentOwner && ownerExists ? currentOwner : currentOwner || "");
                setNewHead(currentHead && headExists ? currentHead : currentHead || "");
            } catch (error) {
                setError(error.message);
            }
        };

        if (isOpen) {
            fetchAreas();
            fetchValues();
            fetchUsers();
        }
    }, [isOpen, siteID, asset]);

    const validateAssetNumber = (assetNr) => {
        return assets.some(asset => asset.assetNr.toLowerCase() === assetNr.toLowerCase());
    };

    const submitReviewDate = async () => {
        if (!newAssetNumber.trim()) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please enter a valid asset number.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (newArea === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please select an area.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (newOwner === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please select an owner.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (newHead === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please select a department head.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (validateAssetNumber(newAssetNumber)) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Asset number is already used in this site.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_URL}/api/flameproof/modifyAsset/${asset._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ newAssetNumber: newAssetNumber.trim(), newArea, newOwner, newHead }),
            });

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Successfully modified asset.", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            });

            setNewAssetNumber("");
            refresh();

            onClose();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Could not modify asset.", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modify-asset-overlay">
            <div className="modify-asset-content">
                <div className="modify-asset-header">
                    <h2 className="modify-asset-title">Modify Asset</h2>
                    <button className="modify-asset-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="modify-asset-body">

                    <div className="modify-asset-group">
                        <label className="modify-asset-label">Asset Number</label>
                        <input
                            type="text"
                            value={newAssetNumber}
                            onChange={handleAssetChange}
                            placeholder="Insert Asset Number"
                            className="modify-asset-input"
                        />
                    </div>

                    <div className="modify-asset-group">
                        <label className="modify-asset-label">Area</label>
                        <div className="modify-asset-select-container">
                            <select
                                value={newArea ?? ""} // keep controlled
                                onChange={(e) => setNewArea(e.target.value)}
                                autoComplete="off"
                                className={
                                    (newArea ?? "") === ""
                                        ? "modify-asset-input-select font-fam def-colour"
                                        : "modify-asset-input-select font-fam"
                                }
                            >
                                <option value="" className="def-colour">Select Area</option>
                                {areas.map((ar) => (
                                    <option key={ar._id} value={ar.area} className="norm-colour">
                                        {ar.area}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="modify-asset-group">
                        <label className="modify-asset-label">Asset Owner</label>
                        <div className="modify-asset-select-container">
                            <select
                                value={newOwner ?? ""} // keep controlled
                                onChange={(e) => setNewOwner(e.target.value)}
                                autoComplete="off"
                                className={
                                    (newOwner ?? "") === ""
                                        ? "modify-asset-input-select font-fam def-colour"
                                        : "modify-asset-input-select font-fam"
                                }
                            >
                                <option value={""} className="def-colour">Select Asset Owner</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user.username} className="norm-colour">
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="modify-asset-group">
                        <label className="modify-asset-label">Department Head</label>
                        <div className="modify-asset-select-container">
                            <select
                                value={newHead ?? ""} // keep controlled
                                onChange={(e) => setNewHead(e.target.value)}
                                autoComplete="off"
                                className={
                                    (newHead ?? "") === ""
                                        ? "modify-asset-input-select font-fam def-colour"
                                        : "modify-asset-input-select font-fam"
                                }
                            >
                                <option value={""} className="def-colour">Select Department Head</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user.username} className="norm-colour">
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="modify-asset-buttons">
                    <button onClick={submitReviewDate} className="modify-asset-button">Save</button>
                </div>
            </div>
        </div >
    );
};

export default ModifyAsset;
