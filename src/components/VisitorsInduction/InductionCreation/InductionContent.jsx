import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronRight,
    faChevronDown,
    faCirclePlus,
    faTrash,
    faMagicWandSparkles,
    faRotateLeft,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "./CourseCreationPage.css";
import TypeSelectorPopup from "./TypeSelectorPopup";

/** Slide content types */
const SLIDE_TYPES = {
    TEXT: "TEXT",
    TEXT_MEDIA: "TEXT_MEDIA",
    MEDIA: "MEDIA",
};

const CONTENT_REWRITE_ENDPOINT = `${process.env.REACT_APP_URL}/api/openai/chatInduction/content`;

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getMime = (slide) => {
    const type =
        slide.mediaFile?.type ||
        slide.media?.contentType ||
        slide.mediaType ||
        "";
    return type.toLowerCase();
};

const renderPreview = (slide) => {
    if (!slide.mediaPreview) return <span className="courseCont-mediaHint">Select Media.</span>;
    const mime = getMime(slide);
    if (mime.startsWith("image/")) return <img src={slide.mediaPreview} alt="preview" />;
    if (mime.startsWith("video/")) return <video src={slide.mediaPreview} controls style={{ width: "100%" }} />;
    if (mime.startsWith("audio/")) return <audio src={slide.mediaPreview} controls />;
    const name = slide.media?.filename || slide.mediaFile?.name || "file";
    return <a href={slide.mediaPreview} download={name}>{name}</a>;
};

const emptySlide = (type) => ({
    id: newId(),
    type,
    title: "",
    content: "",
    media: null,
    mediaFile: null,
    mediaPreview: null,
    mediaType: null,
    collapsed: false,
});

const emptyTopic = (title = "") => ({
    id: newId(),
    title,
    collapsed: false,
    slides: [],
});

const emptyModule = (title = "") => ({
    id: newId(),
    title,
    collapsed: false,
    topics: [],
});

