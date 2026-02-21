'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Loader2 } from 'lucide-react';

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { tenantId, siteId, formId } = params;

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [formId]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch form details
      const formRes = await fetch(`/api/sites/${siteId}/forms/${formId}`);
      if (!formRes.ok) throw new Error('Failed to fetch form');
      const formData = await formRes.json();
      console.log('Form data received:', formData);
      // API returns { form: {...} }, so extract the form object
      setForm(formData.form || formData);

      // Fetch submissions
      const submissionsRes = await fetch(`/api/sites/${siteId}/forms/${formId}/submissions`);
      if (!submissionsRes.ok) throw new Error('Failed to fetch submissions');
      const submissionsData = await submissionsRes.json();
      console.log('Submissions data received:', submissionsData);
      setSubmissions(submissionsData.submissions || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get field label from field ID
  function getFieldLabel(fieldId) {
    if (!form?.schema) {
      console.log('No form schema available');
      return fieldId;
    }
    
    console.log('Looking for field:', fieldId);
    console.log('Form schema:', form.schema);
    
    const field = form.schema.find(f => f.id === fieldId);
    console.log('Found field:', field);
    
    return field?.label || fieldId;
  }

  async function handleDelete(submissionId) {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const res = await fetch(`/api/sites/${siteId}/forms/${formId}/submissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok) throw new Error('Failed to delete submission');
      
      // Refresh submissions
      fetchData();
    } catch (err) {
      alert('Error deleting submission: ' + err.message);
    }
  }

  function handleExportCSV() {
    if (!submissions.length) return;

    // Get all unique field names
    const fieldNames = new Set();
    submissions.forEach(sub => {
      Object.keys(sub.data).forEach(key => fieldNames.add(key));
    });
    const fields = Array.from(fieldNames);

    // Create CSV header
    const header = ['Submission Date', ...fields].join(',');

    // Create CSV rows
    const rows = submissions.map(sub => {
      const date = new Date(sub.createdAt).toLocaleString();
      const values = fields.map(field => {
        const value = sub.data[field];
        // Handle arrays (checkboxes)
        if (Array.isArray(value)) return `"${value.join(', ')}"`;
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      return [date, ...values].join(',');
    });

    // Combine and download
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.name || 'form'}-submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/${tenantId}/sites/${siteId}/forms`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{form?.name}</h1>
            <p className="text-gray-600 mt-1">
              {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
            </p>
          </div>
          
          {submissions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600">No submissions yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Submissions will appear here when users fill out your form
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(submission.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(submission.id)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                  title="Delete submission"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(submission.data).map(([fieldId, value]) => (
                  <div key={fieldId}>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {getFieldLabel(fieldId)}
                    </p>
                    <p className="text-gray-900">
                      {Array.isArray(value) ? value.join(', ') : value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
