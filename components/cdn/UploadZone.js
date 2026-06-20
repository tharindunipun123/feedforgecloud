'use client';

import { useCallback, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { uploadCdnAsset } from '@/lib/firebase/cdn';
import { validateFileForPlan, checkCredits } from '@/lib/cdn/helpers';

export default function UploadZone({ userId, subscription, onUploadComplete }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);

  const plan = {
    allowedFileTypes: subscription?.allowedFileTypes || ['*'],
    maxImageSizeMB: subscription?.maxImageSizeMB || 10,
    maxVideoSizeMB: subscription?.maxVideoSizeMB || 100,
  };

  const validateFiles = (fileList) => {
    const errs = [];
    const valid = [];
    Array.from(fileList).forEach((file) => {
      const result = validateFileForPlan(file, plan);
      if (!result.valid) {
        errs.push(`${file.name}: ${result.error}`);
        return;
      }
      const creditCheck = checkCredits(subscription, result.creditsNeeded);
      if (!creditCheck.allowed) {
        errs.push(`${file.name}: ${creditCheck.error}`);
        return;
      }
      valid.push(file);
    });
    return { valid, errs };
  };

  const uploadFiles = async (files) => {
    const { valid, errs } = validateFiles(files);
    setErrors(errs);
    setSuccess(null);
    if (valid.length === 0) return;

    setUploading(true);
    setProgress(0);
    const uploaded = [];

    try {
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const asset = await uploadCdnAsset(
          userId,
          subscription,
          file,
          {},
          (pct) => setProgress(Math.round(((i + pct / 100) / valid.length) * 100))
        );
        uploaded.push(asset);
      }
      setSuccess(`${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded successfully.`);
      setProgress(100);
      onUploadComplete?.(uploaded);
    } catch (err) {
      setErrors((prev) => [...prev, err.message || 'Upload failed.']);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      if (uploading) return;
      const files = e.dataTransfer?.files;
      if (files?.length) uploadFiles(files);
    },
    [uploading, subscription, userId]
  );

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files?.length) uploadFiles(files);
    e.target.value = '';
  };

  return (
    <Card>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-white bg-neutral-900' : 'border-neutral-700 hover:border-neutral-500'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <svg className="w-12 h-12 text-neutral-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className="text-white font-medium mb-1">
          {uploading ? 'Uploading…' : 'Drag and drop files here'}
        </p>
        <p className="text-neutral-400 text-sm mb-4">or click to browse</p>
        {!uploading && (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
            Choose files
          </Button>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-400">Progress</span>
            <span className="text-white">{progress}%</span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {success && (
        <p className="mt-4 text-sm text-neutral-300 border border-neutral-700 rounded-lg px-4 py-3">{success}</p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-neutral-400 border border-neutral-700 rounded-lg px-4 py-2">
              {err}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