const InductionContent = ({ formData, setFormData }) => {
    const modules = formData?.courseModules ?? [];
    const flatSlides = formData?.courseContent ?? []; // legacy

    // ---------- Migration ----------
    useEffect(() => {
        // Already in new shape?
        const looksNew = Array.isArray(modules) && modules.every(m => Array.isArray(m?.topics));
        if (looksNew) return;

        const nextModules = (modules?.length ? modules : []).map(mod => {
            // case A: legacy modules with .slides  (these were actually topics)
            if (Array.isArray(mod.slides) && !Array.isArray(mod.topics)) {
                const topics = (mod.slides || []).map((legacySlide) => {
                    const t = emptyTopic(legacySlide.title || "");
                    // Put the legacy slide inside the topic as its first slide,
                    // but clear the topic.title if you prefer to keep titles separate
                    const slide = {
                        ...legacySlide,
                        title: legacySlide.title || "",   // keep slide.title
                        collapsed: false,
                    };
                    t.slides = [slide];
                    return t;
                });

                const { slides, ...rest } = mod; // drop old prop
                return { ...rest, topics };
            }

            // case B: already has topics (mixed shapes)
            if (Array.isArray(mod.topics)) return mod;

            // fallback: no slides/topics at all
            return { ...mod, topics: [] };
        });

        // case C: legacy flat courseContent -> wrap into a Module -> one Topic -> many Slides
        if ((!nextModules || nextModules.length === 0) && flatSlides.length) {
            const m = emptyModule("");
            const t = emptyTopic("");
            t.slides = flatSlides.map(s => ({ ...s, collapsed: false }));
            m.topics = [t];

            setFormData(prev => ({
                ...(prev || {}),
                courseModules: [m],
                courseContent: undefined,
            }));
            return;
        }

        // persist migration for A/B
        setFormData(prev => ({
            ...(prev || {}),
            courseModules: nextModules,
            courseContent: undefined,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once: migrate on mount

    const safeModules = useMemo(() => (formData?.courseModules ?? []).map(m => ({
        ...m,
        topics: Array.isArray(m.topics) ? m.topics : [],
    })), [formData?.courseModules]);

    const [slidePickerFor, setSlidePickerFor] = useState(null); // { moduleIndex, topicIndex } | null
    const [inlineSlidePicker, setInlineSlidePicker] = useState(null); // { moduleIndex, topicIndex, slideIndex } | null

    // ---------- AI rewrite state (per-slide) ----------
    const [contentHistory, setContentHistory] = useState({}); // { [slideId]: [prev1, prev2, ...] }
    const [loadingMap, setLoadingMap] = useState({}); // { [slideId]: boolean }

    const pushHistory = (slideId, value) =>
        setContentHistory((prev) => ({
            ...prev,
            [slideId]: [...(prev[slideId] || []), value],
        }));

    const hasHistory = (slideId) => (contentHistory[slideId]?.length || 0) > 0;

    const setLoading = (slideId, val) =>
        setLoadingMap((prev) => ({ ...prev, [slideId]: !!val }));

    const rewriteSlideContent = async (mIdx, tIdx, slide) => {
        try {
            const prompt = slide.content || "";
            pushHistory(slide.id, prompt);
            setLoading(slide.id, true);

            const resp = await fetch(CONTENT_REWRITE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await resp.json();
            changeSlideField(mIdx, tIdx, slide.id, "content", newText || "");
        } catch (err) {
            console.error("AI rewrite error:", err);
        } finally {
            setLoading(slide.id, false);
        }
    };

    const undoSlideContent = (mIdx, tIdx, slideId) =>
        setContentHistory((prev) => {
            const stack = prev[slideId] || [];
            if (!stack.length) return prev;
            const last = stack[stack.length - 1];
            changeSlideField(mIdx, tIdx, slideId, "content", last);
            return { ...prev, [slideId]: stack.slice(0, -1) };
        });

    const updateModules = (next) =>
        setFormData((prev) => ({ ...(prev || {}), courseModules: next }));

    // ----- Module ops -----
    const addModule = () => updateModules([...safeModules, emptyModule("")]);
    const addModuleAfter = (mIdx) => {
        const next = [...safeModules];
        next.splice(mIdx + 1, 0, emptyModule(""));
        updateModules(next);
    };
    const removeModule = (moduleId) =>
        updateModules(safeModules.filter((m) => m.id !== moduleId));
    const changeModuleField = (moduleId, field, value) =>
        updateModules(
            safeModules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m))
        );
    const toggleModuleCollapse = (moduleId) =>
        updateModules(
            safeModules.map((m) =>
                m.id === moduleId ? { ...m, collapsed: !m.collapsed } : m
            )
        );

    // ----- Topic ops -----
    const addTopicToModule = (mIdx) => {
        const next = [...safeModules];
        const topics = [...next[mIdx].topics];
        topics.push(emptyTopic(""));
        next[mIdx] = { ...next[mIdx], topics };
        updateModules(next);
    };
    const addTopicAfter = (mIdx, tIdx) => {
        const next = [...safeModules];
        const topics = [...next[mIdx].topics];
        topics.splice(tIdx + 1, 0, emptyTopic(""));
        next[mIdx] = { ...next[mIdx], topics };
        updateModules(next);
    };
    const changeTopicField = (mIdx, topicId, field, value) => {
        const next = [...safeModules];
        const topics = next[mIdx].topics.map((t) =>
            t.id === topicId ? { ...t, [field]: value } : t
        );
        next[mIdx] = { ...next[mIdx], topics };
        updateModules(next);
    };
    const toggleTopicCollapse = (mIdx, topicId) => {
        const next = [...safeModules];
        const topics = next[mIdx].topics.map((t) =>
            t.id === topicId ? { ...t, collapsed: !t.collapsed } : t
        );
        next[mIdx] = { ...next[mIdx], topics };
        updateModules(next);
    };
    const removeTopic = (mIdx, topicId) => {
        const next = [...safeModules];
        next[mIdx] = {
            ...next[mIdx],
            topics: next[mIdx].topics.filter((t) => t.id !== topicId),
        };
        updateModules(next);
    };

    // ----- Slide ops -----
    const addSlideToTopic = (mIdx, tIdx, type) => {
        const next = [...safeModules];
        const slides = [...next[mIdx].topics[tIdx].slides, emptySlide(type)];
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
        setSlidePickerFor(null);
    };
    const addSlideAfter = (mIdx, tIdx, sIdx, type) => {
        const next = [...safeModules];
        const slides = [...next[mIdx].topics[tIdx].slides];
        slides.splice(sIdx + 1, 0, emptySlide(type));
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
        setInlineSlidePicker(null);
    };
    const changeSlideField = (mIdx, tIdx, slideId, field, value) => {
        const next = [...safeModules];
        const slides = next[mIdx].topics[tIdx].slides.map((s) =>
            s.id === slideId ? { ...s, [field]: value } : s
        );
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
    };
    const toggleSlideCollapse = (mIdx, tIdx, slideId) => {
        const next = [...safeModules];
        const slides = next[mIdx].topics[tIdx].slides.map((s) =>
            s.id === slideId ? { ...s, collapsed: !s.collapsed } : s
        );
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
    };
    const removeSlide = (mIdx, tIdx, slideId) => {
        const next = [...safeModules];
        const slides = next[mIdx].topics[tIdx].slides.filter((s) => s.id !== slideId);
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
    };
    const onMediaChange = (mIdx, tIdx, slideId, file) => {
        const next = [...safeModules];
        const slides = next[mIdx].topics[tIdx].slides.map((s) => {
            if (s.id !== slideId) return s;
            if (s.mediaPreview && s.mediaPreview.startsWith("blob:")) {
                try {
                    URL.revokeObjectURL(s.mediaPreview);
                } catch { }
            }
            return {
                ...s,
                media: null,
                mediaType: file?.type || null,
                mediaFile: file || null,
                mediaPreview: file ? URL.createObjectURL(file) : null,
            };
        });
        next[mIdx].topics[tIdx] = { ...next[mIdx].topics[tIdx], slides };
        updateModules(next);
    };

    const hasModules = safeModules.length > 0;

    return (
        <div className="input-row">
            <div className="modern-chapter-table">
                <h3 className="font-fam-labels">Content</h3>

                {safeModules.map((mod, mIdx) => {
                    const topics = mod.topics || [];
                    const hasTopics = topics.length > 0;

                    return (
                        <div
                            key={mod.id}
                            className={`courseCont-card-module${mod.collapsed ? " courseCont-card--collapsed" : ""
                                }`}
                        >
                            {/* Module header */}
                            <div className="courseCont-cardHeader">
                                <button
                                    type="button"
                                    className="courseCont-toggleBtn"
                                    aria-label={mod.collapsed ? "Expand module" : "Collapse module"}
                                    aria-expanded={!mod.collapsed}
                                    onClick={() => toggleModuleCollapse(mod.id)}
                                >
                                    <FontAwesomeIcon
                                        icon={mod.collapsed ? faChevronRight : faChevronDown}
                                    />
                                </button>

                                <div className="courseCont-titleRow">
                                    <span className="courseCont-slideLabel">{`Module ${mIdx + 1
                                        } :`}</span>
                                    <textarea
                                        className="courseCont-titleInput"
                                        rows={1}
                                        placeholder="Insert Module Title"
                                        value={mod.title}
                                        onChange={(e) =>
                                            changeModuleField(mod.id, "title", e.target.value)
                                        }
                                    />
                                </div>

                                <div className="courseCont-actions">
                                    <button
                                        type="button"
                                        className="courseCont-iconBtn"
                                        title="Remove module"
                                        onClick={() => removeModule(mod.id)}
                                        aria-label={`Remove module ${mIdx + 1}`}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                        type="button"
                                        className="courseCont-iconBtn"
                                        title="Add module after"
                                        onClick={() => addModuleAfter(mIdx)}
                                        aria-label={`Add module after ${mIdx + 1}`}
                                    >
                                        <FontAwesomeIcon icon={faCirclePlus} />
                                    </button>
                                </div>
                            </div>

                            {/* Module body */}
                            {!mod.collapsed && (
                                <div className="courseCont-body">
                                    {/* Topics */}
                                    {topics.map((topic, tIdx) => {
                                        const slides = topic.slides || [];
                                        const hasSlides = slides.length > 0;
                                        return (
                                            <div
                                                key={topic.id}
                                                className={`courseCont-card${topic.collapsed ? " courseCont-card--collapsed" : ""
                                                    }`}
                                                style={{ marginTop: 12 }}
                                            >
                                                {/* Topic header */}
                                                <div className="courseCont-cardHeader">
                                                    <button
                                                        type="button"
                                                        className="courseCont-toggleBtn"
                                                        aria-label={
                                                            topic.collapsed ? "Expand topic" : "Collapse topic"
                                                        }
                                                        aria-expanded={!topic.collapsed}
                                                        onClick={() => toggleTopicCollapse(mIdx, topic.id)}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={topic.collapsed ? faChevronRight : faChevronDown}
                                                        />
                                                    </button>

                                                    <div className="courseCont-titleRow">
                                                        <span className="courseCont-slideLabel">{`Topic ${mIdx + 1
                                                            }.${tIdx + 1} :`}</span>
                                                        <textarea
                                                            className="courseCont-titleInput"
                                                            rows={1}
                                                            placeholder="Insert Topic Title"
                                                            value={topic.title}
                                                            onChange={(e) =>
                                                                changeTopicField(
                                                                    mIdx,
                                                                    topic.id,
                                                                    "title",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div className="courseCont-actions">
                                                        <button
                                                            type="button"
                                                            className="courseCont-iconBtn"
                                                            title="Remove topic"
                                                            onClick={() => removeTopic(mIdx, topic.id)}
                                                            aria-label={`Remove topic ${mIdx + 1}.${tIdx + 1}`}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                        {false && (
                                                            <button
                                                                type="button"
                                                                className="courseCont-iconBtn"
                                                                title="Add topic after"
                                                                onClick={() => addTopicAfter(mIdx, tIdx)}
                                                                aria-label={`Add topic after ${mIdx + 1}.${tIdx + 1}`}
                                                            >
                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Topic body */}
                                                {!topic.collapsed && (
                                                    <div className="courseCont-body">
                                                        {/* Slides */}
                                                        {slides.map((slide, sIdx) => (
                                                            <div
                                                                key={slide.id}
                                                                className={`courseCont-card-module${slide.collapsed ? " courseCont-card--collapsed" : ""
                                                                    }`}
                                                                style={{ marginTop: 12 }}
                                                            >
                                                                {/* Slide header */}
                                                                <div className="courseCont-cardHeader">
                                                                    <button
                                                                        type="button"
                                                                        className="courseCont-toggleBtn"
                                                                        aria-label={
                                                                            slide.collapsed
                                                                                ? "Expand slide"
                                                                                : "Collapse slide"
                                                                        }
                                                                        aria-expanded={!slide.collapsed}
                                                                        onClick={() =>
                                                                            toggleSlideCollapse(mIdx, tIdx, slide.id)
                                                                        }
                                                                    >
                                                                        <FontAwesomeIcon
                                                                            icon={
                                                                                slide.collapsed ? faChevronRight : faChevronDown
                                                                            }
                                                                        />
                                                                    </button>

                                                                    <div className="courseCont-titleRow">
                                                                        <span className="courseCont-slideLabel">{``}</span>
                                                                        <textarea
                                                                            className="courseCont-titleInput"
                                                                            rows={1}
                                                                            placeholder="Insert Slide Title"
                                                                            value={slide.title}
                                                                            onChange={(e) =>
                                                                                changeSlideField(
                                                                                    mIdx,
                                                                                    tIdx,
                                                                                    slide.id,
                                                                                    "title",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>

                                                                    {/* Slide actions: delete + inline type picker (insert after) */}
                                                                    <div className="courseCont-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="courseCont-iconBtn"
                                                                            title="Remove slide"
                                                                            onClick={() =>
                                                                                removeSlide(mIdx, tIdx, slide.id)
                                                                            }
                                                                            aria-label={`Remove slide ${mIdx + 1}.${tIdx + 1
                                                                                }.${sIdx + 1}`}
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrash} />
                                                                        </button>

                                                                        {false && (
                                                                            <button
                                                                                type="button"
                                                                                className="courseCont-iconBtn"
                                                                                title="Add slide after"
                                                                                aria-haspopup="menu"
                                                                                aria-expanded={
                                                                                    !!(
                                                                                        inlineSlidePicker &&
                                                                                        inlineSlidePicker.moduleIndex === mIdx &&
                                                                                        inlineSlidePicker.topicIndex === tIdx &&
                                                                                        inlineSlidePicker.slideIndex === sIdx
                                                                                    )
                                                                                }
                                                                                aria-controls={`courseCont-typePicker-${mIdx}-${tIdx}-${sIdx}`}
                                                                                onClick={() =>
                                                                                    setInlineSlidePicker((cur) =>
                                                                                        cur &&
                                                                                            cur.moduleIndex === mIdx &&
                                                                                            cur.topicIndex === tIdx &&
                                                                                            cur.slideIndex === sIdx
                                                                                            ? null
                                                                                            : {
                                                                                                moduleIndex: mIdx,
                                                                                                topicIndex: tIdx,
                                                                                                slideIndex: sIdx,
                                                                                            }
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                                            </button>
                                                                        )}

                                                                        {inlineSlidePicker &&
                                                                            inlineSlidePicker.moduleIndex === mIdx &&
                                                                            inlineSlidePicker.topicIndex === tIdx &&
                                                                            inlineSlidePicker.slideIndex === sIdx && (
                                                                                <div
                                                                                    id={`courseCont-typePicker-${mIdx}-${tIdx}-${sIdx}`}
                                                                                    className="courseCont-typePicker-inline"
                                                                                    role="menu"
                                                                                >
                                                                                    <button
                                                                                        type="button"
                                                                                        className="courseCont-typeItem"
                                                                                        onClick={() =>
                                                                                            addSlideAfter(
                                                                                                mIdx,
                                                                                                tIdx,
                                                                                                sIdx,
                                                                                                SLIDE_TYPES.TEXT
                                                                                            )
                                                                                        }
                                                                                        role="menuitem"
                                                                                    >
                                                                                        Text only
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="courseCont-typeItem"
                                                                                        onClick={() =>
                                                                                            addSlideAfter(
                                                                                                mIdx,
                                                                                                tIdx,
                                                                                                sIdx,
                                                                                                SLIDE_TYPES.TEXT_MEDIA
                                                                                            )
                                                                                        }
                                                                                        role="menuitem"
                                                                                    >
                                                                                        Text + Media
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="courseCont-typeItem"
                                                                                        onClick={() =>
                                                                                            addSlideAfter(
                                                                                                mIdx,
                                                                                                tIdx,
                                                                                                sIdx,
                                                                                                SLIDE_TYPES.MEDIA
                                                                                            )
                                                                                        }
                                                                                        role="menuitem"
                                                                                    >
                                                                                        Media only
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                </div>

                                                                {/* Slide body */}
                                                                {!slide.collapsed && (
                                                                    <div className="courseCont-body">
                                                                        {slide.type === SLIDE_TYPES.TEXT && (
                                                                            <section style={{ position: "relative" }}>
                                                                                <textarea
                                                                                    className="courseCont-textarea"
                                                                                    placeholder="Insert content."
                                                                                    rows={8}
                                                                                    value={slide.content}
                                                                                    onChange={(e) =>
                                                                                        changeSlideField(
                                                                                            mIdx,
                                                                                            tIdx,
                                                                                            slide.id,
                                                                                            "content",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    style={{ paddingBottom: "35px" }}
                                                                                />

                                                                                {/* AI icons (TEXT) */}
                                                                                {loadingMap[slide.id] ? (
                                                                                    <FontAwesomeIcon
                                                                                        icon={faSpinner}
                                                                                        className="induction-textarea-icon-ai-rewrite spin-animation"
                                                                                        title="Rewriting…"
                                                                                        style={{
                                                                                            fontSize: "15px",
                                                                                            bottom: 23
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <FontAwesomeIcon
                                                                                        icon={faMagicWandSparkles}
                                                                                        className="induction-textarea-icon-ai-rewrite"
                                                                                        title="AI Rewrite"
                                                                                        style={{
                                                                                            fontSize: "15px", cursor: "pointer",
                                                                                            bottom: 23
                                                                                        }}
                                                                                        onClick={() =>
                                                                                            rewriteSlideContent(mIdx, tIdx, slide)
                                                                                        }
                                                                                    />
                                                                                )}

                                                                                {hasHistory(slide.id) && (
                                                                                    <FontAwesomeIcon
                                                                                        icon={faRotateLeft}
                                                                                        title="Undo AI Rewrite"
                                                                                        style={{
                                                                                            position: "absolute",
                                                                                            right: 34,
                                                                                            bottom: 23,
                                                                                            fontSize: "15px",
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                        onClick={() =>
                                                                                            undoSlideContent(mIdx, tIdx, slide.id)
                                                                                        }
                                                                                    />
                                                                                )}
                                                                            </section>
                                                                        )}

                                                                        {slide.type === SLIDE_TYPES.TEXT_MEDIA && (
                                                                            <section className="courseCont-twoCol">
                                                                                <div
                                                                                    className="courseCont-col"
                                                                                    style={{ position: "relative" }}
                                                                                >
                                                                                    <div style={{ position: "relative" }}>
                                                                                        <textarea
                                                                                            className="courseCont-textarea"
                                                                                            placeholder="Insert content."
                                                                                            rows={10}
                                                                                            value={slide.content}
                                                                                            onChange={(e) =>
                                                                                                changeSlideField(
                                                                                                    mIdx,
                                                                                                    tIdx,
                                                                                                    slide.id,
                                                                                                    "content",
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            style={{ paddingBottom: "35px" }}
                                                                                        />

                                                                                        {/* AI icons (TEXT_MEDIA) */}
                                                                                        {loadingMap[slide.id] ? (
                                                                                            <FontAwesomeIcon
                                                                                                icon={faSpinner}
                                                                                                className="induction-textarea-icon-ai-rewrite spin-animation"
                                                                                                title="Rewriting…"
                                                                                                style={{ fontSize: "15px", bottom: 23 }}
                                                                                            />
                                                                                        ) : (
                                                                                            <FontAwesomeIcon
                                                                                                icon={faMagicWandSparkles}
                                                                                                className="induction-textarea-icon-ai-rewrite"
                                                                                                title="AI Rewrite"
                                                                                                style={{
                                                                                                    fontSize: "15px",
                                                                                                    cursor: "pointer",
                                                                                                    bottom: 23
                                                                                                }}
                                                                                                onClick={() =>
                                                                                                    rewriteSlideContent(mIdx, tIdx, slide)
                                                                                                }
                                                                                            />
                                                                                        )}

                                                                                        {hasHistory(slide.id) && (
                                                                                            <FontAwesomeIcon
                                                                                                icon={faRotateLeft}
                                                                                                title="Undo AI Rewrite"
                                                                                                style={{
                                                                                                    position: "absolute",
                                                                                                    right: 34,
                                                                                                    bottom: 23,
                                                                                                    fontSize: "15px",
                                                                                                    cursor: "pointer",
                                                                                                }}
                                                                                                onClick={() =>
                                                                                                    undoSlideContent(
                                                                                                        mIdx,
                                                                                                        tIdx,
                                                                                                        slide.id
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="courseCont-col">
                                                                                    <label
                                                                                        className="courseCont-mediaDrop"
                                                                                        style={{ marginTop: "8px", paddingBottom: "30px", paddingTop: "29px" }}
                                                                                    >
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,video/*,audio/*"
                                                                                            onChange={(e) =>
                                                                                                onMediaChange(
                                                                                                    mIdx,
                                                                                                    tIdx,
                                                                                                    slide.id,
                                                                                                    e.target.files?.[0] || null
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        {slide.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">
                                                                                                {renderPreview(slide)}
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
                                                                                <label className="courseCont-mediaDrop courseCont-mediaOnly">
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*,video/*,audio/*"
                                                                                        onChange={(e) =>
                                                                                            onMediaChange(
                                                                                                mIdx,
                                                                                                tIdx,
                                                                                                slide.id,
                                                                                                e.target.files?.[0] || null
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {slide.mediaPreview ? (
                                                                                        <div className="courseCont-mediaPreview">{renderPreview(slide)}</div>
                                                                                    ) : (
                                                                                        <span className="courseCont-mediaHint">Select Media.</span>
                                                                                    )}
                                                                                </label>
                                                                            </section>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {/* Add slide (footer picker per topic) */}
                                                        <div className="courseCont-addWrap" style={{ marginTop: 10 }}>

                                                            <button
                                                                type="button"
                                                                className="add-row-button"
                                                                onClick={() => setSlidePickerFor({ moduleIndex: mIdx, topicIndex: tIdx })}
                                                            >
                                                                Add Slide
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="courseCont-addWrap" style={{ marginTop: 10 }}>
                                        <button
                                            type="button"
                                            className="add-row-button"
                                            onClick={() => addTopicToModule(mIdx)}
                                        >
                                            Add Topic
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Module */}
                <div className="courseCont-addWrap">
                    <button type="button" className="add-row-button" onClick={addModule}>
                        Add Module
                    </button>
                </div>
            </div>

            <TypeSelectorPopup
                isOpen={!!slidePickerFor}
                title="Select slide type"
                onClose={() => setSlidePickerFor(null)}
                onSelect={(typeId) => {
                    if (!slidePickerFor) return;
                    // Creates the slide and (because your addSlideToTopic already calls setSlidePickerFor(null))
                    // it will also close the popup.
                    addSlideToTopic(slidePickerFor.moduleIndex, slidePickerFor.topicIndex, typeId);
                }}
                options={[
                    { id: SLIDE_TYPES.TEXT, label: "Text", imgSrc: "/txt.png", alt: "Text" },
                    { id: SLIDE_TYPES.TEXT_MEDIA, label: "Text + Media", imgSrc: "/txtMed.png", alt: "Text and Media" },
                    { id: SLIDE_TYPES.MEDIA, label: "Media", imgSrc: "/Med.png", alt: "Media" },
                ]}
            />
        </div>
    );
};

export default InductionContent;
