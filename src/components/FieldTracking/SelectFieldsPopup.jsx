import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX, faSearch } from '@fortawesome/free-solid-svg-icons';
import SuggestFTSField from "./SuggestFTSField";
import { templateFieldsStore, useTemplateFieldsStore } from "./templateFieldsStore";

const SelectFieldsPopup = ({
    visible,
    onClose,
    title = "Select Template Fields",
    usedTemplateFields = [],
    currentFields = [],
    onSave
}) => {
    const [selectedFields, setSelectedFields] = useState(new Set(currentFields));
    const [searchTerm, setSearchTerm] = useState("");
    const { fields: templateFields, loading: fieldsLoading, error: fieldsError } = useTemplateFieldsStore();
    const [showNewPopup, setShowNewPopup] = useState(false);

    const openAddPopup = () => {
        setShowNewPopup(true)
    }

    // Called when SuggestFTSField successfully adds a new field. The field
    // itself gets appended to the shared store via setFieldData (below), so
    // every section's popup sees it immediately - here we just auto-check
    // it in THIS popup's own selection.
    const handleFieldSuggested = (newField) => {
        setSelectedFields(prev => new Set(prev).add(newField.field));
    };

    // Reset the working selection whenever the popup is (re)opened, so it
    // reflects whatever is currently saved for this section.
    useEffect(() => {
        if (visible) {
            setSelectedFields(new Set(currentFields));
            setSearchTerm("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Pull the standard field / definition pairs once for the whole page,
    // via the shared store - so every SelectFieldsPopup instance (Task
    // Description, Responsibility, Resources, Safety, Close Out...) reads
    // the same list, and a field suggested from any one of them shows up
    // as an option in all the others immediately.
    useEffect(() => {
        if (!visible || !templateFieldsStore.markFetchStarted()) return;

        const fetchStandardFields = async () => {
            templateFieldsStore.setLoading(true);
            templateFieldsStore.setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/standardFields`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch standard fields');
                }
                const data = await response.json();
                templateFieldsStore.setFields(prev => {
                    // Keep any locally-suggested fields that were added
                    // before this fetch resolved, rather than dropping them.
                    const fetched = data.standardFields || [];
                    const fetchedNames = new Set(fetched.map(f => f.field));
                    const localOnly = prev.filter(f => !fetchedNames.has(f.field));
                    return [...fetched, ...localOnly];
                });
            } catch (error) {
                templateFieldsStore.setError(error.message);
            } finally {
                templateFieldsStore.setLoading(false);
            }
        };

        fetchStandardFields();
    }, [visible]);

    // Fields that belong to some OTHER section already and therefore can't
    // be picked here.
    const takenElsewhere = useMemo(
        () => new Set(usedTemplateFields.filter(field => !currentFields.includes(field))),
        [usedTemplateFields, currentFields]
    );

    if (!visible) return null;

    const clearSearch = () => setSearchTerm("");

    const handleCheckboxChange = (field) => {
        if (takenElsewhere.has(field)) return; // in use elsewhere, locked out

        const updated = new Set(selectedFields);
        if (updated.has(field)) {
            updated.delete(field);
        } else {
            updated.add(field);
        }
        setSelectedFields(updated);
    };

    const handleSaveSelection = () => {
        onSave([...selectedFields]);
        onClose();
    };

    return (
        <div className="popup-overlay-abbr">
            <div className="popup-content-abbr">
                <div className="review-date-header">
                    <h2 className="review-date-title">{title}</h2>
                    <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="review-date-group">
                    <div className="abbr-input-container">
                        <input
                            className="search-input-abbr"
                            type="text"
                            placeholder="Search Template Field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchTerm === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>
                </div>

                <div className="abbr-table-group">
                    <div className="popup-table-wrapper-abbr">
                        <table className="popup-table font-fam">
                            <thead className="abbr-headers">
                                <tr>
                                    <th className="inp-size-abbr" style={{ textAlign: "center" }}>Select</th>
                                    <th style={{ textAlign: "center" }}>Field</th>
                                    <th className="def-size-abbr" style={{ textAlign: "center" }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fieldsLoading ? (
                                    <tr>
                                        <td colSpan="3">Loading template fields...</td>
                                    </tr>
                                ) : fieldsError ? (
                                    <tr>
                                        <td colSpan="3">Failed to load template fields: {fieldsError}</td>
                                    </tr>
                                ) : templateFields.length > 0 ? (
                                    templateFields
                                        .filter((item) =>
                                            item.field.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .sort((a, b) => a.field.localeCompare(b.field))
                                        .map((item) => {
                                            const isTaken = takenElsewhere.has(item.field);
                                            return (
                                                <tr
                                                    key={item._id ?? item.field}
                                                    onClick={isTaken ? undefined : () => handleCheckboxChange(item.field)}
                                                    style={{ cursor: isTaken ? "default" : "pointer" }}
                                                >
                                                    <td style={{ textAlign: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-inp-abbr"
                                                            checked={isTaken ? true : selectedFields.has(item.field)}
                                                            disabled={isTaken}
                                                            title={isTaken ? "This field is already in use elsewhere" : undefined}
                                                            onChange={() => handleCheckboxChange(item.field)}
                                                        />
                                                    </td>
                                                    <td>
                                                        {item.field}
                                                    </td>
                                                    <td style={{ whiteSpace: "pre-wrap" }}>{item.definition}</td>
                                                </tr>
                                            );
                                        })
                                ) : (
                                    <tr>
                                        <td colSpan="3">No template fields found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="abbr-buttons-dual">
                    <button onClick={handleSaveSelection} className="abbr-button-1">Save Selection</button>
                    <button onClick={openAddPopup} className="abbr-button-2">Suggest New</button>
                </div>
            </div>


            {showNewPopup && (<SuggestFTSField
                isOpen={showNewPopup}
                onClose={() => { setShowNewPopup(false); }}
                setFieldData={templateFieldsStore.setFields}
                onAdd={handleFieldSuggested}
            />)}
        </div>
    );
};

export default SelectFieldsPopup;