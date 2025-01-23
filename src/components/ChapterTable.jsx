import React, { useState } from "react";

const ChapterTable = ({ formData, setFormData }) => {
    const addChapter = () => {
        const newChapter = {
            chapterNumber: formData.chapters.length + 1,
            subheadings: [],
        };
        setFormData({
            ...formData,
            chapters: [...formData.chapters, newChapter],
        });
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
        const newChapters = formData.chapters.filter((_, index) => index !== chapterIndex);
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
        <div className="chapter-table-container">
            <h3>Sections</h3>
            {formData.chapters.map((chapter, chapterIndex) => (
                <div key={chapterIndex} className="chapter-container">
                    <h4>Section {chapter.chapterNumber}</h4>
                    <div className="chapter-title-container">
                        <label>Section Title:</label>
                        <input
                            className="chapter-title-input"
                            type="text"
                            value={chapter.chapterTitle || ""}
                            onChange={(e) => handleInputChange(e, chapterIndex, null, "chapterTitle")}
                        />
                    </div>

                    <button className="add-subheading-button" onClick={() => addSubheading(chapterIndex)}>+ Add Subheading</button>
                    {chapter.subheadings.map((subheading, subheadingIndex) => (
                        <div key={subheadingIndex} className="subheading-container">
                            <h5>Subheading {subheadingIndex + 1}</h5>
                            <div className="subheading-title-container">
                                <label>Subheading Title:</label>
                                <input
                                    className="subheading-title-input"
                                    type="text"
                                    value={subheading.subheadingTitle}
                                    onChange={(e) => handleInputChange(e, chapterIndex, subheadingIndex, "subheadingTitle")}
                                />
                            </div>
                            <div className="subheading-body-container">
                                <label>Body:</label>
                                <textarea
                                    className="subheading-body-textarea"
                                    value={subheading.body}
                                    onChange={(e) => handleInputChange(e, chapterIndex, subheadingIndex, "body")}
                                />
                            </div>
                            <button className="remove-subheading-button" onClick={() => removeSubheading(chapterIndex, subheadingIndex)}>Remove Subheading</button>
                        </div>
                    ))}

                    <button className="remove-chapter-button" onClick={() => removeChapter(chapterIndex)}>Remove Section</button>

                </div>
            ))}
            <button className="add-chapter-button" onClick={addChapter}>+ Add Section</button>
        </div>
    );
};

export default ChapterTable;