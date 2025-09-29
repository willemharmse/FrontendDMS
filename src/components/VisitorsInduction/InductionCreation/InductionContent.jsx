import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faChevronDown, faCirclePlus, faTrash } from "@fortawesome/free-solid-svg-icons";

/** Topic content types */
const SLIDE_TYPES = {
    TEXT: "TEXT",
    TEXT_MEDIA: "TEXT_MEDIA",
    MEDIA: "MEDIA",
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getMime = (topic) => {
    // Prefer the currently selected file's MIME type
    const type =
        topic.mediaFile?.type ||
        topic.media?.contentType ||
        topic.mediaType ||
        "";

    return type.toLowerCase();
};


const renderPreview = (topic) => {
    if (!topic.mediaPreview) return <span className="courseCont-mediaHint">Select Media.</span>;

    const mime = getMime(topic);
    if (mime.startsWith("image/")) return <img src={topic.mediaPreview} alt="preview" />;
    if (mime.startsWith("video/")) return <video src={topic.mediaPreview} controls style={{ width: "100%" }} />;
    if (mime.startsWith("audio/")) return <audio src={topic.mediaPreview} controls />;

    // unknown type -> let user download
    const name = topic.media?.filename || topic.mediaFile?.name || "file";
    return <a href={topic.mediaPreview} download={name}>{name}</a>;
};

const emptySlide = (type) => ({
    id: newId(),
    type,
    title: "",
    content: "",
    mediaFile: null,
    mediaPreview: null,
    collapsed: false,
});

const emptyModule = (title = "") => ({
    id: newId(),
    title,               // no default like "Module 1"
    collapsed: false,
    slides: [],
});

const InductionContent = ({ formData, setFormData }) => {
    const modules = formData?.courseModules ?? [];
    const flatSlides = formData?.courseContent ?? [];

    // Migrate legacy flat slides into a single module (with no default title)
    useEffect(() => {
        if ((!modules || modules.length === 0) && flatSlides && flatSlides.length > 0) {
            const initialModule = emptyModule("");
            initialModule.slides = flatSlides;
            setFormData((prev) => ({
                ...(prev || {}),
                courseModules: [initialModule],
                courseContent: undefined,
            }));
        }
    }, [modules, flatSlides, setFormData]);

    const safeModules = useMemo(() => modules ?? [], [modules]);

    // Inline pickers
    const [topicPickerFor, setTopicPickerFor] = useState(null);   // { moduleIndex, topicIndex } | null
    const [modulePickerFor, setModulePickerFor] = useState(null); // number | null (footer picker per module)

    const updateModules = (next) =>
        setFormData((prev) => ({ ...(prev || {}), courseModules: next }));

    // ----- Module ops -----
    const addModule = () => {
        updateModules([...safeModules, { ...emptyModule("") }]);
    };

    const addModuleAfter = (moduleIndex) => {
        const next = [...safeModules];
        next.splice(moduleIndex + 1, 0, { ...emptyModule("") });
        updateModules(next);
    };

    const removeModule = (moduleId) => {
        updateModules(safeModules.filter((m) => m.id !== moduleId));
    };

    const changeModuleField = (moduleId, field, value) => {
        updateModules(safeModules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)));
    };

    const toggleModuleCollapse = (moduleId) => {
        updateModules(safeModules.map((m) => (m.id === moduleId ? { ...m, collapsed: !m.collapsed } : m)));
    };

    // ----- Topic ops -----
    // Insert AFTER a topic (uses inline picker)
    const addTopicAfter = (moduleIndex, topicIndex, type) => {
        const next = [...safeModules];
        const topics = [...(next[moduleIndex].slides || [])];
        topics.splice(topicIndex + 1, 0, emptySlide(type));
        next[moduleIndex] = { ...next[moduleIndex], slides: topics };
        updateModules(next);
        setTopicPickerFor(null);
    };

    // Append to end of module (uses footer picker)
    const addTopicToModule = (moduleIndex, type) => {
        const next = [...safeModules];
        const topics = [...(next[moduleIndex].slides || [])];
        topics.push(emptySlide(type));
        next[moduleIndex] = { ...next[moduleIndex], slides: topics };
        updateModules(next);
        setModulePickerFor(null);
    };

    const changeTopicField = (moduleIndex, topicId, field, value) => {
        const next = [...safeModules];
        const topics = (next[moduleIndex].slides || []).map((t) =>
            t.id === topicId ? { ...t, [field]: value } : t
        );
        next[moduleIndex] = { ...next[moduleIndex], slides: topics };
        updateModules(next);
    };

    const toggleTopicCollapse = (moduleIndex, topicId) => {
        const next = [...safeModules];
        const topics = (next[moduleIndex].slides || []).map((t) =>
            t.id === topicId ? { ...t, collapsed: !t.collapsed } : t
        );
        next[moduleIndex] = { ...next[moduleIndex], slides: topics };
        updateModules(next);
    };

    const removeTopic = (moduleIndex, topicId) => {
        const next = [...safeModules];
        next[moduleIndex] = {
            ...next[moduleIndex],
            slides: (next[moduleIndex].slides || []).filter((t) => t.id !== topicId),
        };
        updateModules(next);
    };

    const onMediaChange = (moduleIndex, topicId, file) => {
        const next = [...safeModules];

        const topics = (next[moduleIndex].slides || []).map((t) => {
            if (t.id !== topicId) return t;

            // Revoke previous blob URL if any
            if (t.mediaPreview && t.mediaPreview.startsWith("blob:")) {
                try { URL.revokeObjectURL(t.mediaPreview); } catch { }

            }

            return {
                ...t,
                // Clear any old remote media metadata that could mask the new file
                media: null,
                // Keep mediaType in sync with the actual file MIME type (or clear it)
                mediaType: file?.type || null,
                mediaFile: file || null,
                mediaPreview: file ? URL.createObjectURL(file) : null,
            };
        });

        next[moduleIndex] = { ...next[moduleIndex], slides: topics };
        updateModules(next);
    };

    const hasModules = safeModules.length > 0;

    return (
        <div className="input-row">
            <div className="modern-chapter-table">
                <h3 className="font-fam-labels">Content</h3>

                {/* ===== Modules ===== */}
                {safeModules.map((mod, mIdx) => {
                    const topics = mod.slides || [];
                    const hasTopics = topics.length > 0;

                    return (
                        <div key={mod.id} className={`courseCont-card${mod.collapsed ? " courseCont-card--collapsed" : ""}`}>
                            {/* Module header */}
                            <div className="courseCont-cardHeader">
                                <button
                                    type="button"
                                    className="courseCont-toggleBtn"
                                    aria-label={mod.collapsed ? "Expand module" : "Collapse module"}
                                    aria-expanded={!mod.collapsed}
                                    onClick={() => toggleModuleCollapse(mod.id)}
                                >
                                    <FontAwesomeIcon icon={mod.collapsed ? faChevronRight : faChevronDown} />
                                </button>

                                <div className="courseCont-titleRow">
                                    <span className="courseCont-slideLabel">{`Module ${mIdx + 1} :`}</span>
                                    <textarea
                                        className="courseCont-titleInput"
                                        rows={1}
                                        placeholder="Insert Module Title"
                                        value={mod.title}
                                        onChange={(e) => changeModuleField(mod.id, "title", e.target.value)}
                                    />
                                </div>

                                <div className="courseCont-actions">
                                    {/* Delete module */}
                                    <button
                                        type="button"
                                        className="courseCont-iconBtn"
                                        title="Remove module"
                                        onClick={() => removeModule(mod.id)}
                                        aria-label={`Remove module ${mIdx + 1}`}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>

                                    {/* Insert module after */}
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
                                    {/* Topics list */}
                                    {topics.map((topic, tIdx) => (
                                        <div
                                            key={topic.id}
                                            className={`courseCont-card${topic.collapsed ? " courseCont-card--collapsed" : ""}`}
                                            style={{ marginTop: 12 }}
                                        >
                                            {/* Topic header */}
                                            <div className="courseCont-cardHeader">
                                                <button
                                                    type="button"
                                                    className="courseCont-toggleBtn"
                                                    aria-label={topic.collapsed ? "Expand topic" : "Collapse topic"}
                                                    aria-expanded={!topic.collapsed}
                                                    onClick={() => toggleTopicCollapse(mIdx, topic.id)}
                                                >
                                                    <FontAwesomeIcon icon={topic.collapsed ? faChevronRight : faChevronDown} />
                                                </button>

                                                <div className="courseCont-titleRow">
                                                    <span className="courseCont-slideLabel">{`Topic ${mIdx + 1}.${tIdx + 1} :`}</span>
                                                    <textarea
                                                        className="courseCont-titleInput"
                                                        rows={1}
                                                        placeholder="Insert Topic Title"
                                                        value={topic.title}
                                                        onChange={(e) => changeTopicField(mIdx, topic.id, "title", e.target.value)}
                                                    />
                                                </div>

                                                {/* Topic actions: delete + inline type picker (insert after) */}
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

                                                    <button
                                                        type="button"
                                                        className="courseCont-iconBtn"
                                                        title="Add topic after"
                                                        aria-haspopup="menu"
                                                        aria-expanded={
                                                            topicPickerFor &&
                                                            topicPickerFor.moduleIndex === mIdx &&
                                                            topicPickerFor.topicIndex === tIdx
                                                        }
                                                        aria-controls={`courseCont-typePicker-${mIdx}-${tIdx}`}
                                                        onClick={() =>
                                                            setTopicPickerFor((cur) =>
                                                                cur && cur.moduleIndex === mIdx && cur.topicIndex === tIdx
                                                                    ? null
                                                                    : { moduleIndex: mIdx, topicIndex: tIdx }
                                                            )
                                                        }
                                                    >
                                                        <FontAwesomeIcon icon={faCirclePlus} />
                                                    </button>

                                                    {topicPickerFor &&
                                                        topicPickerFor.moduleIndex === mIdx &&
                                                        topicPickerFor.topicIndex === tIdx && (
                                                            <div
                                                                id={`courseCont-typePicker-${mIdx}-${tIdx}`}
                                                                className="courseCont-typePicker-inline"
                                                                role="menu"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="courseCont-typeItem"
                                                                    onClick={() => addTopicAfter(mIdx, tIdx, SLIDE_TYPES.TEXT)}
                                                                    role="menuitem"
                                                                >
                                                                    Text only
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="courseCont-typeItem"
                                                                    onClick={() => addTopicAfter(mIdx, tIdx, SLIDE_TYPES.TEXT_MEDIA)}
                                                                    role="menuitem"
                                                                >
                                                                    Text + Media
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="courseCont-typeItem"
                                                                    onClick={() => addTopicAfter(mIdx, tIdx, SLIDE_TYPES.MEDIA)}
                                                                    role="menuitem"
                                                                >
                                                                    Media only
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Topic body (editor unchanged) */}
                                            {!topic.collapsed && (
                                                <div className="courseCont-body">
                                                    {topic.type === SLIDE_TYPES.TEXT && (
                                                        <section>
                                                            <h5 className="courseCont-sectionTitle">Content</h5>
                                                            <textarea
                                                                className="courseCont-textarea"
                                                                placeholder="Insert content."
                                                                rows={8}
                                                                value={topic.content}
                                                                onChange={(e) => changeTopicField(mIdx, topic.id, "content", e.target.value)}
                                                            />
                                                        </section>
                                                    )}

                                                    {topic.type === SLIDE_TYPES.TEXT_MEDIA && (
                                                        <section className="courseCont-twoCol">
                                                            <div className="courseCont-col">
                                                                <h5 className="courseCont-sectionTitle">Content</h5>
                                                                <textarea
                                                                    className="courseCont-textarea"
                                                                    placeholder="Insert content."
                                                                    rows={10}
                                                                    value={topic.content}
                                                                    onChange={(e) => changeTopicField(mIdx, topic.id, "content", e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="courseCont-col">
                                                                <h5 className="courseCont-sectionTitle">Media</h5>
                                                                <label className="courseCont-mediaDrop">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,video/*,audio/*"
                                                                        onChange={(e) => onMediaChange(mIdx, topic.id, e.target.files?.[0] || null)}
                                                                    />
                                                                    {topic.mediaPreview ? (
                                                                        <div className="courseCont-mediaPreview">
                                                                            {renderPreview(topic)}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="courseCont-mediaHint">Select Media.</span>
                                                                    )}
                                                                </label>
                                                            </div>
                                                        </section>
                                                    )}

                                                    {topic.type === SLIDE_TYPES.MEDIA && (
                                                        <section>
                                                            <h5 className="courseCont-sectionTitle">Media</h5>
                                                            <label className="courseCont-mediaDrop courseCont-mediaOnly">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,video/*,audio/*"
                                                                    onChange={(e) => onMediaChange(mIdx, topic.id, e.target.files?.[0] || null)}
                                                                />
                                                                {topic.mediaPreview ? (
                                                                    <div className="courseCont-mediaPreview">
                                                                        {renderPreview(topic)}
                                                                    </div>
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

                                    <div className="courseCont-addWrap" style={{ marginTop: 10 }}>
                                        {hasTopics ? (
                                            <button
                                                type="button"
                                                className="courseCont-add-iconBtn"
                                                title="Add topic"
                                                aria-label={`Add topic to module ${mIdx + 1}`}
                                                onClick={() => setModulePickerFor(modulePickerFor === mIdx ? null : mIdx)}
                                            >
                                                <FontAwesomeIcon icon={faCirclePlus} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="add-row-button"
                                                onClick={() => setModulePickerFor(modulePickerFor === mIdx ? null : mIdx)}
                                                aria-expanded={modulePickerFor === mIdx}
                                                aria-controls={`courseCont-slidePicker-${mIdx}`}
                                            >
                                                Add Topic
                                            </button>
                                        )}

                                        {modulePickerFor === mIdx && (
                                            <div
                                                id={`courseCont-slidePicker-${mIdx}`}
                                                className="courseCont-typePicker"
                                                role="menu"
                                            >
                                                <button
                                                    type="button"
                                                    className="courseCont-typeItem"
                                                    onClick={() => addTopicToModule(mIdx, SLIDE_TYPES.TEXT)}
                                                    role="menuitem"
                                                >
                                                    Text only
                                                </button>
                                                <button
                                                    type="button"
                                                    className="courseCont-typeItem"
                                                    onClick={() => addTopicToModule(mIdx, SLIDE_TYPES.TEXT_MEDIA)}
                                                    role="menuitem"
                                                >
                                                    Text + Media
                                                </button>
                                                <button
                                                    type="button"
                                                    className="courseCont-typeItem"
                                                    onClick={() => addTopicToModule(mIdx, SLIDE_TYPES.MEDIA)}
                                                    role="menuitem"
                                                >
                                                    Media only
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="courseCont-addWrap">
                    {hasModules ? (
                        <button
                            type="button"
                            className="courseCont-add-iconBtn"
                            title="Add module"
                            aria-label="Add module"
                            onClick={addModule}
                        >
                            <FontAwesomeIcon icon={faCirclePlus} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="add-row-button"
                            onClick={addModule}
                        >
                            Add Module
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InductionContent;
