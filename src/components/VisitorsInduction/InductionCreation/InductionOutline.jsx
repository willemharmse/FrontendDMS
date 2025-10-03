import { faDownload, faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useEffect } from "react";

// --- helpers -------------------------------------------------
const parseDurationToMinutes = (raw) => {
    if (raw == null) return 0;
    const s = String(raw).trim();
    if (!s) return 0;

    // Support "H:MM"
    if (/^\d+:\d{1,2}$/.test(s)) {
        const [h, m] = s.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
    }
    // Support "1.5h", "2h", "90m", "45 min"
    const h = s.match(/^(\d+(\.\d+)?)\s*h/i);
    if (h) return Math.round(parseFloat(h[1]) * 60);

    const m = s.match(/^(\d+(\.\d+)?)\s*m(in)?/i);
    if (m) return Math.round(parseFloat(m[1]));

    // Plain number -> minutes
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n) : 0;
};

const formatMinutes = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

const getTopicMeta = (outline, topicId) =>
    (outline?.topicMeta && outline.topicMeta[topicId]) ||
    (outline?.slideMeta && outline.slideMeta[topicId]) || // legacy fallback (same key but for topic)
    { duration: "", description: "" };

const buildOutlineTable = (modules, outline) => {
    const rows = [];

    // Row 0 — Introduction
    rows.push({
        kind: "intro",
        nr: "0",
        topic: "Introduction",
        duration: outline?.introDuration || "",
        description: outline?.introDescription || "",
    });

    // Modules & slides
    modules.forEach((mod, mIdx) => {
        rows.push({
            kind: "module",
            moduleIndex: mIdx,
            text: `Module ${mIdx + 1}: ${mod.title || "Module Title"}`,
        });

        const topics = Array.isArray(mod.topics) ? mod.topics : [];
        if (topics.length) {
            topics.forEach((topic, tIdx) => {
                const meta = getTopicMeta(outline, topic.id);
                rows.push({
                    kind: "topic",
                    moduleIndex: mIdx,
                    topicIndex: tIdx,
                    topicId: topic.id,
                    nr: `${mIdx + 1}.${tIdx + 1}`,
                    topic: topic.title || "Topic Title",
                    duration: meta.duration || "",
                    description: meta.description || "",
                });
            });
        } else {
            // legacy fallback: show slides as topics
            (mod.slides || []).forEach((slide, sIdx) => {
                const meta = getTopicMeta(outline, slide.id);
                rows.push({
                    kind: "topic",
                    moduleIndex: mIdx,
                    topicIndex: sIdx,
                    topicId: slide.id,
                    nr: `${mIdx + 1}.${sIdx + 1}`,
                    topic: slide.title || "Topic Title",
                    duration: meta.duration || "",
                    description: meta.description || "",
                });
            });
        }
    });

    return rows;
};

const shallowEqualJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// -------------------------------------------------------------

