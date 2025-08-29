import React, { useState, useEffect, useRef } from "react";
import "./UploadChoiceFPM.css";
import { toast } from "react-toastify";

const UploadChoiceFPM = ({ setClose, setPopup, setAsset }) => {
    const [assetNr, setAssetNr] = useState("");
    const [type, setType] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [showAssetDropdown, setShowAssetDropdown] = useState(false);
    const assetRef = useRef(null);
    const [assetNrs, setAssetNrs] = useState([]);           // [{ _id, assetNr, master }]
    const [filteredAssetNrs, setFilteredAssetNrs] = useState([]);

    const closeAllDropdowns = () => setShowAssetDropdown(false);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/flameproof/getAssetNumbers`);
                if (!response.ok) throw new Error("Failed to fetch asset numbers");
                const data = await response.json();

                // Defensive: support either array of strings OR array of objects
                const normalized = (data.assetNumbers || []).map(a =>
                    typeof a === "string" ? { assetNr: a, _id: a, master: false } : a
                );

                setAssetNrs(normalized);
            } catch (error) {
                console.log(error);
            }
        };
        fetchValues();
    }, []);

    // Helper: currently selected asset object (if any)
    const selectedAsset = assetNrs.find(a => a.assetNr === assetNr) || null;
    const selectedAssetHasMaster = !!selectedAsset?.master;

    // If user picked type first, and then chooses an asset that already has a master:
    // clear the type and notify them.
    useEffect(() => {
        if (!assetNr) return;
        if (type === "master" && selectedAssetHasMaster) {
            setType("");
        }
    }, [assetNr, type, selectedAssetHasMaster]);

    const submit = () => {
        if (!assetNr || !type) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in all the values.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: "center" }
            });
            return;
        }

        // Validate that asset exists
        if (!assetNrs.some(item => item.assetNr === assetNr)) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please select a valid asset number.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: "center" }
            });
            return;
        }

        setAssetNr("");
        setType("");
        setPopup(type);
        setAsset(assetNr);
        setClose();
    };

    useEffect(() => {
        const popupSelector = ".floating-dropdown";

        const closeDropdowns = () => setShowAssetDropdown(false);

        const handleClickOutside = (e) => {
            const outside = !e.target.closest(popupSelector) && !e.target.closest("input");
            if (outside) closeDropdowns();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showAssetDropdown]);

    const positionDropdownToInput = () => {
        const el = assetRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const handleAssetInput = (value) => {
        closeAllDropdowns();
        setAssetNr(value);

        // Filter over objects by their assetNr field
        const matches = assetNrs.filter(opt =>
            (opt.assetNr || "").toLowerCase().includes((value || "").toLowerCase())
        );
        setFilteredAssetNrs(matches);
        setShowAssetDropdown(true);
        positionDropdownToInput();
    };

    const handleAssetFocus = () => {
        closeAllDropdowns();
        setFilteredAssetNrs(assetNrs);
        setShowAssetDropdown(true);
        positionDropdownToInput();
    };

    const selectAssetSuggestion = (value) => {
        setAssetNr(value);
        setShowAssetDropdown(false);
    };

    return (
        <div className="popup-overlay-fpm-upload-choice">
            <div className="popup-content-fpm-upload-choice">
                <div className="review-date-header">
                    <h2 className="review-date-title">Upload Certificate</h2>
                    <button className="review-date-close" onClick={setClose} title="Close Popup">×</button>
                </div>

                <div className="fpm-upload-choice-table-group">
                    <div className="fpm-popup-additional-row">
                        <div className="fpm-popup-half ">
                            <h3 className="fpm-font-fam-labels">
                                Asset Number <span className="required-field">*</span>
                            </h3>
                            <div className="fpm-select-container">
                                <input
                                    type="text"
                                    name="assetNr"
                                    value={assetNr || ""}
                                    onChange={e => handleAssetInput(e.target.value)}
                                    onFocus={handleAssetFocus}
                                    ref={assetRef}
                                    autoComplete="off"
                                    className="fpm-input-select-half font-fam"
                                    placeholder="Select Asset Number"
                                />
                            </div>
                        </div>

                        <div className="fpm-popup-half ">
                            <h3 className="fpm-font-fam-labels">
                                Certificate Type <span className="required-field">*</span>
                            </h3>
                            <div className="fpm-select-container-2">
                                <select
                                    name="certificateType"
                                    value={type || ""}
                                    onChange={(e) => {
                                        const nextType = e.target.value;
                                        // Prevent choosing master if the selected asset already has a master
                                        if (nextType === "master" && selectedAssetHasMaster) {
                                            toast.dismiss();
                                            toast.clearWaitingQueue();
                                            toast.error("This asset already has a master certificate.", {
                                                closeButton: true,
                                                autoClose: 1200,
                                                style: { textAlign: "center" }
                                            });
                                            return; // do not set the type
                                        }
                                        setType(nextType);
                                    }}
                                    className="fpm-input-select font-fam"
                                    placeholder="Select Certificate Type"
                                    style={{ color: type === "" ? "GrayText" : "black" }}
                                >
                                    <option value="" style={{ color: "GrayText" }}>Select Certificate Type</option>
                                    {/* Disable Master if selected asset already has one */}
                                    {!selectedAssetHasMaster && (<option value="master" style={{ color: "black" }}>Master Certificate</option>)}
                                    <option value="component" style={{ color: "black" }}>Component Certificate</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fpm-upload-choice-footer">
                    <button
                        className="fpm-upload-choice-button"
                        onClick={submit}
                        title="Submit"
                    >
                        Submit
                    </button>
                </div>
            </div>

            {showAssetDropdown && filteredAssetNrs.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: "fixed",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredAssetNrs
                        .slice() // avoid mutating original
                        .sort((a, b) => (a.assetNr || "").localeCompare(b.assetNr || ""))
                        .map((term, i) => (
                            <li key={i} onMouseDown={() => selectAssetSuggestion(term.assetNr)}>
                                {term.assetNr}
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};

export default UploadChoiceFPM;
