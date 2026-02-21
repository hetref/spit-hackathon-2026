/**
 * TOP TOOLBAR - Form Builder Actions
 */

'use client';

import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';

export default function FormBuilderToolbar({ onSave, saving, lastSaved }) {
  const router = useRouter();
  const params = useParams();
  const { formData, isDirty } = useFormBuilderStore();

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000); // seconds
    
    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff / 3600)}h ago`;
    return `Saved ${lastSaved.toLocaleDateString()}`;
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/forms`)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to Forms"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="h-6 w-px bg-gray-300" />
        
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{formData.name}</h1>
          <p className="text-xs text-gray-500">
            {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''}
            {isDirty ? (
              <span className="ml-2 text-orange-600">• Unsaved changes</span>
            ) : lastSaved ? (
              <span className="ml-2 text-green-600">• {formatLastSaved()}</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Preview Form"
        >
          <Eye size={16} />
          <span className="text-sm font-medium">Preview</span>
        </button>

        <button
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Form Settings"
        >
          <Settings size={16} />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          <span className="text-sm font-medium">
            {saving ? 'Saving...' : 'Save Form'}
          </span>
        </button>
      </div>
    </div>
  );
}
