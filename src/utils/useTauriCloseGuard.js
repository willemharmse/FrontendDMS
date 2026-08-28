// utils/useTauriCloseGuard.js
import { useEffect, useRef } from "react";

const isTauri = () =>
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// shouldPrompt          -> should the save-confirmation popup be shown before closing?
// onCloseRequested      -> called with confirmClose when shouldPrompt() is true
// options.shouldCleanup -> is there still cleanup (e.g. releasing a lock) needed even
//                          when no popup is shown? (e.g. draft loaded but not dirty)
// options.onSilentClose -> called with confirmClose when shouldCleanup() is true but
//                          shouldPrompt() is false — do the cleanup, no popup, then close.
export function useTauriCloseGuard(shouldPrompt, onCloseRequested, options = {}) {
    const { shouldCleanup, onSilentClose } = options;

    const shouldPromptRef = useRef(shouldPrompt);
    const onCloseRequestedRef = useRef(onCloseRequested);
    const shouldCleanupRef = useRef(shouldCleanup);
    const onSilentCloseRef = useRef(onSilentClose);

    shouldPromptRef.current = shouldPrompt;
    onCloseRequestedRef.current = onCloseRequested;
    shouldCleanupRef.current = shouldCleanup;
    onSilentCloseRef.current = onSilentClose;

    useEffect(() => {
        if (!isTauri()) return undefined;

        let unlisten;
        let disposed = false;

        const setup = async () => {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            const listener = await appWindow.onCloseRequested((event) => {
                const needsPrompt = shouldPromptRef.current();
                const needsSilentCleanup =
                    !needsPrompt && Boolean(shouldCleanupRef.current?.());

                if (!needsPrompt && !needsSilentCleanup) {
                    // Nothing to save and nothing to clean up. Do not prevent
                    // the event. Tauri closes normally.
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

                if (needsPrompt) {
                    onCloseRequestedRef.current(confirmClose);
                } else {
                    onSilentCloseRef.current?.(confirmClose);
                }
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