const InductionOutline = ({ formData, setFormData }) => {
    const modules = formData?.courseModules || [];
    const outline = formData?.courseOutline || {};

    // minutes from Introduction + all slideMeta durations
    const totalMinutes = useMemo(() => {
        const introMin = parseDurationToMinutes(outline?.introDuration);
        let sum = introMin;

        for (const mod of modules) {
            const topics = Array.isArray(mod.topics) ? mod.topics : [];
            if (topics.length) {
                for (const topic of topics) {
                    const meta = getTopicMeta(outline, topic.id);
                    sum += parseDurationToMinutes(meta?.duration);
                }
            } else {
                // legacy fallback: treat slides as topics
                for (const slide of mod.slides || []) {
                    const meta = getTopicMeta(outline, slide.id);
                    sum += parseDurationToMinutes(meta?.duration);
                }
            }
        }
        return sum;
    }, [outline?.introDuration, outline?.topicMeta, outline?.slideMeta, modules]);

    const totalPretty = useMemo(() => formatMinutes(totalMinutes), [totalMinutes]);

    // Keep courseOutline.duration in sync (read-only UI)
    useEffect(() => {
        setFormData((prev) => {
            const prevOutline = prev?.courseOutline || {};
            if (prevOutline.duration === totalPretty) return prev;
            return {
                ...prev,
                courseOutline: { ...prevOutline, duration: totalPretty },
            };
        });
    }, [totalPretty, setFormData]);

    // Maintain a denormalized snapshot table under courseOutline.table
    useEffect(() => {
        const nextTable = buildOutlineTable(modules, outline);
        setFormData((prev) => {
            const prevOutline = prev?.courseOutline || {};
            if (shallowEqualJSON(prevOutline.table, nextTable)) return prev;
            return {
                ...prev,
                courseOutline: { ...prevOutline, table: nextTable },
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modules, outline?.introDuration, outline?.introDescription, outline?.topicMeta, outline?.slideMeta]);

    // ---- updaters that ONLY touch courseOutline ----
    const updateOutline = (patch) =>
        setFormData((prev) => ({
            ...prev,
            courseOutline: { ...(prev.courseOutline || {}), ...patch },
        }));

    const updateIntro = (field, value) =>
        updateOutline({ [field]: value });

    const updateTopicMeta = (topicId, field, value) =>
        setFormData((prev) => {
            const co = prev.courseOutline || {};
            const cur = (co.topicMeta && co.topicMeta[topicId]) ||
                (co.slideMeta && co.slideMeta[topicId]) || {};
            const nextTopicMeta = {
                ...(co.topicMeta || {}),
                [topicId]: { ...cur, [field]: value },
            };
            return { ...prev, courseOutline: { ...co, topicMeta: nextTopicMeta } };
        });

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Outline</h3>
                <button className="top-right-button-proc" title="Download">
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>

                {/* Top bar: Department + Auto Duration */}
                <div className="course-outline-row-split">
                    <div className="course-outline-type-split-1">
                        <h3 className="font-fam-labels">Department</h3>
                        <input
                            value={outline.department || ""}
                            onChange={(e) => updateOutline({ department: e.target.value })}
                            type="text"
                            autoComplete="off"
                            className="course-outline-input"
                            placeholder="Insert Department Name"
                        />
                    </div>

                    <div className="course-outline-type-split-2">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h3 className="font-fam-labels">Duration</h3>
                        </div>
                        <input
                            value={outline.duration || totalPretty}
                            readOnly
                            className="course-outline-input"
                            placeholder="Auto Calculated"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="course-outline-table-content table-borders">
                    <table>
                        <thead>
                            <tr>
                                <th className="col-num-course-outline-data">Nr</th>
                                <th className="col-topic-course-outline-data">Topic</th>
                                <th className="col-time-course-outline-data">Duration (Minutes)</th>
                                <th className="col-desc-course-outline-data">Description</th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* 0 — Introduction */}
                            <tr>
                                <td className="col-um">0</td>
                                <td className="col-um" style={{ textAlign: "left" }}>
                                    Introduction
                                </td>
                                <td className="col-um" style={{ textAlign: "left" }}>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        value={outline.introDuration || ""}
                                        onChange={(e) => updateIntro("introDuration", e.target.value)}
                                        className="course-outline-input"
                                        placeholder="Insert Duration"
                                    />
                                </td>
                                <td className="col-um">
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={outline.introDescription || ""}
                                            onChange={(e) => updateIntro("introDescription", e.target.value)}
                                            className="course-outline-input"
                                            placeholder="Insert Topic Description"
                                        />
                                        <FontAwesomeIcon
                                            icon={faMagicWandSparkles}
                                            className="input-with-icon__icon"
                                            title="AI Rewrite"
                                        />
                                    </div>
                                </td>
                            </tr>

                            {/* Modules */}
                            {modules.map((mod, mIdx) => (
                                <React.Fragment key={mod.id || mIdx}>
                                    {/* Module header row (merged) */}
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", fontWeight: 600, backgroundColor: "#d6d6d6ff" }}>
                                            {`Module ${mIdx + 1}: ${mod.title || "Module Title"}`}
                                        </td>
                                    </tr>

                                    {(
                                        Array.isArray(mod.topics) && mod.topics.length
                                            ? mod.topics.map((topic, tIdx) => {
                                                const meta = getTopicMeta(outline, topic.id);
                                                return (
                                                    <tr key={topic.id || `${mIdx}-${tIdx}`}>
                                                        <td className="col-um">{`${mIdx + 1}.${tIdx + 1}`}</td>
                                                        <td className="col-um" style={{ textAlign: "left" }}>
                                                            {topic.title || "Topic Title"}
                                                        </td>
                                                        <td className="col-um" style={{ textAlign: "left" }}>
                                                            <input
                                                                type="text"
                                                                autoComplete="off"
                                                                value={meta.duration || ""}
                                                                onChange={(e) => updateTopicMeta(topic.id, "duration", e.target.value)}
                                                                className="course-outline-input"
                                                                placeholder="Insert Duration"
                                                            />
                                                        </td>
                                                        <td className="col-um">
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="text"
                                                                    autoComplete="off"
                                                                    value={meta.description || ""}
                                                                    onChange={(e) => updateTopicMeta(topic.id, "description", e.target.value)}
                                                                    className="course-outline-input"
                                                                    placeholder="Insert Topic Description"
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faMagicWandSparkles}
                                                                    className="input-with-icon__icon"
                                                                    title="AI Rewrite"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                            // legacy fallback: slides shown as topics
                                            : (mod.slides || []).map((slide, sIdx) => {
                                                const meta = getTopicMeta(outline, slide.id);
                                                return (
                                                    <tr key={slide.id || `${mIdx}-legacy-${sIdx}`}>
                                                        <td className="col-um">{`${mIdx + 1}.${sIdx + 1}`}</td>
                                                        <td className="col-um" style={{ textAlign: "left" }}>
                                                            {slide.title || "Topic Title"}
                                                        </td>
                                                        <td className="col-um" style={{ textAlign: "left" }}>
                                                            <input
                                                                type="text"
                                                                autoComplete="off"
                                                                value={meta.duration || ""}
                                                                onChange={(e) => updateTopicMeta(slide.id, "duration", e.target.value)}
                                                                className="course-outline-input"
                                                                placeholder="Insert Duration"
                                                            />
                                                        </td>
                                                        <td className="col-um">
                                                            <div className="input-with-icon">
                                                                <input
                                                                    type="text"
                                                                    autoComplete="off"
                                                                    value={meta.description || ""}
                                                                    onChange={(e) => updateTopicMeta(slide.id, "description", e.target.value)}
                                                                    className="course-outline-input"
                                                                    placeholder="Insert Topic Description"
                                                                />
                                                                <FontAwesomeIcon
                                                                    icon={faMagicWandSparkles}
                                                                    className="input-with-icon__icon"
                                                                    title="AI Rewrite"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default InductionOutline;
