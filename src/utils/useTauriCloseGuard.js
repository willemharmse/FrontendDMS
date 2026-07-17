// utils/useTauriCloseGuard.js
import { useEffect, useRef } from "react";

const isTauri = () =>
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function useTauriCloseGuard(shouldPrompt, onCloseRequested) {
    const shouldPromptRef = useRef(shouldPrompt);
    const onCloseRequestedRef = useRef(onCloseRequested);

    shouldPromptRef.current = shouldPrompt;
    onCloseRequestedRef.current = onCloseRequested;

    useEffect(() => {
        if (!isTauri()) return undefined;

        let unlisten;
        let disposed = false;

        const setup = async () => {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            const listener = await appWindow.onCloseRequested((event) => {
                if (!shouldPromptRef.current()) {
                    // Do not prevent the event. Tauri closes normally.
                    return;
                }

                event.preventDefault();

                const confirmClose = async () => {
                    try {
                        await appWindow.destroy();
                    } catch (error) {
                        console.error("Failed to destroy Tauri window:", error);
                    }
                };

                onCloseRequestedRef.current(confirmClose);
            });

            if (disposed) {
                listener();
            } else {
                unlisten = listener;
            }
        };

        setup().catch((error) => {
            console.error("Failed to register Tauri close guard:", error);
        });

        return () => {
            disposed = true;
            unlisten?.();
        };
    }, []);
}