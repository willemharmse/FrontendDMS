import React, { useState } from "react";
import "./CourseContent.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTrashCan,
    faPlus,
    faChevronRight,
    faChevronDown,
    faCirclePlus,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

/** Slide types */
const SLIDE_TYPES = {
    TEXT: "TEXT",
    TEXT_MEDIA: "TEXT_MEDIA",
    MEDIA: "MEDIA",
};

const emptySlide = (type) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    title: "",
    content: "",
    mediaFile: null,
    mediaPreview: null,
    collapsed: false,
});

const CourseContent = ({ formData, setFormData }) => {
    const slides = formData?.courseContent ?? [];
    const [pickerOpen, setPickerOpen] = useState(false);        // existing bottom picker
    const [pickerFor, setPickerFor] = useState(null);           // NEW: which slide opened the inline picker

    const updateSlides = (nextSlides) =>
        setFormData((prev) => ({ ...(prev || {}), courseContent: nextSlides }));

    // Bottom "Add Slide" (append) — unchanged
    const addSlide = (type) => {
        updateSlides([...slides, emptySlide(type)]);
        setPickerOpen(false);
    };

    // NEW: insert AFTER the given index
    const addSlideAt = (index, type) => {
        const next = [...slides];
        next.splice(index + 1, 0, emptySlide(type));
        updateSlides(next);
        setPickerFor(null);
    };

    const removeSlide = (id) => updateSlides(slides.filter((s) => s.id !== id));

    const changeField = (id, field, value) =>
        updateSlides(slides.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

    const toggleCollapse = (id) =>
        updateSlides(
            slides.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s))
        );

    const onMediaChange = (id, file) => {
        const preview = file ? URL.createObjectURL(file) : null;
        updateSlides(
            slides.map((s) =>
                s.id === id ? { ...s, mediaFile: file, mediaPreview: preview } : s
            )
        );
    };

    return (
        <div className="input-row">
            <div className="modern-chapter-table">
                <h3 className="font-fam-labels">Course Content</h3>

                {/* Slides */}
                {slides.map((slide, idx) => (
                    <div
                        key={slide.id}
                        className={`courseCont-card${slide.collapsed ? " courseCont-card--collapsed" : ""}`}
                    >
                        {/* Header row: toggle | title | actions */}
                        <div className="courseCont-cardHeader">
                            <button
                                type="button"
                                className="courseCont-toggleBtn"
                                aria-label={slide.collapsed ? "Expand slide" : "Collapse slide"}
                                aria-expanded={!slide.collapsed}
                                onClick={() => toggleCollapse(slide.id)}
                            >
                                <FontAwesomeIcon icon={slide.collapsed ? faChevronRight : faChevronDown} />
                            </button>

                            <div className="courseCont-titleRow">
                                <span className="courseCont-slideLabel">
                                    {`Topic ${idx + 1} :`}
                                </span>
                                <textarea
                                    className="courseCont-titleInput"
                                    rows={1}
                                    placeholder="Insert Slide Title"
                                    value={slide.title}
                                    onChange={(e) => changeField(slide.id, "title", e.target.value)}
                                />
                            </div>

                            {/* Actions: PLUS + TRASH side-by-side */}
                            <div className="courseCont-actions">
                                <button
                                    type="button"
                                    className="courseCont-iconBtn"
                                    title="Remove slide"
                                    onClick={() => removeSlide(slide.id)}
                                    aria-label={`Remove slide ${idx + 1}`}
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                                <button
                                    type="button"
                                    className="courseCont-iconBtn"
                                    title="Add slide after"
                                    aria-haspopup="menu"
                                    aria-expanded={pickerFor === idx}
                                    aria-controls={`courseCont-typePicker-${idx}`}
                                    onClick={() => setPickerFor(pickerFor === idx ? null : idx)}
                                >
                                    <FontAwesomeIcon icon={faCirclePlus} />
                                </button>

                                {pickerFor === idx && (
                                    <div
                                        id={`courseCont-typePicker-${idx}`}
                                        className="courseCont-typePicker-inline"
                                        role="menu"
                                    >
                                        <button
                                            type="button"
                                            className="courseCont-typeItem"
                                            onClick={() => addSlideAt(idx, SLIDE_TYPES.TEXT)}
                                            role="menuitem"
                                        >
                                            Text only
                                        </button>
                                        <button
                                            type="button"
                                            className="courseCont-typeItem"
                                            onClick={() => addSlideAt(idx, SLIDE_TYPES.TEXT_MEDIA)}
                                            role="menuitem"
                                        >
                                            Text + Media
                                        </button>
                                        <button
                                            type="button"
                                            className="courseCont-typeItem"
                                            onClick={() => addSlideAt(idx, SLIDE_TYPES.MEDIA)}
                                            role="menuitem"
                                        >
                                            Media only
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Body (hidden when collapsed) */}
                        {!slide.collapsed && (
                            <div className="courseCont-body">
                                {slide.type === SLIDE_TYPES.TEXT && (
                                    <section>
                                        <h5 className="courseCont-sectionTitle">Content</h5>
                                        <textarea
                                            className="courseCont-textarea"
                                            placeholder="Insert content."
                                            rows={8}
                                            value={slide.content}
                                            onChange={(e) =>
                                                changeField(slide.id, "content", e.target.value)
                                            }
                                        />
                                    </section>
                                )}

                                {slide.type === SLIDE_TYPES.TEXT_MEDIA && (
                                    <section className="courseCont-twoCol">
                                        <div className="courseCont-col">
                                            <h5 className="courseCont-sectionTitle">Content</h5>
                                            <textarea
                                                className="courseCont-textarea"
                                                placeholder="Insert content."
                                                rows={10}
                                                value={slide.content}
                                                onChange={(e) =>
                                                    changeField(slide.id, "content", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="courseCont-col">
                                            <h5 className="courseCont-sectionTitle">Media</h5>
                                            <label className="courseCont-mediaDrop">
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*,audio/*"
                                                    onChange={(e) =>
                                                        onMediaChange(slide.id, e.target.files?.[0] || null)
                                                    }
                                                />
                                                {slide.mediaPreview ? (
                                                    <div className="courseCont-mediaPreview">
                                                        {slide.mediaFile?.type?.startsWith("image/") ? (
                                                            <img src={slide.mediaPreview} alt="preview" />
                                                        ) : slide.mediaFile?.type?.startsWith("video/") ? (
                                                            <video src={slide.mediaPreview} controls width="100%" />
                                                        ) : slide.mediaFile?.type?.startsWith("audio/") ? (
                                                            <audio src={slide.mediaPreview} controls />
                                                        ) : (
                                                            <p>{slide.mediaFile?.name}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="courseCont-mediaHint">
                                                        Select Media.
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    </section>
                                )}

                                {slide.type === SLIDE_TYPES.MEDIA && (
                                    <section>
                                        <h5 className="courseCont-sectionTitle">Media</h5>
                                        <label className="courseCont-mediaDrop courseCont-mediaOnly">
                                            <input
                                                type="file"
                                                accept="image/*,video/*,audio/*"
                                                onChange={(e) =>
                                                    onMediaChange(slide.id, e.target.files?.[0] || null)
                                                }
                                            />
                                            {slide.mediaPreview ? (
                                                <div className="courseCont-mediaPreview">
                                                    {slide.mediaFile?.type?.startsWith("image/") ? (
                                                        <img src={slide.mediaPreview} alt="preview" />
                                                    ) : slide.mediaFile?.type?.startsWith("video/") ? (
                                                        <video src={slide.mediaPreview} controls width="100%" />
                                                    ) : slide.mediaFile?.type?.startsWith("audio/") ? (
                                                        <audio src={slide.mediaPreview} controls />
                                                    ) : (
                                                        <p>{slide.mediaFile?.name}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="courseCont-mediaHint">
                                                    Select Media.
                                                </span>
                                            )}
                                        </label>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <div className="courseCont-addWrap">
                    <button
                        type="button"
                        className="add-row-button"
                        onClick={() => setPickerOpen((o) => !o)}
                        aria-expanded={pickerOpen}
                        aria-controls="courseCont-typePicker"
                    >
                        Add Slide
                    </button>

                    {pickerOpen && (
                        <div
                            id="courseCont-typePicker"
                            className="courseCont-typePicker"
                            role="menu"
                        >
                            <button
                                type="button"
                                className="courseCont-typeItem"
                                onClick={() => addSlide(SLIDE_TYPES.TEXT)}
                                role="menuitem"
                            >
                                Text only
                            </button>
                            <button
                                type="button"
                                className="courseCont-typeItem"
                                onClick={() => addSlide(SLIDE_TYPES.TEXT_MEDIA)}
                                role="menuitem"
                            >
                                Text + Media
                            </button>
                            <button
                                type="button"
                                className="courseCont-typeItem"
                                onClick={() => addSlide(SLIDE_TYPES.MEDIA)}
                                role="menuitem"
                            >
                                Media only
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseContent;
