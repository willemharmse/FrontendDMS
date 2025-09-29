import React, { useEffect, useState } from "react";

const SaveAsInductionPopup = ({ onClose, saveAs, current, type, userID, create, standard = false, special = false }) => {
    const [title, setTitle] = useState(current);
    const [drafts, setDrafts] = useState([]);

    // 1) Fetch whenever the inputs that drive your route change
    useEffect(() => {
        let isMounted = true;
        async function loadDrafts() {
            let route;
            route = `visitorDrafts/getDrafts/${userID}`
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/${route}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        Accept: "application/json",
                    },
                });
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();
                if (isMounted) setDrafts(data);
            } catch (err) {
                console.error("Fetch drafts failed:", err);
            }
        }
        loadDrafts();
        return () => { isMounted = false; };
    }, [userID, type, create]);

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
    };

    const handleSave = () => {

        // 2) Compute existing titles right here
        const existingTitles = drafts.map(d => d.formData?.courseTitle ?? "");
        console.log("▶ title:", title);
        console.log("▶ existingTitles:", existingTitles);
        let finalTitle = title;
        if (existingTitles.includes(title)) {
            let counter = 1;
            let candidate = `${title} (${counter})`;
            while (existingTitles.includes(candidate)) {
                counter += 1;
                candidate = `${title} (${counter})`;
            }
            finalTitle = candidate;
        }

        // 3) Fire your save callback
        saveAs(finalTitle);

        // 4) Close the popup if that’s desirable
        onClose();
    };

    return (
        <div className="saveAs-popup-overlay">
            <div className="saveAs-popup-content">
                <div className="saveAs-date-header">
                    <h2 className="saveAs-date-title">Save Draft As</h2>
                    <button className="saveAs-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="saveAs-date-group">
                    <label className="saveAs-date-label" htmlFor="email">New Draft Title</label>
                    <span className="saveAs-date-label-tc">
                        Insert the title that should be used for the new draft that will be saved.
                    </span>
                    <textarea
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder={`Insert the new title`}
                        className="saveAs-popup-input"
                    />
                </div>

                <div className="saveAs-date-buttons">
                    <button onClick={handleSave} className="saveAs-date-button">Save Draft</button>
                </div>
            </div>
        </div>
    );
};

export default SaveAsInductionPopup;
