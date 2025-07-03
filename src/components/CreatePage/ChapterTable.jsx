import React from "react";
import "./ChapterTable.css"; // Updated CSS filename
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const ChapterTable = ({ formData, setFormData }) => {
    const addChapter = () => {
        const newChapter = {
            chapterNumber: formData.chapters.length + 1,
            chapterTitle: "",
            chapterBody: "",
            subheadings: [],
        };
        setFormData({ ...formData, chapters: [...formData.chapters, newChapter] });
    };

    const addSubheading = (chapterIndex) => {
        const newChapters = [...formData.chapters];
        newChapters[chapterIndex].subheadings.push({
            subheadingTitle: "",
            body: "",
        });
        setFormData({ ...formData, chapters: newChapters });
    };

    const removeChapter = (chapterIndex) => {
        const newChapters = formData.chapters
            .filter((_, index) => index !== chapterIndex)
            .map((chapter, index) => ({
                ...chapter,
                chapterNumber: index + 1, // Recalculate chapterNumber
            }));
        setFormData({ ...formData, chapters: newChapters });
    };

    const removeSubheading = (chapterIndex, subheadingIndex) => {
        const newChapters = [...formData.chapters];
        newChapters[chapterIndex].subheadings = newChapters[chapterIndex].subheadings.filter(
            (_, index) => index !== subheadingIndex
        );
        setFormData({ ...formData, chapters: newChapters });
    };

    const handleInputChange = (e, chapterIndex, subheadingIndex = null, field) => {
        const newChapters = [...formData.chapters];
        if (subheadingIndex !== null) {
            newChapters[chapterIndex].subheadings[subheadingIndex][field] = e.target.value;
        } else {
            newChapters[chapterIndex][field] = e.target.value;
        }
        setFormData({ ...formData, chapters: newChapters });
    };

    return (
        <div className="input-row">
            <div className="modern-chapter-table">
                <h3 className="font-fam-labels">Add Additional Section</h3>
                {formData.chapters.map((chapter, chapterIndex) => (
                    <div key={chapterIndex} className="mct-chapter-card">
                        <div className="mct-chapter-header">
                            <h4>Section {chapter.chapterNumber}</h4>
                            <button className="mct-remove-btn" onClick={() => removeChapter(chapterIndex)}><FontAwesomeIcon icon={faTrash} title="Remove Section" /></button>
                        </div>
                        <label>Section Title:</label>
                        <input
                            className="mct-input"
                            type="text"
                            value={chapter.chapterTitle}
                            onChange={(e) => handleInputChange(e, chapterIndex, null, "chapterTitle")}
                            placeholder="Insert section title..."
                        />

                        <label style={{ marginBottom: "5px", marginTop: "5px" }}>Section Body:</label>
                        <textarea
                            className="mct-textarea"
                            value={chapter.chapterBody}
                            onChange={(e) => handleInputChange(e, chapterIndex, null, "chapterBody")}
                            placeholder="Insert content..."
                            rows="10"
                        />

                        {chapter.subheadings.map((subheading, subheadingIndex) => (
                            <div key={subheadingIndex} className="mct-subheading-card">
                                <div className="mct-subheading-header">
                                    <h5>Sub-Section {chapterIndex + 1}.{subheadingIndex + 1}</h5>
                                    <button className="mct-remove-btn" onClick={() => removeSubheading(chapterIndex, subheadingIndex)}><FontAwesomeIcon icon={faTrash} title="Remove Sub-Section" /></button>
                                </div>
                                <input
                                    className="mct-input"
                                    type="text"
                                    value={subheading.subheadingTitle}
                                    onChange={(e) => handleInputChange(e, chapterIndex, subheadingIndex, "subheadingTitle")}
                                    placeholder="Insert subheading title..."
                                />
                                <textarea
                                    className="mct-textarea"
                                    value={subheading.body}
                                    onChange={(e) => handleInputChange(e, chapterIndex, subheadingIndex, "body")}
                                    placeholder="Insert content..."
                                    rows="10"
                                />
                            </div>
                        ))}
                        <div class="add-chapter-container">
                            <button className="mct-add-subheading-btn" onClick={() => addSubheading(chapterIndex)}>+ Add Sub-Section</button>
                        </div>
                    </div>
                ))}
                <button className="add-row-button" onClick={addChapter}>Add</button>
            </div>
        </div>
    );
};

export default ChapterTable;
