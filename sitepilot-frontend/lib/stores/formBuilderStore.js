/**
 * FORM BUILDER STORE
 *
 * Form-specific builder store for creating forms with form elements only
 * Simplified structure: Container → Form Elements
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import { produce } from "immer";

// Form-only components
const FORM_COMPONENTS = [
  "Heading",
  "Text",
  "Input",
  "Textarea",
  "Select",
  "Button",
  "Label",
  "Checkbox",
  "Radio",
  "Divider",
];

const useFormBuilderStore = create((set, get) => ({
  // STATE
  formJSON: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  isDirty: false,

  // INITIALIZATION
  initializeFormBuilder: (formJSON) => {
    const defaultJSON = formJSON || {
      id: nanoid(),
      name: "New Form",
      elements: [],
      settings: {
        method: "POST",
        action: "",
        successMessage: "Thank you! Your form has been submitted.",
      },
      styles: {
        backgroundColor: "#ffffff",
        maxWidth: 800,
        padding: 32,
      },
    };
    set({
      formJSON: defaultJSON,
      selectedNodeId: null,
      hoveredNodeId: null,
      isDirty: false,
    });
  },

  // SELECTION
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  clearSelection: () => set({ selectedNodeId: null }),

  // FORM ELEMENT OPERATIONS
  addElement: (componentType, props = {}) => {
    if (!FORM_COMPONENTS.includes(componentType)) {
      console.warn(`${componentType} is not a form component`);
      return;
    }

    set(
      produce((state) => {
        state.formJSON.elements.push({
          id: nanoid(),
          type: componentType,
          props,
          styles: {},
        });
        state.isDirty = true;
      })
    );
  },

  deleteElement: (elementId) => {
    set(
      produce((state) => {
        state.formJSON.elements = state.formJSON.elements.filter(
          (el) => el.id !== elementId
        );
        if (state.selectedNodeId === elementId) state.selectedNodeId = null;
        state.isDirty = true;
      })
    );
  },

  updateElementProps: (elementId, props) => {
    set(
      produce((state) => {
        const element = state.formJSON.elements.find((el) => el.id === elementId);
        if (element) {
          element.props = { ...element.props, ...props };
          state.isDirty = true;
        }
      })
    );
  },

  updateElementStyles: (elementId, styles) => {
    set(
      produce((state) => {
        const element = state.formJSON.elements.find((el) => el.id === elementId);
        if (element) {
          element.styles = { ...element.styles, ...styles };
          state.isDirty = true;
        }
      })
    );
  },

  duplicateElement: (elementId) => {
    set(
      produce((state) => {
        const idx = state.formJSON.elements.findIndex((el) => el.id === elementId);
        if (idx !== -1) {
          const dup = {
            ...JSON.parse(JSON.stringify(state.formJSON.elements[idx])),
            id: nanoid(),
          };
          state.formJSON.elements.splice(idx + 1, 0, dup);
          state.isDirty = true;
        }
      })
    );
  },

  reorderElements: (startIndex, endIndex) => {
    set(
      produce((state) => {
        const [removed] = state.formJSON.elements.splice(startIndex, 1);
        state.formJSON.elements.splice(endIndex, 0, removed);
        state.isDirty = true;
      })
    );
  },

  // FORM SETTINGS
  updateFormSettings: (settings) => {
    set(
      produce((state) => {
        state.formJSON.settings = { ...state.formJSON.settings, ...settings };
        state.isDirty = true;
      })
    );
  },

  updateFormStyles: (styles) => {
    set(
      produce((state) => {
        state.formJSON.styles = { ...state.formJSON.styles, ...styles };
        state.isDirty = true;
      })
    );
  },

  // HELPERS
  getSelectedNode: () => {
    const { formJSON, selectedNodeId } = get();
    if (!selectedNodeId || !formJSON) return null;
    return formJSON.elements.find((el) => el.id === selectedNodeId);
  },

  getFormJSON: () => get().formJSON,

  updateFormJSON: (formJSON) => {
    set({ formJSON, isDirty: true });
  },

  resetDirty: () => set({ isDirty: false }),

  // Get all form components
  getFormComponents: () => FORM_COMPONENTS,
}));

export default useFormBuilderStore;
