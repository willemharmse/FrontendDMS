// InductionOutline.jsx
import { faDownload, faMagicWandSparkles, faSpinner, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useEffect, useState } from "react";

const parseDurationToMinutes = (raw) => {
    if (raw == null) return 0;
    const s = String(raw).trim();
    if (!s) return 0;

    if (/^\d+:\d{1,2}$/.test(s)) {
        const [h, m] = s.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
    }
    const h = s.match(/^(\d+(\.\d+)?)\s*h/i);
    if (h) return Math.round(parseFloat(h[1]) * 60);

    const m = s.match(/^(\d+(\.\d+)?)\s*m(in)?/i);
    if (m) return Math.round(parseFloat(m[1]));

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
    (outline?.slideMeta && outline.slideMeta[topicId]) ||
    { duration: "", description: "" };

const buildOutlineTable = (modules, outline) => {
    const rows = [];

    rows.push({
        kind: "intro",
        nr: "0",
        topic: "Introduction",
        duration: outline?.introDuration || "",
        description: outline?.introDescription || "",
    });

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

const INTRO_KEY = "__INTRO_DESC__";
const REWRITE_ENDPOINT = `${process.env.REACT_APP_URL}/api/openai/chatInduction/description`;
const isBlank = (v) => !String(v ?? "").trim();

const InductionOutline = ({ formData, setFormData, readOnly = false }) => {
    const modules = formData?.courseModules || [];
    const outline = formData?.courseOutline || {};

    // Per-item rewrite history + loading flags
    const [descHistory, setDescHistory] = useState({});           // { [idKey]: [prev1, prev2, ...] }
    const [loadingMap, setLoadingMap] = useState({});             // { [idKey]: boolean }
    const hasHistory = (idKey) => (descHistory[idKey]?.length || 0) > 0;

    const pushHistory = (idKey, value) =>
        setDescHistory(prev => ({ ...prev, [idKey]: [...(prev[idKey] || []), value] }));

    const undoHistory = (idKey, apply) =>
        setDescHistory(prev => {
            const stack = prev[idKey] || [];
            if (!stack.length) return prev;
            const last = stack[stack.length - 1];
            apply(last);
            return { ...prev, [idKey]: stack.slice(0, -1) };
        });

    const setLoading = (idKey, val) =>
        setLoadingMap(prev => ({ ...prev, [idKey]: !!val }));

    const aiRewrite = async ({ idKey, prompt, apply }) => {
        if (prompt === "") return;
        try {
            pushHistory(idKey, prompt);          // save current value before rewrite
            setLoading(idKey, true);

            const response = await fetch(REWRITE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ prompt }), // prompt is always the current value
            });

            const { response: newText } = await response.json();
            apply(newText || "");
        } catch (err) {
            console.error("AI rewrite error:", err);
        } finally {
            setLoading(idKey, false);
        }
    };

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
                for (const slide of mod.slides || []) {
                    const meta = getTopicMeta(outline, slide.id);
                    sum += parseDurationToMinutes(meta?.duration);
                }
            }
        }
        return sum;
    }, [outline?.introDuration, outline?.topicMeta, outline?.slideMeta, modules]);

    const totalPretty = useMemo(() => formatMinutes(totalMinutes), [totalMinutes]);

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
    }, [modules, outline?.introDuration, outline?.introDescription, outline?.topicMeta, outline?.slideMeta, setFormData]);

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

    // Helpers bound to UI
    const rewriteIntroDescription = () => {
        const prompt = outline?.introDescription || "";
        if (prompt === "") return;
        aiRewrite({
            idKey: INTRO_KEY,
            prompt,
            apply: (text) => updateIntro("introDescription", text),
        });
    };

    const undoIntroDescription = () =>
        undoHistory(INTRO_KEY, (prevText) => updateIntro("introDescription", prevText));

    const rewriteTopicDescription = (topicId, currentText) =>
        aiRewrite({
            idKey: topicId,
            prompt: currentText || "",
            apply: (text) => updateTopicMeta(topicId, "description", text),
        });

    const undoTopicDescription = (topicId) =>
        undoHistory(topicId, (prevText) => updateTopicMeta(topicId, "description", prevText));

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Outline</h3>
                {false && (<button className="top-right-button-proc" title="Download">
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>)}

                <div className="course-outline-row-split">
                    <div className="course-outline-type-split-1">
                        <h3 className="font-fam-labels">Department</h3>
                        <input
                            value={outline.department || ""}
                            onChange={(e) => updateOutline({ department: e.target.value })}
                            type="text"
                            autoComplete="off"
                            className="course-outline-input"
                            readOnly={readOnly}
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
                            disabled
                            className="course-outline-input"
                            placeholder="Auto Calculated"
                            style={{ textAlign: "center", backgroundColor: "lightgray", fontWeight: "600" }}
                        />
                    </div>
                </div>

                <div className="course-outline-table-content table-borders">
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                            <tr>
                                <th className="col-num-course-outline-data">Nr</th>
                                <th className="col-topic-course-outline-data">Topic</th>
                                <th className="col-time-course-outline-data">Duration (Minutes)</th>
                                <th className="col-desc-course-outline-data">Description</th>
                            </tr>
                        </thead>

                        <tbody>
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
                                        className="course-outline-input-2"
                                        placeholder="Insert Duration"
                                        readOnly={readOnly}
                                    />
                                </td>
                                <td className="col-um">
                                    <div className="input-with-icon" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <textarea
                                            type="text"
                                            autoComplete="off"
                                            value={outline.introDescription || ""}
                                            onChange={(e) => updateIntro("introDescription", e.target.value)}
                                            className="course-outline-textarea"
                                            placeholder="Insert Topic Description"
                                            style={{ paddingRight: hasHistory(INTRO_KEY) ? "55px" : "" }}
                                            readOnly={readOnly}
                                        />
                                        {!readOnly && (
                                            <>
                                                {loadingMap[INTRO_KEY] ? (
                                                    <FontAwesomeIcon icon={faSpinner} className="input-with-icon__icon spin-animation" title="Rewriting..." style={{ marginTop: "-6px" }} />
                                                ) : (
                                                    <FontAwesomeIcon
                                                        icon={faMagicWandSparkles}
                                                        className="input-with-icon__icon"
                                                        title="AI Rewrite"
                                                        onClick={rewriteIntroDescription}
                                                        style={{ cursor: "pointer" }}

                                                    />
                                                )}
                                                {hasHistory(INTRO_KEY) && (
                                                    <FontAwesomeIcon
                                                        icon={faRotateLeft}
                                                        className="input-with-icon__icon"
                                                        title="Undo AI Rewrite"
                                                        onClick={undoIntroDescription}
                                                        style={{
                                                            cursor: (descHistory[INTRO_KEY]?.length ? "pointer" : "not-allowed"),
                                                            opacity: (descHistory[INTRO_KEY]?.length ? 1 : 0.3),
                                                            marginRight: "25px"
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>

                            {modules.map((mod, mIdx) => (
                                <React.Fragment key={mod.id || mIdx}>
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", fontWeight: 600, backgroundColor: "#d6d6d6ff" }}>
                                            {`Module ${mIdx + 1}: ${mod.title || "Module Title"}`}
                                        </td>
                                    </tr>

                                    {(
                                        Array.isArray(mod.topics) && mod.topics.length
                                            ? mod.topics.map((topic, tIdx) => {
                                                const meta = getTopicMeta(outline, topic.id);
                                                const idKey = topic.id;
                                                const histLen = descHistory[idKey]?.length || 0;
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
                                                                className="course-outline-input-2"
                                                                readOnly={readOnly}
                                                                placeholder="Insert Duration"
                                                            />
                                                        </td>
                                                        <td className="col-um">
                                                            <div className="input-with-icon" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <textarea
                                                                    type="text"
                                                                    autoComplete="off"
                                                                    value={meta.description || ""}
                                                                    onChange={(e) => updateTopicMeta(topic.id, "description", e.target.value)}
                                                                    className="course-outline-textarea"
                                                                    placeholder="Insert Topic Description"
                                                                    style={{ paddingRight: hasHistory(idKey) ? "55px" : "" }}
                                                                    readOnly={readOnly}
                                                                />
                                                                {!readOnly && (
                                                                    <>
                                                                        {loadingMap[idKey] ? (
                                                                            <FontAwesomeIcon icon={faSpinner} className="input-with-icon__icon spin-animation" title="Rewriting..." style={{ marginTop: "-6px" }} />
                                                                        ) : (
                                                                            <FontAwesomeIcon
                                                                                icon={faMagicWandSparkles}
                                                                                className="input-with-icon__icon"
                                                                                title="AI Rewrite"
                                                                                onClick={() => rewriteTopicDescription(topic.id, meta.description)}
                                                                                style={{ cursor: "pointer" }}
                                                                            />
                                                                        )}
                                                                        {hasHistory(idKey) && (
                                                                            <FontAwesomeIcon
                                                                                icon={faRotateLeft}
                                                                                className="input-with-icon__icon"
                                                                                title="Undo AI Rewrite"
                                                                                onClick={() => undoTopicDescription(topic.id)}
                                                                                style={{
                                                                                    cursor: (histLen ? "pointer" : "not-allowed"),
                                                                                    opacity: (histLen ? 1 : 0.3),
                                                                                    marginRight: "25px"
                                                                                }}
                                                                            />
                                                                        )}

                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                            : (mod.slides || []).map((slide, sIdx) => {
                                                const meta = getTopicMeta(outline, slide.id);
                                                const idKey = slide.id;
                                                const histLen = descHistory[idKey]?.length || 0;
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
                                                                readOnly={readOnly}
                                                            />
                                                        </td>
                                                        <td className="col-um">
                                                            <div className="input-with-icon" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <input
                                                                    type="text"
                                                                    autoComplete="off"
                                                                    value={meta.description || ""}
                                                                    onChange={(e) => updateTopicMeta(slide.id, "description", e.target.value)}
                                                                    className="course-outline-input"
                                                                    placeholder="Insert Topic Description"
                                                                    readOnly={readOnly}
                                                                />
                                                                {!readOnly && (
                                                                    <>
                                                                        {loadingMap[idKey] ? (
                                                                            <FontAwesomeIcon icon={faSpinner} className="input-with-icon__icon spin-animation" title="Rewriting..." />
                                                                        ) : (
                                                                            <FontAwesomeIcon
                                                                                icon={faMagicWandSparkles}
                                                                                className="input-with-icon__icon"
                                                                                title="AI Rewrite"
                                                                                onClick={() => rewriteTopicDescription(slide.id, meta.description)}
                                                                                style={{ cursor: "pointer" }}
                                                                            />
                                                                        )}
                                                                        <FontAwesomeIcon
                                                                            icon={faRotateLeft}
                                                                            className="input-with-icon__icon"
                                                                            title="Undo AI Rewrite"
                                                                            onClick={() => undoTopicDescription(slide.id)}
                                                                            style={{
                                                                                cursor: (histLen ? "pointer" : "not-allowed"),
                                                                                opacity: (histLen ? 1 : 0.3)
                                                                            }}
                                                                        />
                                                                    </>
                                                                )}
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
