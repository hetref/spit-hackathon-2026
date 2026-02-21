/**
 * CENTER CANVAS - Form Preview & Field Management
 */

'use client';

import { useState, useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';
import { FIELD_WIDTHS } from '@/lib/form-schema';

export default function FormCanvas() {
  const { formData, selectedFieldId, selectField, removeField, reorderFields } = useFormBuilderStore();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragCounter = useRef(0);

  const getFieldWidthClass = (width) => {
    switch (width) {
      case FIELD_WIDTHS.HALF:
        return 'w-1/2';
      case FIELD_WIDTHS.THIRD:
        return 'w-1/3';
      default:
        return 'w-full';
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a transparent drag image to hide the default preview
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderFields(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderFieldPreview = (field, index) => {
    const isSelected = selectedFieldId === field.id;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    
    return (
      <div
        key={field.id}
        className={`${getFieldWidthClass(field.width)} p-2`}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Field clicked:', field.id, field.label);
            selectField(field.id);
          }}
          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
            isSelected
              ? 'border-blue-500 bg-blue-50'
              : isDragOver
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
          {/* Drag Handle */}
          <div className="absolute left-2 top-2 text-gray-400 cursor-move hover:text-gray-600">
            <GripVertical size={16} />
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeField(field.id);
            }}
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>

          {/* Field Label */}
          <div className="mb-2 pl-6">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>

          {/* Field Input Preview */}
          <div className="pl-6">
            {renderInputPreview(field)}
          </div>

          {/* Field Type Badge */}
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {field.type}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderInputPreview = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={field.rows || 4}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
        );

      case 'select':
        return (
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          >
            <option>{field.placeholder || 'Select an option'}</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className={`space-${field.layout === 'horizontal' ? 'x' : 'y'}-2 ${field.layout === 'horizontal' ? 'flex' : ''}`}>
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" disabled className="rounded" />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className={`space-${field.layout === 'horizontal' ? 'x' : 'y'}-2 ${field.layout === 'horizontal' ? 'flex' : ''}`}>
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name={field.id} disabled />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-gray-50">
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Form Title */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{formData.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Fields */}
          {formData.fields.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No fields yet
              </h3>
              <p className="text-gray-500">
                Click a field type from the left sidebar to add it to your form
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap -mx-2">
              {formData.fields
                .sort((a, b) => a.order - b.order)
                .map((field, index) => renderFieldPreview(field, index))}
            </div>
          )}

          {/* Submit Button Preview */}
          {formData.fields.length > 0 && (
            <div className={`mt-8 pt-6 border-t border-gray-200 flex ${
              formData.settings.submitButtonPosition === 'center' ? 'justify-center' :
              formData.settings.submitButtonPosition === 'right' ? 'justify-end' :
              'justify-start'
            }`}>
              <button
                disabled
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium"
                style={{
                  backgroundColor: formData.styling.buttonColor,
                  color: formData.styling.buttonTextColor
                }}
              >
                {formData.settings.submitButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
