/**
 * LEFT SIDEBAR - Field Types Palette
 */

'use client';

import { FIELD_TYPES, FIELD_TYPE_METADATA } from '@/lib/form-schema';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';

export default function FormFieldsSidebar() {
  const { addField } = useFormBuilderStore();

  const handleAddField = (fieldType) => {
    addField(fieldType);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Form Fields</h2>
        <p className="text-xs text-gray-500 mt-1">Click to add to form</p>
      </div>

      {/* Field Types List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.values(FIELD_TYPES).map((fieldType) => {
          const metadata = FIELD_TYPE_METADATA[fieldType];
          
          return (
            <button
              key={fieldType}
              onClick={() => handleAddField(fieldType)}
              className="w-full flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left group"
            >
              <span className="text-2xl flex-shrink-0">{metadata.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 group-hover:text-gray-900">
                  {metadata.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {metadata.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">💡 Tips:</p>
          <ul className="space-y-1 text-gray-500">
            <li>• Click a field to add it</li>
            <li>• Drag to reorder fields</li>
            <li>• Click field to edit properties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
