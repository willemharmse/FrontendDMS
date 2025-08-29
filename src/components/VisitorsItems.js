import React, { useMemo, useState } from "react";
import "./VisitorsItems.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faTractor, faTrash } from "@fortawesome/free-solid-svg-icons";

const emptyRow = () => ({
    item: "",
    description: "",
    serial: "",
    ownership: "",
    notes: "",
});

const VisitorsItems = () => {
    const [rows, setRows] = useState([emptyRow()]);
    const [confirmed, setConfirmed] = useState(false);

    const pageTitle = "VISITOR ITEMS DECLARATION";
    const introTop = useMemo(
        () =>
            "All visitors are required to declare any personal or company-issued portable items they bring onto the mine. This process helps us maintain site security, protect confidential information, and ensure compliance with mine regulations. Failure to declare items may result in access being denied, confiscation of undeclared items, or further disciplinary or legal action.",
        []
    );

    const mustDeclare =
        "Phones, laptops, tablets, cameras, storage media (USBs, external drives, SD cards), two-way radios, drones, tools, test equipment, medical devices, smartwatches, wearables, prototypes/samples, and any other portable electronic or recording device.";

    const prohibited =
        "Firearms, explosives, alcohol, illegal substances, and unsealed chemicals.";

    // helpers
    const updateRow = (index, field, value) => {
        setRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const insertRowAfter = (index) => {
        setRows((prev) => {
            const next = [...prev];
            next.splice(index + 1, 0, emptyRow());
            return next;
        });
    };

    const deleteRow = (index) => {
        setRows((prev) => {
            if (prev.length === 1) {
                toast.warn("At least one row is required.");
                return prev;
            }
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!confirmed) {
            toast.error("Please confirm that you have declared all items.");
            return;
        }
        toast.success("Form submitted 🎉");
        console.log("Submitted rows:", rows);
    };

    return (
        <div className="visitors-items-container">
            <form className="visitors-items-card" onSubmit={onSubmit}>
                <h1 className="visitors-items-title">{pageTitle}</h1>

                <p className="visitors-items-intro">{introTop}</p>

                <div className="visitors-items-whatyoumust">
                    <div className="visitors-items-what-label">What You Must Declare:</div>
                    <div className="visitors-items-what-text">{mustDeclare}</div>
                </div>

                <div className="visitors-items-prohibited">
                    <span className="visitors-items-prohibited-label">
                        Prohibited without written authorisation:
                    </span>{" "}
                    {prohibited}
                </div>

                {/* Scrollable rows container */}
                <div className="visitors-items-rows-wrap">
                    <div className="visitors-items-grid visitors-items-grid--header">
                        <div>Item</div>
                        <div>Description</div>
                        <div>Serial/ IMEI</div>
                        <div>Ownership</div>
                        <div>Notes/ Accessories</div>
                        <div className="visitors-items-col-actions">Actions</div>
                    </div>

                    <div className="visitors-items-rows-scroll">
                        {rows.map((r, idx) => (
                            <div className="visitors-items-grid" key={`row-${idx}`}>
                                <div>
                                    <input
                                        className="visitors-items-input"
                                        value={r.item}
                                        onChange={(e) => updateRow(idx, "item", e.target.value)}
                                        placeholder="Item (Phone/ Laptop/ Tablet/ Camera/ Storage/ Tools/ Other)"
                                    />
                                </div>
                                <div>
                                    <input
                                        className="visitors-items-input"
                                        value={r.description}
                                        onChange={(e) =>
                                            updateRow(idx, "description", e.target.value)
                                        }
                                        placeholder="Insert Description (Make and Model)"
                                    />
                                </div>
                                <div>
                                    <input
                                        className="visitors-items-input"
                                        value={r.serial}
                                        onChange={(e) => updateRow(idx, "serial", e.target.value)}
                                        placeholder="Insert Serial/ IMEI (If applicable)"
                                    />
                                </div>
                                <div>
                                    <input
                                        className="visitors-items-input"
                                        value={r.ownership}
                                        onChange={(e) => updateRow(idx, "ownership", e.target.value)}
                                        placeholder="Ownership"
                                    />
                                </div>
                                <div>
                                    <input
                                        className="visitors-items-input"
                                        value={r.notes}
                                        onChange={(e) => updateRow(idx, "notes", e.target.value)}
                                        placeholder="Insert Notes/ Accessories (Charger, Case, Lenses)"
                                    />
                                </div>
                                <div className="visitors-items-actions">
                                    {/* Delete current row */}
                                    <button
                                        type="button"
                                        className="visitors-items-btn visitors-items-btn--icon"
                                        title="Delete row"
                                        onClick={() => deleteRow(idx)}
                                        disabled={rows.length === 1}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>

                                    {/* Insert a new row AFTER this one */}
                                    <button
                                        type="button"
                                        className="visitors-items-btn visitors-items-btn--icon"
                                        title="Insert new row after"
                                        onClick={() => insertRowAfter(idx)}
                                    >
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <label className="visitors-items-confirm">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>
                        I confirm that I have declared all the items that I will bring into
                        the mine above. <span className="visitors-items-req">*</span>
                    </span>
                </label>

                <div className="visitors-items-submit-wrap">
                    <button
                        type="submit"
                        className="visitors-items-btn visitors-items-btn--primary"
                        disabled={!confirmed}
                    >
                        Submit
                    </button>
                </div>
            </form>

            <ToastContainer />
        </div>
    );
};

export default VisitorsItems;
