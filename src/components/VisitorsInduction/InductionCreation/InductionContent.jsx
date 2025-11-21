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
    faMusic,
} from "@fortawesome/free-solid-svg-icons";
import "./CourseCreationPage.css";
import TypeSelectorPopup from "./TypeSelectorPopup";
import AudioPicker from "./AudioPicker";
import PopupAudioPlayer from "./PopupAudioPlayer";
import ImageCropPopup from "./ImageCropPopup";

/** Slide content types */
const SLIDE_TYPES = {
    TEXT: "TEXT", //Done
    TEXT_MEDIA: "TEXT_MEDIA", //Done
    MEDIA: "MEDIA", //Done
    MEDIA_GALLERY: "MEDIA_GALLERY", //Done
    TEXT_MEDIA_2X2: "TEXT_MEDIA_2X2", //Done
    MEDIAX2_TEXT: "MEDIAX2_TEXT", //Done
    MEDIA_2X2: "MEDIA_2X2", //Done
    PDF_VIEW: "PDF_VIEW"
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

const renderPreview = (item) => {
    if (!item?.mediaPreview) return <span className="courseCont-mediaHint">Select Media.</span>;
    const mime = (item.mediaFile?.type || item.media?.contentType || item.mediaType || "").toLowerCase();
    if (mime.startsWith("image/")) return <img src={item.mediaPreview} alt="preview" />;
    if (mime.startsWith("video/")) return <video src={item.mediaPreview} controls style={{ width: "100%" }} />;
    if (mime.startsWith("audio/")) return <audio src={item.mediaPreview} controls />;

    if (mime.includes("pdf")) {
        return (
            <iframe
                src={item.mediaPreview}
                title="PDF preview"
                className="courseCont-pdfFrame"
            />
        );
    }

    const name = item.media?.filename || item.mediaFile?.name || "file";
    return <a href={item.mediaPreview} download={name}>{name}</a>;
};

const emptySlide = (type) => ({
    id: newId(),
    type,
    title: "",
    content: "",
    contentLeft: "",
    contentRight: "",
    mediaItems: [],
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

const InductionContent = ({ formData, setFormData, readOnly = false }) => {
    const modules = formData?.courseModules ?? [];
    const flatSlides = formData?.courseContent ?? []; // legacy
    const [mediaPicker, setMediaPicker] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState(false);
    const [moduleIndex, setModuleIndex] = useState("");
    const [topicIndex, setTopicIndex] = useState("");
    const [slideID, setSlideID] = useState("");
    const [audioFile, setAudioFile] = useState("");
    const [ratio, setRatio] = useState([]);

    const openMediaPicker = (module, topic, slide) => {
        setModuleIndex(module);
        setTopicIndex(topic);
        setSlideID(slide);

        setMediaPicker(true);
    }

    const openAudioPlayer = (module, topic, slide, file) => {
        setModuleIndex(module);
        setTopicIndex(topic);
        setSlideID(slide);
        setAudioFile(file);

        setAudioPlayer(true);
    }

    const closeMediaPicker = () => {
        setModuleIndex("");
        setTopicIndex("");
        setSlideID("");

        setMediaPicker(false);
    }

    const closeAudioPlayer = () => {
        setModuleIndex("");
        setTopicIndex("");
        setSlideID("");
        setAudioFile("");

        setAudioPlayer(false);
    }

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
    const [croppingState, setCroppingState] = useState(null);

    const EMPTY_MEDIA_ITEM = {
        mediaFile: null,
        mediaPreview: null,
        mediaType: null,
        media: null
    };

    const commitMediaChange = (mIdx, tIdx, slideId, slotIndex, file) => {
        const next = [...safeModules];
        const topic = next[mIdx].topics[tIdx];
        const slides = topic.slides.map(s => {
            if (s.id !== slideId) return s;
            const items = [...(s.mediaItems || [])];

            // clean up old blob URLs for that slot
            const prev = items[slotIndex];
            if (prev?.mediaPreview?.startsWith?.("blob:")) {
                try { URL.revokeObjectURL(prev.mediaPreview); } catch { }
            }

            items[slotIndex] = file
                ? {
                    mediaFile: file,
                    mediaPreview: URL.createObjectURL(file),
                    mediaType: file.type || "",
                    media: null,
                }
                : { ...EMPTY_MEDIA_ITEM };;

            return { ...s, mediaItems: items };
        });

        next[mIdx].topics[tIdx] = { ...topic, slides };
        updateModules(next);
    };

    const onMediaChange = (mIdx, tIdx, slideId, slotIndex, file) => {
        if (!file) {
            // If file is null (e.g., cleared), commit immediately
            commitMediaChange(mIdx, tIdx, slideId, slotIndex, null);
            return;
        }

        // Not an image (video, audio, pdf), commit immediately


        // If it's an image, open the cropper
        if (file.type.startsWith("image/")) {
            setCroppingState({
                mIdx,
                tIdx,
                slideId,
                slotIndex,
                file: file, // We pass the original file to get the name
                preview: URL.createObjectURL(file) // We pass the preview URL to the popup
            });
        } else {
            commitMediaChange(mIdx, tIdx, slideId, slotIndex, file);
        }

    };

    const onCropComplete = (croppedFile) => {
        if (!croppingState) return;
        const { mIdx, tIdx, slideId, slotIndex, preview } = croppingState;

        // Now call the original function with the *new cropped file*
        commitMediaChange(mIdx, tIdx, slideId, slotIndex, croppedFile);

        // Clean up
        try { URL.revokeObjectURL(preview); } catch { } // Revoke the *original* preview
        setCroppingState(null);
    };

    const onCropCancel = () => {
        if (!croppingState) return;
        // Revoke the temporary URL
        try { URL.revokeObjectURL(croppingState.preview); } catch { }
        setCroppingState(null);
    };

    const hasModules = safeModules.length > 0;

    /** ---------- AI rewrite: generic per-field (works for 2x2) ---------- */
    const keyFor = (slideId, field) => `${slideId}::${field}`;

    const pushHistoryField = (slideId, field, value) =>
        setContentHistory(prev => ({
            ...prev,
            [keyFor(slideId, field)]: [...(prev[keyFor(slideId, field)] || []), value],
        }));

    const hasHistoryField = (slideId, field) =>
        (contentHistory[keyFor(slideId, field)]?.length || 0) > 0;

    const setLoadingField = (slideId, field, val) =>
        setLoadingMap(prev => ({ ...prev, [keyFor(slideId, field)]: !!val }));

    const isLoadingField = (slideId, field) =>
        !!loadingMap[keyFor(slideId, field)];

    const rewriteField = async (mIdx, tIdx, slide, field) => {
        try {
            const prompt = slide?.[field] || "";
            pushHistoryField(slide.id, field, prompt);
            setLoadingField(slide.id, field, true);

            const resp = await fetch(CONTENT_REWRITE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await resp.json();
            changeSlideField(mIdx, tIdx, slide.id, field, newText || "");
        } catch (err) {
            console.error("AI rewrite error:", err);
        } finally {
            setLoadingField(slide.id, field, false);
        }
    };

    const undoField = (mIdx, tIdx, slideId, field) =>
        setContentHistory(prev => {
            const k = keyFor(slideId, field);
            const stack = prev[k] || [];
            if (!stack.length) return prev;
            const last = stack[stack.length - 1];
            changeSlideField(mIdx, tIdx, slideId, field, last);
            return { ...prev, [k]: stack.slice(0, -1) };
        });

    /** Convenience wrappers for 2x2 fields */
    const rewriteLeft = (mIdx, tIdx, slide) => rewriteField(mIdx, tIdx, slide, "contentLeft");
    const rewriteRight = (mIdx, tIdx, slide) => rewriteField(mIdx, tIdx, slide, "contentRight");
    const undoLeft = (mIdx, tIdx, slideId) => undoField(mIdx, tIdx, slideId, "contentLeft");
    const undoRight = (mIdx, tIdx, slideId) => undoField(mIdx, tIdx, slideId, "contentRight");

    const handleFileSelect = (mIdx, tIdx, slideId, slotIndex) => (e) => {
        const file = e.target.files?.[0] || null;

        // call your existing logic (this triggers cropper / etc)
        onMediaChange(mIdx, tIdx, slideId, slotIndex, file);

        // critical: allow selecting the *same* file again later
        e.target.value = "";
    };

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
                                        readOnly={readOnly}
                                        onChange={(e) =>
                                            changeModuleField(mod.id, "title", e.target.value)
                                        }
                                    />
                                </div>

                                {!readOnly && (
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
                                )}
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
                                                            readOnly={readOnly}
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

                                                    {!readOnly && (<div className="courseCont-actions">
                                                        <button
                                                            type="button"
                                                            className="courseCont-iconBtn"
                                                            title="Remove topic"
                                                            onClick={() => removeTopic(mIdx, topic.id)}
                                                            aria-label={`Remove topic ${mIdx + 1}.${tIdx + 1}`}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="courseCont-iconBtn"
                                                            title="Add topic after"
                                                            onClick={() => addTopicAfter(mIdx, tIdx)}
                                                            aria-label={`Add topic after ${mIdx + 1}.${tIdx + 1}`}
                                                        >
                                                            <FontAwesomeIcon icon={faCirclePlus} />
                                                        </button>
                                                    </div>)}
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
                                                                style={{ marginTop: 12, width: "calc(100% - 25px)" }}
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
                                                                            readOnly={readOnly}
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

                                                                    {!readOnly && (
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

                                                                            {false && (<button
                                                                                type="button"
                                                                                className="courseCont-iconBtn"
                                                                                title="Add Audio File"
                                                                                aria-controls={`courseCont-typePicker-${mIdx}-${tIdx}-${sIdx}`}
                                                                                onClick={() => {
                                                                                    if (slide.mediaItems?.[10]?.mediaPreview) {
                                                                                        openAudioPlayer(
                                                                                            mIdx,
                                                                                            tIdx,
                                                                                            slide.id,
                                                                                            slide.mediaItems?.[10]?.mediaPreview
                                                                                        )
                                                                                    }
                                                                                    else {
                                                                                        openMediaPicker(
                                                                                            mIdx,
                                                                                            tIdx,
                                                                                            slide.id,
                                                                                        )
                                                                                    }
                                                                                }
                                                                                }
                                                                            >
                                                                                <FontAwesomeIcon icon={faMusic} />
                                                                            </button>)}

                                                                            {audioPlayer && (
                                                                                <PopupAudioPlayer
                                                                                    audioFile={slide.mediaItems?.[10]?.mediaPreview}
                                                                                    closePopup={closeAudioPlayer}
                                                                                    module={moduleIndex}
                                                                                    slide={slideID}
                                                                                    topic={topicIndex}
                                                                                    isOpen={true}
                                                                                    onDelete={(m, t, s, slot) => {
                                                                                        // ✅ Use the existing onMediaChange to clear it
                                                                                        onMediaChange(m, t, s, slot, null);
                                                                                    }}
                                                                                />
                                                                            )}

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
                                                                                onClick={() => {
                                                                                    if (
                                                                                        inlineSlidePicker &&
                                                                                        inlineSlidePicker.moduleIndex === mIdx &&
                                                                                        inlineSlidePicker.topicIndex === tIdx &&
                                                                                        inlineSlidePicker.slideIndex === sIdx
                                                                                    ) {
                                                                                        setInlineSlidePicker(null);
                                                                                    } else {
                                                                                        setInlineSlidePicker({ moduleIndex: mIdx, topicIndex: tIdx, slideIndex: sIdx });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                                            </button>
                                                                        </div>
                                                                    )}
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
                                                                                    readOnly={!readOnly}
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
                                                                                {!readOnly && (
                                                                                    <>
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
                                                                                    </>
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
                                                                                            readOnly={readOnly}
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
                                                                                        {!readOnly && (
                                                                                            <>
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
                                                                                            </>
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
                                                                                            onChange={(e) => {
                                                                                                setRatio(4 / 3);
                                                                                                handleFileSelect(mIdx, tIdx, slide.id, 0)(e)
                                                                                            }}
                                                                                            disabled={readOnly}
                                                                                            style={{ cursor: readOnly ? "default" : "" }}
                                                                                        />
                                                                                        {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">
                                                                                                {renderPreview(slide.mediaItems[0])}
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
                                                                                        onChange={handleFileSelect(mIdx, tIdx, slide.id, 0)}
                                                                                        disabled={readOnly}
                                                                                        style={{ cursor: readOnly ? "default" : "" }}
                                                                                    />
                                                                                    {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                        <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[0])}</div>
                                                                                    ) : (
                                                                                        <span className="courseCont-mediaHint">Select Media.</span>
                                                                                    )}
                                                                                </label>
                                                                            </section>
                                                                        )}

                                                                        {slide.type === SLIDE_TYPES.MEDIA_GALLERY && (
                                                                            <section className="courseCont-twoCol">
                                                                                <div
                                                                                    className="courseCont-col"
                                                                                    style={{ position: "relative" }}
                                                                                >
                                                                                    <label
                                                                                        className="courseCont-mediaDrop"
                                                                                        style={{ marginTop: "8px", paddingBottom: "30px", paddingTop: "29px" }}
                                                                                    >
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,video/*,audio/*"
                                                                                            onChange={(e) => {
                                                                                                setRatio(4 / 3);
                                                                                                handleFileSelect(mIdx, tIdx, slide.id, 0)(e)
                                                                                            }}
                                                                                            disabled={readOnly}
                                                                                            style={{ cursor: readOnly ? "default" : "" }}
                                                                                        />
                                                                                        {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">
                                                                                                {renderPreview(slide.mediaItems[0])}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="courseCont-mediaHint">
                                                                                                Select Media.
                                                                                            </span>
                                                                                        )}
                                                                                    </label>
                                                                                </div>
                                                                                <div className="courseCont-col">
                                                                                    <label
                                                                                        className="courseCont-mediaDrop"
                                                                                        style={{ marginTop: "8px", paddingBottom: "30px", paddingTop: "29px" }}
                                                                                    >
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,video/*,audio/*"
                                                                                            onChange={(e) => {
                                                                                                setRatio(4 / 3);
                                                                                                handleFileSelect(mIdx, tIdx, slide.id, 1)(e)
                                                                                            }}
                                                                                            disabled={readOnly}
                                                                                            style={{ cursor: readOnly ? "default" : "" }}
                                                                                        />
                                                                                        {slide.mediaItems?.[1]?.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">
                                                                                                {renderPreview(slide.mediaItems[1])}
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

                                                                        {slide.type === SLIDE_TYPES.TEXT_MEDIA_2X2 && (
                                                                            // A new parent container that stacks the two rows vertically
                                                                            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                                                                                {/* --- Row 1: Text Left + Media Top --- */}
                                                                                <div className="courseCont-twoCol" style={{ gap: 16 }}>
                                                                                    <div className="courseCont-col">
                                                                                        <div style={{ position: "relative" }}>
                                                                                            <textarea
                                                                                                className="courseCont-textarea"
                                                                                                placeholder="Insert content (top)."
                                                                                                rows={8}
                                                                                                value={slide.contentLeft || ""}
                                                                                                onChange={(e) =>
                                                                                                    changeSlideField(mIdx, tIdx, slide.id, "contentLeft", e.target.value)
                                                                                                }
                                                                                                readOnly={readOnly}
                                                                                                style={{ paddingBottom: "20px" }}
                                                                                            />

                                                                                            {!readOnly && (
                                                                                                <>
                                                                                                    {isLoadingField(slide.id, "contentLeft") ? (
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
                                                                                                            style={{ fontSize: "15px", cursor: "pointer", bottom: 23 }}
                                                                                                            onClick={() => rewriteLeft(mIdx, tIdx, slide)}
                                                                                                        />
                                                                                                    )}

                                                                                                    {hasHistoryField(slide.id, "contentLeft") && (
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
                                                                                                            onClick={() => undoLeft(mIdx, tIdx, slide.id)}
                                                                                                        />
                                                                                                    )}
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 15, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 0)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[0])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>

                                                                                {/* --- Row 2: Text Right + Media Bottom --- */}
                                                                                <div className="courseCont-twoCol" style={{ gap: 16 }}>
                                                                                    <div className="courseCont-col">
                                                                                        <div style={{ position: "relative" }}>
                                                                                            <textarea
                                                                                                className="courseCont-textarea"
                                                                                                placeholder="Insert content (bottom)."
                                                                                                rows={8}
                                                                                                value={slide.contentRight || ""}
                                                                                                onChange={(e) =>
                                                                                                    changeSlideField(mIdx, tIdx, slide.id, "contentRight", e.target.value)
                                                                                                }
                                                                                                readOnly={readOnly}
                                                                                                style={{ paddingBottom: "20px" }}
                                                                                            />
                                                                                            {!readOnly && (
                                                                                                <>
                                                                                                    {isLoadingField(slide.id, "contentRight") ? (
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
                                                                                                            style={{ fontSize: "15px", cursor: "pointer", bottom: 23 }}
                                                                                                            onClick={() => rewriteRight(mIdx, tIdx, slide)}
                                                                                                        />
                                                                                                    )}

                                                                                                    {hasHistoryField(slide.id, "contentRight") && (
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
                                                                                                            onClick={() => undoRight(mIdx, tIdx, slide.id)}
                                                                                                        />
                                                                                                    )}
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 15, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 1)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[1]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[1])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </section>
                                                                        )}

                                                                        {slide.type === SLIDE_TYPES.MEDIAX2_TEXT && (
                                                                            <section className="courseCont-twoCol" style={{ gap: 16 }}>
                                                                                {/* LEFT column */}
                                                                                <div className="courseCont-col" style={{ position: "relative" }}>
                                                                                    <textarea
                                                                                        className="courseCont-textarea-stacked"
                                                                                        placeholder="Insert content."
                                                                                        rows={8}
                                                                                        value={slide.content || ""}
                                                                                        readOnly={readOnly}
                                                                                        onChange={(e) =>
                                                                                            changeSlideField(mIdx, tIdx, slide.id, "content", e.target.value)
                                                                                        }
                                                                                        style={{ paddingBottom: "35px", position: "relative" }}
                                                                                    />

                                                                                    {!readOnly && (
                                                                                        <>
                                                                                            {loadingMap[slide.id] ? (
                                                                                                <FontAwesomeIcon
                                                                                                    icon={faSpinner}
                                                                                                    className="induction-textarea-icon-ai-rewrite spin-animation"
                                                                                                    title="Rewriting…"
                                                                                                    style={{ fontSize: "15px", bottom: 13 }}
                                                                                                />
                                                                                            ) : (
                                                                                                <FontAwesomeIcon
                                                                                                    icon={faMagicWandSparkles}
                                                                                                    className="induction-textarea-icon-ai-rewrite"
                                                                                                    title="AI Rewrite"
                                                                                                    style={{
                                                                                                        fontSize: "15px",
                                                                                                        cursor: "pointer",
                                                                                                        bottom: 13
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
                                                                                                        right: 30,
                                                                                                        bottom: 13,
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
                                                                                        </>
                                                                                    )}
                                                                                </div>

                                                                                {/* RIGHT column */}
                                                                                <div className="courseCont-col">
                                                                                    <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,video/*,audio/*"
                                                                                            onChange={(e) =>
                                                                                                onMediaChange(mIdx, tIdx, slide.id, 0, e.target.files?.[0] || null)
                                                                                            }
                                                                                            disabled={readOnly}
                                                                                            style={{ cursor: readOnly ? "default" : "" }}
                                                                                        />
                                                                                        {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[0])}</div>
                                                                                        ) : (
                                                                                            <span className="courseCont-mediaHint">Select Media.</span>
                                                                                        )}
                                                                                    </label>
                                                                                    <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*,video/*,audio/*"
                                                                                            onChange={(e) =>
                                                                                                onMediaChange(mIdx, tIdx, slide.id, 1, e.target.files?.[0] || null)
                                                                                            }
                                                                                            disabled={readOnly}
                                                                                            style={{ cursor: readOnly ? "default" : "" }}
                                                                                        />
                                                                                        {slide.mediaItems?.[1]?.mediaPreview ? (
                                                                                            <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[1])}</div>
                                                                                        ) : (
                                                                                            <span className="courseCont-mediaHint">Select Media.</span>
                                                                                        )}
                                                                                    </label>
                                                                                </div>
                                                                            </section>
                                                                        )}

                                                                        {slide.type === SLIDE_TYPES.MEDIA_2X2 && (
                                                                            // A new parent container that stacks the two rows vertically
                                                                            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                                                                                {/* --- Row 1: Top-Left Media + Top-Right Media --- */}
                                                                                <div className="courseCont-twoCol" style={{ gap: 16 }}>
                                                                                    {/* Top-Left column */}
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 0)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[0]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[0])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                    {/* Top-Right column */}
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 1)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[1]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[1])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>

                                                                                {/* --- Row 2: Bottom-Left Media + Bottom-Right Media --- */}
                                                                                <div className="courseCont-twoCol" style={{ gap: 16 }}>
                                                                                    {/* Bottom-Left column */}
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 2)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[2]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[2])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                    {/* Bottom-Right column */}
                                                                                    <div className="courseCont-col">
                                                                                        <label className="courseCont-mediaDrop" style={{ marginTop: 8, paddingBottom: 30, paddingTop: 29 }}>
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*,video/*,audio/*"
                                                                                                onChange={handleFileSelect(mIdx, tIdx, slide.id, 3)}
                                                                                                disabled={readOnly}
                                                                                                style={{ cursor: readOnly ? "default" : "" }}
                                                                                            />
                                                                                            {slide.mediaItems?.[3]?.mediaPreview ? (
                                                                                                <div className="courseCont-mediaPreview">{renderPreview(slide.mediaItems[3])}</div>
                                                                                            ) : (
                                                                                                <span className="courseCont-mediaHint">Select Media.</span>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </section>
                                                                        )}

                                                                        {slide.type === SLIDE_TYPES.PDF_VIEW && (
                                                                            <section className="courseCont-pdfWrap">
                                                                                {/* 1. Use a div as a positioning container instead of a label */}
                                                                                <div className="courseCont-mediaDrop courseCont-mediaOnly" style={{ position: 'relative' }}>

                                                                                    {/* 2. The file input is now hidden and referenced by the label */}
                                                                                    <input
                                                                                        id={`pdf-upload-${slide.id}`}
                                                                                        type="file"
                                                                                        accept="application/pdf"
                                                                                        style={{ display: 'none', cursor: readOnly ? "default" : "" }}
                                                                                        onChange={handleFileSelect(mIdx, tIdx, slide.id, 0)}
                                                                                        disabled={readOnly}
                                                                                    />

                                                                                    {/* 3. This label acts as a clickable background */}
                                                                                    <label
                                                                                        htmlFor={`pdf-upload-${slide.id}`}
                                                                                        style={{
                                                                                            position: 'absolute',
                                                                                            top: 0,
                                                                                            left: 0,
                                                                                            width: '100%',
                                                                                            height: '100%',
                                                                                            zIndex: 1, // Place it behind the iframe
                                                                                            cursor: 'pointer',
                                                                                            display: 'flex',
                                                                                            justifyContent: 'center',
                                                                                            alignItems: 'center',
                                                                                        }}
                                                                                    >
                                                                                        {/* Show hint text only when no PDF is selected */}
                                                                                        {!slide.mediaItems?.[0]?.mediaPreview && (
                                                                                            <span className="courseCont-mediaHint">Select PDF.</span>
                                                                                        )}
                                                                                    </label>

                                                                                    {/* 4. The iframe is rendered in a container on top of the label */}
                                                                                    {slide.mediaItems?.[0]?.mediaPreview && (
                                                                                        <div
                                                                                            className="courseCont-mediaPreview"
                                                                                            style={{
                                                                                                position: 'relative', // Ensure z-index applies correctly
                                                                                                zIndex: 2, // Place it in front of the background label
                                                                                                width: '100%',
                                                                                                height: '100%',
                                                                                            }}
                                                                                        >
                                                                                            <iframe
                                                                                                src={slide.mediaItems[0].mediaPreview}
                                                                                                title="PDF preview"
                                                                                                className="courseCont-pdfFrame"
                                                                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </section>
                                                                        )}
                                                                    </div>
                                                                )}


                                                            </div>
                                                        ))}

                                                        {/* Add slide (footer picker per topic) */}
                                                        {!readOnly && (
                                                            <div className="courseCont-addWrap" style={{ marginTop: 10 }}>

                                                                <button
                                                                    type="button"
                                                                    className="add-row-button"
                                                                    onClick={() => setSlidePickerFor({ moduleIndex: mIdx, topicIndex: tIdx })}
                                                                >
                                                                    Add Slide
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {!readOnly && (
                                        <div className="courseCont-addWrap" style={{ marginTop: 10 }}>
                                            <button
                                                type="button"
                                                className="add-row-button"
                                                onClick={() => addTopicToModule(mIdx)}
                                            >
                                                Add Topic
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Module */}
                {!readOnly && (
                    <div className="courseCont-addWrap">
                        <button type="button" className="add-row-button" onClick={addModule}>
                            Add Module
                        </button>
                    </div>
                )}
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
                    { id: SLIDE_TYPES.TEXT, label: "Text Only", imgSrc: "/Content_Text.png", alt: "Text" },
                    { id: SLIDE_TYPES.TEXT_MEDIA, label: "Text + Media (Split)", imgSrc: "/Content_TextMedia_Split.png", alt: "Text and Media" },
                    { id: SLIDE_TYPES.MEDIAX2_TEXT, label: "Text + Media (Stacked)", imgSrc: "/Content_TextMedia_Stacked.png", alt: "Media" },
                    { id: SLIDE_TYPES.TEXT_MEDIA_2X2, label: "Text + Media (Grid)", imgSrc: "/Content_TextMedia_Grid.png", alt: "Text and Media 2x2" },
                    { id: SLIDE_TYPES.MEDIA, label: "Media Only", imgSrc: "/Content_Media.png", alt: "Media" },
                    { id: SLIDE_TYPES.MEDIA_GALLERY, label: "Media (Collage Split)", imgSrc: "/Content_Media_CollageSplit.png", alt: "Media" },
                    { id: SLIDE_TYPES.MEDIA_2X2, label: "Media (Collage Grid)", imgSrc: "/Content_Media_CollageGrid.png", alt: "Text and Media 2x2" },
                    { id: SLIDE_TYPES.PDF_VIEW, label: "PDF View", imgSrc: "/Content_PDF.png", alt: "Text and Media 2x2" },
                ]}
            />

            <TypeSelectorPopup
                isOpen={!!inlineSlidePicker}
                title="Select slide type"
                onClose={() => setInlineSlidePicker(null)}
                onSelect={(typeId) => {
                    if (!inlineSlidePicker) return;
                    addSlideAfter(
                        inlineSlidePicker.moduleIndex,
                        inlineSlidePicker.topicIndex,
                        inlineSlidePicker.slideIndex,
                        typeId
                    );
                    // addSlideAfter already closes with setInlineSlidePicker(null)
                }}
                options={[
                    { id: SLIDE_TYPES.TEXT, label: "Text Only", imgSrc: "/Content_Text.png", alt: "Text" },
                    { id: SLIDE_TYPES.TEXT_MEDIA, label: "Text + Media (Split)", imgSrc: "/Content_TextMedia_Split.png", alt: "Text and Media" },
                    { id: SLIDE_TYPES.MEDIAX2_TEXT, label: "Text + Media (Stacked)", imgSrc: "/Content_TextMedia_Stacked.png", alt: "Media" },
                    { id: SLIDE_TYPES.TEXT_MEDIA_2X2, label: "Text + Media (Grid)", imgSrc: "/Content_TextMedia_Grid.png", alt: "Text and Media 2x2" },
                    { id: SLIDE_TYPES.MEDIA, label: "Media Only", imgSrc: "/Content_Media.png", alt: "Media" },
                    { id: SLIDE_TYPES.MEDIA_GALLERY, label: "Media (Collage Split)", imgSrc: "/Content_Media_CollageSplit.png", alt: "Media" },
                    { id: SLIDE_TYPES.MEDIA_2X2, label: "Media (Collage Grid)", imgSrc: "/Content_Media_CollageGrid.png", alt: "Text and Media 2x2" },
                    { id: SLIDE_TYPES.PDF_VIEW, label: "PDF View", imgSrc: "/Content_PDF.png", alt: "Text and Media 2x2" },
                ]}
            />

            {mediaPicker && (<AudioPicker changeMedia={onMediaChange} module={moduleIndex} slide={slideID} topic={topicIndex} onClose={closeMediaPicker} />)}
            {croppingState && (
                <ImageCropPopup
                    previewUrl={croppingState.preview}
                    originalFile={croppingState.file}
                    onClose={onCropCancel}
                    onUpload={onCropComplete}
                    DEFAULT_ASPECT={ratio}
                />
            )}
        </div>
    );
};

export default InductionContent;
