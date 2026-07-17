import { useSyncExternalStore } from "react";

// A SelectFieldsPopup is mounted separately inside every InfoBox section
// (Task Description, Responsibility, Resources, Safety, Close Out...).
// Each of those used to keep its own local copy of the standard/suggested
// template fields, which meant a field suggested from one section's popup
// was invisible to every other section's popup.
//
// This store lives at module scope (outside any one component instance),
// so all of them read and write the exact same list: the standard-fields
// fetch happens once for the whole page, and a "*"-suggested field shows
// up as an option everywhere immediately, not just in the popup it was
// suggested from.

let state = {
    fields: [],
    loading: false,
    error: null,
    hasFetched: false,
};

const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener());

export const templateFieldsStore = {
    getState: () => state,

    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    // Accepts either a plain array or an updater function, same calling
    // convention as React's setState - so it can be passed straight in as
    // the setFieldData prop SuggestFTSField already expects.
    setFields: (updater) => {
        const nextFields = typeof updater === "function" ? updater(state.fields) : updater;
        state = { ...state, fields: nextFields };
        notify();
    },

    setLoading: (loading) => {
        state = { ...state, loading };
        notify();
    },

    setError: (error) => {
        state = { ...state, error };
        notify();
    },

    // Returns true the first time it's called across the whole page (so
    // the caller should go ahead and fetch); returns false every time
    // after that (so callers know to skip fetching again).
    markFetchStarted: () => {
        if (state.hasFetched) return false;
        state = { ...state, hasFetched: true };
        return true;
    },
};

export function useTemplateFieldsStore() {
    return useSyncExternalStore(templateFieldsStore.subscribe, templateFieldsStore.getState);
}