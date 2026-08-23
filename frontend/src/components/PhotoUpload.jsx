import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Plus } from 'lucide-react';

export const PhotoUpload = ({ files, setFiles, file, setFile, maxMb = 10, maxFiles = 5 }) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Normalize single-file or multi-file props
  const isMulti = !!setFiles;
  const currentFiles = isMulti ? (files || []) : (file ? [file] : []);

  const validateAndAddFiles = (newFileList) => {
    setError('');
    if (!newFileList || newFileList.length === 0) return;

    const validNew = [];
    for (const f of newFileList) {
      if (!f.type.startsWith('image/')) {
        setError('Only valid image files (PNG, JPG, JPEG, WEBP) are allowed.');
        return;
      }
      if (f.size > maxMb * 1024 * 1024) {
        setError(`File "${f.name}" exceeds maximum size of ${maxMb}MB.`);
        return;
      }
      validNew.push(f);
    }

    if (isMulti) {
      const combined = [...currentFiles, ...validNew];
      if (combined.length > maxFiles) {
        setError(`You can attach a maximum of ${maxFiles} photos.`);
        setFiles(combined.slice(0, maxFiles));
      } else {
        setFiles(combined);
      }
    } else {
      if (validNew.length > 0 && setFile) {
        setFile(validNew[0]);
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemove = (index) => {
    if (isMulti) {
      setFiles(currentFiles.filter((_, i) => i !== index));
    } else if (setFile) {
      setFile(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => validateAndAddFiles(Array.from(e.target.files))}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        multiple={isMulti}
        style={{ display: 'none' }}
      />

      {/* Upload Dropzone */}
      {currentFiles.length < (isMulti ? maxFiles : 1) && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'var(--border-medium)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '24px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(6, 182, 212, 0.08)' : 'rgba(13, 21, 39, 0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: currentFiles.length > 0 ? '12px' : 0
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}
          >
            <UploadCloud size={22} />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Click to upload photo{isMulti ? 's (up to 5)' : ''} or drag & drop
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              PNG, JPG, JPEG, WEBP up to {maxMb}MB each (Optional)
            </div>
          </div>
        </div>
      )}

      {/* Attached Files List */}
      {currentFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {currentFiles.map((f, idx) => {
            const previewUrl = URL.createObjectURL(f);
            return (
              <div
                key={`${f.name}-${idx}`}
                className="glass-panel"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid var(--border-active)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <img
                    src={previewUrl}
                    alt="Upload thumbnail"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      border: '1px solid var(--border-subtle)'
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {(f.size / (1024 * 1024)).toFixed(2)} MB &bull; Attachment #{idx + 1}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px', color: 'var(--accent-rose)' }}
                  title="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--accent-rose)', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
          {error}
        </div>
      )}
    </div>
  );
};
