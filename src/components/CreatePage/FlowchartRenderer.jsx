import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import axios from "axios";
import { toast } from "react-toastify";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEye, faTimes, faChevronLeft, faChevronRight, faMagnifyingGlassPlus, faMagnifyingGlassMinus, faAlignCenter, faExpand } from "@fortawesome/free-solid-svg-icons";
import Modal from "react-modal";

cytoscape.use(dagre);

const FlowchartRenderer = forwardRef(({ procedureRows, documentType, title }, ref) => {
    const cyRef = useRef(null);
    const [cy, setCy] = useState(null);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const maxNodesPerPage = 14 // Adjust based on your needs
    const [flowchartReady, setFlowchartReady] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewCy, setPreviewCy] = useState(null);
    const [modalSize, setModalSize] = useState({ width: '70%', height: '70%' });

    const normalizeProcedureRowsForFlowchart = (rows = []) => {
        if (!Array.isArray(rows) || rows.length === 0) return [];

        const isBlankPrev = (value) => {
            const v = (value ?? "").toString().trim();
            return v === "" || v === "-";
        };

        const allPrevStepsBlank = rows.every(row => isBlankPrev(row.prevStep));

        return rows.map((row, index) => ({
            ...row,
            mainStep: `${index + 1}. ${(row.mainStep ?? "").trim()}`,
            prevStep: allPrevStepsBlank
                ? (index === 0 ? "-" : String(index))
                : ((row.prevStep ?? "").toString().trim() || "-")
        }));
    };

    useImperativeHandle(ref, () => ({
        downloadImages: async () => {
            if (!procedureRows || procedureRows.length < 2) return;

            // 1. Generate Fresh Data
            const { cyInstance: freshCy, paginatedFlowchart: freshPages } = await prepareFlowchartData() || {};

            if (freshCy && freshPages && freshPages.length > 0) {
                const toastId = toast.info("Downloading flowchart images...", { autoClose: false });

                for (let i = 0; i < freshPages.length; i++) {
                    toast.update(toastId, { render: `Downloading image ${i + 1} of ${freshPages.length}...` });

                    // Render page on hidden canvas
                    renderPage(i, freshCy, freshPages);

                    // Wait for layout to settle
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Style for export
                    freshCy.zoomingEnabled(false);
                    freshCy.style().selector("core").css({ "background-color": "#fff" }).update();

                    // Generate PNG Base64
                    const pngData = freshCy.png({
                        full: true,
                        bg: "#ffffff",
                        scale: 2,
                        maxWidth: 1200,
                        maxHeight: 960,
                        padding: 180,
                    });

                    // Convert Base64 to Blob
                    const byteCharacters = atob(pngData.split(',')[1]);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let j = 0; j < byteCharacters.length; j++) {
                        byteNumbers[j] = byteCharacters.charCodeAt(j);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: "image/png" });

                    // Save Individually
                    saveAs(blob, `${capitalizeWords(title)}_${documentType}_Page_${i + 1}.png`);

                    // Small delay to ensure browser doesn't block multiple downloads
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        },
        getImages: async () => {
            return await performCapture();
        }
    }));

    const performCapture = async () => {
        if (!procedureRows || procedureRows.length < 2) return [];

        // 1. Generate Fresh Data
        const { cyInstance: freshCy, paginatedFlowchart: freshPages, container: tempDiv } = await prepareFlowchartData(true) || {};
        const capturedImages = [];

        if (freshCy && freshPages && freshPages.length > 0) {
            try {
                for (let i = 0; i < freshPages.length; i++) {
                    // Render page on hidden canvas
                    renderPage(i, freshCy, freshPages);

                    // Wait for layout
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Style for export
                    freshCy.zoomingEnabled(false);
                    freshCy.style().selector("core").css({ "background-color": "#fff" }).update();

                    // Generate PNG Base64
                    const pngData = freshCy.png({
                        full: true,
                        bg: "#ffffff",
                        scale: 2,
                        maxWidth: 1200,
                        maxHeight: 960,
                        padding: 180,
                    });

                    // Add to array
                    capturedImages.push(pngData);
                }
            } catch (err) {
                console.error("Error capturing flowchart images:", err);
            } finally {
                // Cleanup
                if (tempDiv && document.body.contains(tempDiv)) {
                    document.body.removeChild(tempDiv);
                }
            }
        }
        return capturedImages; // Returns array of "data:image/png;base64..." strings
    };

    const dataURItoBlob = (dataURI) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    };

    const openModal = async () => {
        await prepareFlowchartData();
        setIsModalOpen(true);
        setTimeout(() => {
            if (previewCy) {
                previewCy.destroy(); // clean previous instance
            }
            if (pages.length > 0) {
                const newCy = cytoscape({
                    container: document.getElementById("preview-cy"),
                    elements: pages[currentPage].elements,
                    style: [
                        // Styling for the Document Title Node
                        {
                            selector: "[id='DocumentNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#002060", // Dark blue
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#002850",
                                "font-weight": "bold",
                                "font-size": "18px",
                                "width": "300px",
                                "height": "60px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                            }
                        },
                        // Styling for Regular Nodes (Steps)
                        {
                            selector: "node",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9", // Gray background
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#8a8a8a",
                                "font-size": "14px",
                                "width": "300px",
                                "height": "50px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                                "text-max-width": "270px",
                                "padding": "5px"
                            }
                        },
                        {
                            selector: "[id='CompletedNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#0015000", // Green color
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#8a8a8a", // Dark green border
                                "font-weight": "bold",
                                "font-size": "16px",
                                "width": "300px",
                                "height": "60px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                            }
                        },
                        // Styling for Continuation Nodes (Circles with Labels)
                        {
                            selector: "[id^='continuation-']",
                            style: {
                                "shape": "ellipse",
                                "content": "data(continuationLabel)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9",
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#7F7F7F",
                                "font-size": "16px",
                                "font-weight": "bold",
                                "width": "40px",
                                "height": "40px",
                            }
                        },
                        // Keep existing circular node styling
                        {
                            selector: "[shape='circle']",
                            style: {
                                "shape": "ellipse",
                                "content": "data(continuationLabel)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9",
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#7F7F7F",
                                "font-size": "16px",
                                "font-weight": "bold",
                                "width": "40px",
                                "height": "40px",
                            }
                        },
                        // Styling for Edges (Connections)
                        {
                            selector: "edge",
                            style: {
                                "width": 2,
                                "line-color": "#555",
                                "target-arrow-shape": "triangle",
                                "target-arrow-color": "#555",
                                "curve-style": "bezier",
                            }
                        }
                    ],
                    layout: { name: "dagre", rankDir: "TB", nodeSep: 50 },
                    styleEnabled: true,
                    userZoomingEnabled: true, // Allow user zooming for better interaction
                    userPanningEnabled: true, // Allow panning for better navigation
                    zoom: 1,
                    pan: { x: 100, y: 100 }
                });
                setPreviewCy(newCy);

                // Run the layout and then fit the graph properly with padding
                newCy.layout({ name: "dagre", rankDir: "TB", nodeSep: 50 }).run();

                // Add a slight delay to ensure layout completes before fitting
                setTimeout(() => {
                    newCy.fit(null, 40); // Increased padding for better visibility
                    newCy.center();
                }, 300);
            }
        }, 200); // delay ensures modal has rendered
    };

    const closeModal = () => {
        if (previewCy) {
            previewCy.destroy();
            setPreviewCy(null);
        }
        setIsModalOpen(false);
    };

    const capitalizeWords = (text) =>
        text
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    const createContinuationNode = (label) => ({
        data: {
            id: `continuation-${label}`,
            label: label,
            shape: 'circle',
            continuationLabel: label
        }
    });

    const splitFlowchartIntoPages = (elements) => {
        if (!elements || !Array.isArray(elements)) return [];

        // Separate nodes and edges from flat elements array
        const nodes = elements.filter(el => !el.data.source && !el.data.target && !el.data.id?.startsWith('continuation-'));
        const edges = elements.filter(el => el.data.source && el.data.target);

        // Initialize pages
        const result = [];
        let continuationCounter = 0;
        const continuationLabels = {};

        // Function to add a continuation label
        const getNextContinuationLabel = () => {
            const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            return labels[continuationCounter++ % labels.length];
        };

        // Track which nodes are already assigned to pages
        const assignedNodes = new Set();

        // Track each node's page assignment for edge creation
        const nodePageMap = {};

        // Assign nodes to pages based on flow
        let currentPageNodes = [];
        let pageIndex = 0;

        // Start with the first node (usually document node)
        let nodesToProcess = [nodes[0]];

        while (nodesToProcess.length > 0) {
            const node = nodesToProcess.shift();

            if (assignedNodes.has(node.data.id)) continue;

            // Add node to current page
            currentPageNodes.push(node);
            assignedNodes.add(node.data.id);
            nodePageMap[node.data.id] = pageIndex;

            // Find outgoing edges from this node
            const outgoingEdges = edges.filter(edge => edge.data.source === node.data.id);

            // Add target nodes to process queue if they haven't been assigned
            for (const edge of outgoingEdges) {
                const targetNode = nodes.find(n => n.data.id === edge.data.target);
                if (targetNode && !assignedNodes.has(targetNode.data.id)) {
                    nodesToProcess.push(targetNode);
                }
            }

            // Start new page if maximum nodes reached
            if (currentPageNodes.length >= maxNodesPerPage && nodesToProcess.length > 0) {
                result.push({
                    elements: [...currentPageNodes],
                    edges: [] // We'll add edges later
                });

                currentPageNodes = [];
                pageIndex++;
            }
        }

        // Add the last page if there are any remaining nodes
        if (currentPageNodes.length > 0) {
            result.push({
                elements: [...currentPageNodes],
                edges: []
            });
        }

        // Now process edges and create continuation nodes
        for (const edge of edges) {
            const sourcePage = nodePageMap[edge.data.source];
            const targetPage = nodePageMap[edge.data.target];

            if (sourcePage === undefined || targetPage === undefined) continue;

            // If source and target are on the same page, add edge directly
            if (sourcePage === targetPage) {
                result[sourcePage].edges.push(edge);
            }
            // If they're on different pages, create continuation nodes
            else {
                // Generate a unique key for this cross-page connection
                const edgeKey = `${edge.data.source}-${edge.data.target}`;

                // Create or reuse continuation label
                let continuationLabel;
                if (!continuationLabels[edgeKey]) {
                    continuationLabel = getNextContinuationLabel();
                    continuationLabels[edgeKey] = continuationLabel;
                } else {
                    continuationLabel = continuationLabels[edgeKey];
                }

                // Create continuation node for source page
                const sourcePageContinuationNode = createContinuationNode(continuationLabel);
                result[sourcePage].elements.push(sourcePageContinuationNode);

                // Add edge from source to continuation node
                result[sourcePage].edges.push({
                    data: {
                        id: `${edge.data.source}-to-${sourcePageContinuationNode.data.id}`,
                        source: edge.data.source,
                        target: sourcePageContinuationNode.data.id
                    }
                });

                // Create continuation node for target page
                const targetPageContinuationNode = createContinuationNode(continuationLabel);
                result[targetPage].elements.push(targetPageContinuationNode);

                // Add edge from continuation node to target
                result[targetPage].edges.push({
                    data: {
                        id: `${targetPageContinuationNode.data.id}-to-${edge.data.target}`,
                        source: targetPageContinuationNode.data.id,
                        target: edge.data.target
                    }
                });
            }
        }

        // Merge elements and edges for each page
        return result.map(page => ({
            elements: [...page.elements, ...page.edges]
        }));
    };

    const prepareFlowchartData = async () => {
        return new Promise((resolve, reject) => {
            if (!procedureRows || procedureRows.length === 0) {
                return resolve({ cyInstance: null, paginatedFlowchart: [] });
            }

            const numberedProcedureRows = normalizeProcedureRowsForFlowchart(procedureRows);

            axios.post(`${process.env.REACT_APP_URL}/api/flowIMG/generate`, {
                procedureRows: numberedProcedureRows,
                title: title,
                documentType: documentType
            })
                .then(response => {
                    const { elements } = response.data;

                    // Split the flowchart into pages
                    const paginatedFlowchart = splitFlowchartIntoPages(elements);
                    setPages(paginatedFlowchart);
                    setCurrentPage(0);

                    // Create a hidden div for rendering the graph
                    const hiddenDiv = document.createElement("div");
                    hiddenDiv.style.width = "1400px";
                    hiddenDiv.style.height = "1000px";
                    hiddenDiv.style.position = "absolute";
                    hiddenDiv.style.left = "-9999px"; // Hide off-screen
                    hiddenDiv.style.backgroundColor = "#fff";
                    document.body.appendChild(hiddenDiv);

                    const cyInstance = cytoscape({
                        container: hiddenDiv,
                        elements: paginatedFlowchart.length > 0 ? paginatedFlowchart[0].elements : [],
                        style: [
                            {
                                selector: "[id='DocumentNode']",
                                style: {
                                    "shape": "rectangle",
                                    "content": "data(label)",
                                    "text-valign": "center",
                                    "text-halign": "center",
                                    "background-color": "#002060",
                                    "color": "#fff",
                                    "border-width": 2,
                                    "border-color": "#002850",
                                    "font-weight": "bold",
                                    "font-size": "18px",
                                    "width": "300px",
                                    "height": "60px",
                                    "font-family": "Arial, sans-serif",
                                    "text-wrap": "wrap",
                                }
                            },
                            {
                                selector: "node",
                                style: {
                                    "shape": "rectangle",
                                    "content": "data(label)",
                                    "text-valign": "center",
                                    "text-halign": "center",
                                    "background-color": "#D9D9D9",
                                    "color": "#000",
                                    "border-width": 2,
                                    "border-color": "#8a8a8a",
                                    "font-size": "14px",
                                    "width": "300px",
                                    "height": "50px",
                                    "font-family": "Arial, sans-serif",
                                    "text-wrap": "wrap",
                                    "text-max-width": "270px",
                                    "padding": "5px"
                                }
                            },
                            {
                                selector: "[id='CompletedNode']",
                                style: {
                                    "shape": "rectangle",
                                    "content": "data(label)",
                                    "text-valign": "center",
                                    "text-halign": "center",
                                    "background-color": "#0015000",
                                    "color": "#fff",
                                    "border-width": 2,
                                    "border-color": "#8a8a8a",
                                    "font-weight": "bold",
                                    "font-size": "16px",
                                    "width": "300px",
                                    "height": "60px",
                                    "font-family": "Arial, sans-serif",
                                    "text-wrap": "wrap",
                                }
                            },
                            {
                                selector: "[id^='continuation-']",
                                style: {
                                    "shape": "ellipse",
                                    "content": "data(continuationLabel)",
                                    "text-valign": "center",
                                    "text-halign": "center",
                                    "background-color": "#D9D9D9",
                                    "color": "#000",
                                    "border-width": 2,
                                    "border-color": "#7F7F7F",
                                    "font-size": "16px",
                                    "font-weight": "bold",
                                    "width": "40px",
                                    "height": "40px",
                                }
                            },
                            {
                                selector: "[shape='circle']",
                                style: {
                                    "shape": "ellipse",
                                    "content": "data(continuationLabel)",
                                    "text-valign": "center",
                                    "text-halign": "center",
                                    "background-color": "#D9D9D9",
                                    "color": "#000",
                                    "border-width": 2,
                                    "border-color": "#7F7F7F",
                                    "font-size": "16px",
                                    "font-weight": "bold",
                                    "width": "40px",
                                    "height": "40px",
                                }
                            },
                            {
                                selector: "edge",
                                style: {
                                    "width": 2,
                                    "line-color": "#555",
                                    "target-arrow-shape": "triangle",
                                    "target-arrow-color": "#555",
                                    "curve-style": "bezier",
                                }
                            }
                        ],
                        layout: { name: "dagre", rankDir: "TB", nodeSep: 50 },
                        styleEnabled: true,
                        zoom: 1,
                        pan: { x: 180, y: 180 },
                    });

                    setCy(cyInstance);

                    cyInstance.ready(() => {
                        const documentNode = cyInstance.$("[id='DocumentNode']");
                        const completedNode = cyInstance.$("[id = 'CompletedNode']");

                        if (documentNode.length > 0) {
                            documentNode.style({
                                "background-color": "#002060",
                                "color": "#fff",
                                "font-weight": "bold",
                                "border-color": "#002850",
                                "text-valign": "center",
                                "text-halign": "center",
                                "font-size": "16px",
                                "text-max-width": "300px",
                            });
                        }

                        if (completedNode.length > 0) {
                            completedNode.style({
                                "background-color": "#7F7F7F",
                                "color": "#fff",
                                "font-weight": "bold",
                                "text-valign": "center",
                                "text-halign": "center",
                                "font-size": "16px",
                                "text-max-width": "300px",
                                "border-color": "#8a8a8a",
                            });
                        }

                        // Apply edge styling for continuation nodes
                        cyInstance.edges().forEach(edge => {
                            const sourceId = edge.source().id();
                            const targetId = edge.target().id();

                            if (sourceId.startsWith('continuation-') || targetId.startsWith('continuation-')) {
                                edge.style({
                                    "curve-style": "taxi",
                                    "taxi-direction": "downward",
                                    "line-color": "#000",
                                    "width": 2,
                                    "target-arrow-shape": sourceId.startsWith('continuation-') ? "triangle" : "none",
                                    "target-arrow-color": "#000",
                                });
                            }
                        });

                        // Resolve with the NEW data
                        resolve({ cyInstance, paginatedFlowchart });
                    });
                })
                .catch(error => {
                    console.error("Error fetching flowchart data:", error);
                    resolve({ cyInstance: null, paginatedFlowchart: [] });
                });
        });
    };

    const fetchFlowData = async () => {
        if (!procedureRows || procedureRows.length === 0) return { elements: [] };
        const numberedProcedureRows = normalizeProcedureRowsForFlowchart(procedureRows);
        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/flowIMG/generate`, {
                procedureRows: numberedProcedureRows,
                title: title,
                documentType: documentType
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching flowchart data:", error);
            return { elements: [] };
        }
    };

    useEffect(() => {
        if (isModalOpen && pages.length > 0) {
            setTimeout(() => {
                if (previewCy) {
                    previewCy.destroy();
                }

                const container = document.getElementById("preview-cy");
                if (!container) return;

                const newCy = cytoscape({
                    container,
                    elements: pages[currentPage].elements,
                    style: [
                        // Styling for the Document Title Node
                        // Styling for Regular Nodes (Steps)
                        {
                            selector: "node",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9", // Gray background
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#8a8a8a",
                                "font-size": "14px",
                                "width": "300px",
                                "height": "label",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                                "text-max-width": "270px",
                                "padding": "12px"
                            }
                        },
                        {
                            selector: "[id='DocumentNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#002060", // Dark blue
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#002850",
                                "font-weight": "bold",
                                "font-size": "18px",
                                "width": "300px",
                                "height": "label",
                                "padding": "12px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                            }
                        },
                        {
                            selector: "[id='CompletedNode']",
                            style: {
                                "shape": "rectangle",
                                "content": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#7EAC89", // Green color
                                "color": "#fff", // White text
                                "border-width": 2,
                                "border-color": "#7EAC89", // Dark green border
                                "font-weight": "bold",
                                "font-size": "16px",
                                "width": "300px",
                                "height": "label",
                                "padding": "12px",
                                "font-family": "Arial, sans-serif",
                                "text-wrap": "wrap",
                            }
                        },
                        // Styling for Continuation Nodes (Circles with Labels)
                        {
                            selector: "[id^='continuation-']",
                            style: {
                                "shape": "ellipse",
                                "content": "data(continuationLabel)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9",
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#7F7F7F",
                                "font-size": "16px",
                                "font-weight": "bold",
                                "width": "40px",
                                "height": "40px",
                            }
                        },
                        // Keep existing circular node styling
                        {
                            selector: "[shape='circle']",
                            style: {
                                "shape": "ellipse",
                                "content": "data(continuationLabel)",
                                "text-valign": "center",
                                "text-halign": "center",
                                "background-color": "#D9D9D9",
                                "color": "#000",
                                "border-width": 2,
                                "border-color": "#7F7F7F",
                                "font-size": "16px",
                                "font-weight": "bold",
                                "width": "40px",
                                "height": "40px",
                            }
                        },
                        // Styling for Edges (Connections)
                        {
                            selector: "edge",
                            style: {
                                "width": 2,
                                "line-color": "#555",
                                "target-arrow-shape": "triangle",
                                "target-arrow-color": "#555",
                                "curve-style": "bezier",
                            }
                        }
                    ],
                    layout: { name: "dagre", rankDir: "TB", nodeSep: 50 },
                    styleEnabled: true,
                    userZoomingEnabled: false, // Enable zooming for better interaction
                    userPanningEnabled: false, // Enable panning for better interaction
                });

                // Apply the layout and then fit the graph
                newCy.layout({ name: "dagre", rankDir: "TB", nodeSep: 50 }).run();

                // Calculate appropriate dimensions based on the graph's size
                const boundingBox = newCy.elements().boundingBox();
                const graphWidth = Math.max(boundingBox.w + 100, 500); // Add padding and minimum width
                const graphHeight = Math.max(boundingBox.h + 100, 500); // Add padding and minimum height

                // Set container dimensions to ensure all content is visible
                container.style.width = "100%";
                container.style.height = `${graphHeight}px`;

                // Wait for layout to complete, then fit the graph properly
                setTimeout(() => {
                    newCy.fit(null, 50); // Increased padding for better visibility
                    newCy.center();
                }, 300);

                setPreviewCy(newCy);
            }, 200);
        }
    }, [currentPage, isModalOpen]);

    const renderPage = (pageIndex, targetCy = cy, targetPages = pages) => {
        if (!targetCy || !targetPages || targetPages.length === 0 || pageIndex < 0 || pageIndex >= targetPages.length) {
            return;
        }

        // Update cytoscape with the elements for the selected page
        targetCy.elements().remove();
        targetCy.add(targetPages[pageIndex].elements);

        // Apply layout and styling
        targetCy.layout({ name: 'dagre', rankDir: 'TB', nodeSep: 50 }).run();

        // Apply specific node styling
        targetCy.$("[id='DocumentNode']").style({
            "background-color": "#002060",
            "color": "#fff",
            "font-weight": "bold",
            "border-color": "#002850",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "16px",
            "text-max-width": "300px",
        });

        targetCy.$("[id='CompletedNode']").style({
            "background-color": "#7F7F7F",
            "color": "#fff",
            "font-weight": "bold",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "16px",
            "text-max-width": "300px",
            "border-color": "#8a8a8a",
        });

        // Apply edge styling for continuation nodes
        targetCy.edges().forEach(edge => {
            const sourceId = edge.source().id();
            const targetId = edge.target().id();

            if (sourceId.startsWith('continuation-') || targetId.startsWith('continuation-')) {
                edge.style({
                    "curve-style": "taxi",
                    "taxi-direction": "downward",
                    "line-color": "#000",
                    "width": 2,
                    "target-arrow-shape": sourceId.startsWith('continuation-') ? "triangle" : "none",
                    "target-arrow-color": "#000",
                });
            }
        });

        targetCy.edges().forEach(edge => {
            if (edge.source().data('shape') === 'circle') {
                const targetPos = edge.target().position();
                const sourcePos = edge.source().position();

                const dx = targetPos.x - sourcePos.x;
                // const dy = targetPos.y - sourcePos.y; // unused

                // Determine bend direction based on target position
                // const bendDistance = dx > 0 ? 60 : -60; // unused

                edge.style({
                    "curve-style": "taxi",
                    "taxi-direction": "downward", // Adjust based on flow
                    "line-color": "#000",
                    "width": 2,
                    "target-arrow-shape": "triangle",
                    "target-arrow-color": "#000",
                });
            }
        });

        targetCy.edges().forEach(edge => {
            if (edge.target().data('shape') === 'circle') {
                const targetPos = edge.target().position();
                const sourcePos = edge.source().position();

                const dx = targetPos.x - sourcePos.x;
                // const dy = targetPos.y - sourcePos.y; // unused

                // Determine bend direction based on target position
                // const bendDistance = dx > 0 ? 60 : -60; // unused

                edge.style({
                    "curve-style": "taxi",
                    "taxi-direction": "downward", // Adjust based on flow
                    "line-color": "#000",
                    "width": 2,
                    "target-arrow-shape": "none",
                    "target-arrow-color": "#000",
                });
            }
        });

        if (targetCy === cy) {
            setCurrentPage(pageIndex);
        }
    };

    const exportImage = async () => {
        if (procedureRows.length < 2) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("There should be at least two procedure steps or more.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        if (procedureRows.some(row => !row.mainStep.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All procedure main steps must have a value.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        // 1. Get the FRESH data immediately
        const { cyInstance: freshCy, paginatedFlowchart: freshPages } = await prepareFlowchartData() || {};

        if (freshCy && freshPages && freshPages.length > 0) {
            // If only one page, download directly
            if (freshPages.length === 1) {
                // Pass fresh data to renderPage
                renderPage(0, freshCy, freshPages);

                setTimeout(() => {
                    freshCy.zoomingEnabled(false);
                    freshCy.style().selector("core").css({ "background-color": "#fff" }).update();

                    const pngData = freshCy.png({
                        full: true,
                        bg: "#ffffff",
                        scale: 2,
                        maxWidth: 1200,
                        maxHeight: 960,
                        padding: 180,
                    });

                    const documentName = capitalizeWords(title) + " " + documentType + " Flowchart";
                    const a = document.createElement("a");
                    a.href = pngData;
                    a.download = `${documentName}.png`;
                    a.click();
                }, 500);
                return;
            }

            // For multiple pages, create a zip file
            const exportAllPages = async () => {
                const zip = new JSZip();
                const imgFolder = zip.folder("flowchart-images");

                // Show loading toast
                const toastId = toast.info("Preparing flowchart download...", {
                    closeButton: true,
                    autoClose: 1500,
                    style: { textAlign: 'center' }
                });

                for (let i = 0; i < freshPages.length; i++) {
                    // Update toast
                    toast.update(toastId, {
                        render: `Generating page ${i + 1} of ${freshPages.length}...`,
                        closeButton: true,
                        autoClose: 1500
                    });

                    // Pass fresh data to renderPage
                    renderPage(i, freshCy, freshPages);

                    // Wait for layout to complete
                    await new Promise(resolve => setTimeout(resolve, 500));

                    freshCy.zoomingEnabled(false);
                    freshCy.style().selector("core").css({ "background-color": "#fff" }).update();

                    const pngData = freshCy.png({
                        full: true,
                        bg: "#ffffff",
                        scale: 2,
                        maxWidth: 1200,
                        maxHeight: 960,
                        padding: 180,
                    });

                    // Convert base64 to blob
                    const base64Data = pngData.replace(/^data:image\/png;base64,/, "");
                    const fileName = `${capitalizeWords(title)}_${documentType}_Flowchart_Page_${i + 1}.png`;

                    // Add to zip
                    imgFolder.file(fileName, base64Data, { base64: true });
                }

                // Generate the zip file
                toast.update(toastId, {
                    render: "Creating zip file...",
                    closeButton: true,
                    autoClose: 1500
                });

                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `${capitalizeWords(title)}_${documentType}_Flowchart.zip`);

                // Close toast and show success
                toast.dismiss(toastId);
                toast.success("Flowchart downloaded successfully!", {
                    autoClose: 1500,
                    style: { textAlign: 'center' }
                });
            };

            exportAllPages();
        }
    };

    return (
        <div className="flowchart-container">
            <div className="flowchart-buttons">
                <button onClick={openModal} className="top-right-button-ibra3" title="Preview Flowchart">
                    <FontAwesomeIcon icon={faEye} className="icon-um-search" />
                </button>
                <button onClick={exportImage} className="top-right-button-ibra2" title="Download Flowchart">
                    <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Flowchart Preview"
                style={{
                    overlay: {
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    content: {
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: modalSize.width,
                        height: modalSize.height,
                        padding: '10px',
                        overflow: 'hidden', // Important: Don't let the modal itself scroll
                    }
                }}
                ariaHideApp={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="modal-flowchart-header">
                        {pages.length > 1 && (
                            <div className="modal-flowchart-nav">
                                <button
                                    className="flowchart-btn-prev"
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                    title="Previous Page"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <div className="flowchart-page-indicator">
                                    Page {currentPage + 1} of {pages.length}
                                </div>
                                <button
                                    className="flowchart-btn-next"
                                    onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                                    disabled={currentPage === pages.length - 1}
                                    title="Next Page"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                        <button className="flowchart-btn-close" onClick={closeModal} title="Close Preview">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Outer container with scroll capability */}
                    <div id="preview-cy-container" style={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',// Enable both vertical and horizontal scrolling
                        backgroundColor: '#f5f5f5', // Light background to distinguish scrollable area
                        padding: '10px'
                    }}>
                        {/* Inner fixed container for the graph */}
                        <div id="preview-cy" style={{
                            backgroundColor: "#fff",
                            minHeight: '500px', // Minimum height to ensure it's visible
                            border: '1px solid #ddd',
                            boxShadow: '0 0 5px rgba(0,0,0,0.1)'
                        }}></div>
                    </div>

                    <div className="zoom-controls" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        borderTop: '1px solid #ddd'
                    }}>
                        <button
                            style={{ padding: '5px 10px', borderRadius: '4px' }}
                            className="flowchart-btn-prev"
                            onClick={() => previewCy && previewCy.zoom(previewCy.zoom() * 1.2)} title="Zoom In">
                            <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                        </button>
                        <button
                            style={{ padding: '5px 10px', borderRadius: '4px' }}
                            className="flowchart-btn-prev"
                            onClick={() => previewCy && previewCy.zoom(previewCy.zoom() / 1.2)} title="Zoom Out">
                            <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                        </button>
                        <button
                            style={{ padding: '5px 10px', borderRadius: '4px' }}
                            className="flowchart-btn-prev"
                            onClick={() => previewCy && previewCy.center()} title="Center">
                            <FontAwesomeIcon icon={faAlignCenter} />
                        </button>
                        <button
                            style={{ padding: '5px 10px', borderRadius: '4px' }}
                            className="flowchart-btn-prev"
                            onClick={() => previewCy && previewCy.fit()} title="Fit">
                            <FontAwesomeIcon icon={faExpand} />
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
});

export default FlowchartRenderer;