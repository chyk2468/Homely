import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { PhotoUpload } from '../../components/PhotoUpload';
import { DuplicateWarningModal } from '../../components/DuplicateWarningModal';

export const NewComplaint = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Duplicate detection state
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicatesFound, setDuplicatesFound] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0]);
        }
      } catch {
        setCategories(['Plumbing', 'Electrical', 'Civil', 'Pest Control', 'Elevator', 'Cleaning & Sanitation', 'Security', 'Carpentry', 'Other']);
        setCategory('Plumbing');
      }
    };
    fetchCats();
  }, []);

  const doSubmitComplaint = async () => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      
      if (photos && photos.length > 0) {
        photos.forEach((file) => {
          formData.append('photos', file);
        });
      }

      await api.createComplaint(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/resident/my-complaints');
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to raise complaint.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a short title for the complaint.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed description.');
      return;
    }

    setLoading(true);
    try {
      // Check for potential duplicate complaints
      const dupRes = await api.checkDuplicate({
        title: title.trim(),
        category: category,
        description: description.trim()
      });

      if (dupRes.has_potential_duplicates && dupRes.potential_duplicates.length > 0) {
        setDuplicatesFound(dupRes.potential_duplicates);
        setDuplicateWarningOpen(true);
        setLoading(false);
        return;
      }

      await doSubmitComplaint();
    } catch (err) {
      // If duplicate check failed, proceed with direct submission
      await doSubmitComplaint();
    }
  };

  return (
    <>
      <Navbar
        title="Raise Maintenance Complaint"
        subtitle="Submit a service request with description, category SLA, and multiple supporting photos"
        extraAction={
          <Link to="/resident/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        }
      />

      <div className="page-body" style={{ maxWidth: '820px' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: '#fb7185',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <AlertCircle size={16} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                color: '#34d399',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              <CheckCircle2 size={18} />
              <div>Complaint submitted successfully! Redirecting to your complaints registry...</div>
            </div>
          )}

          <form onSubmit={handlePreSubmit}>
            {/* Category Dropdown */}
            <div className="input-group">
              <label className="input-label">Issue Category *</label>
              <select
                className="select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} style={{ background: '#0d1527', color: '#fff' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <div className="input-group">
              <label className="input-label">Complaint Title / Summary *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Water leak under kitchen sink pipe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description Textarea */}
            <div className="input-group">
              <label className="input-label">Detailed Description *</label>
              <textarea
                required
                className="textarea-field"
                rows={4}
                placeholder="Please describe the exact issue, location, when it started, and any urgency details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Supporting Photos Upload */}
            <div className="input-group">
              <label className="input-label">Supporting Photos (Optional, up to 5)</label>
              <PhotoUpload files={photos} setFiles={setPhotos} maxMb={10} maxFiles={5} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <Link to="/resident/dashboard" className="btn btn-secondary">
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || success}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <PlusCircle size={17} />
                <span>{loading ? 'Submitting...' : 'Submit Complaint'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateWarningOpen && (
        <DuplicateWarningModal
          isOpen={duplicateWarningOpen}
          onClose={() => setDuplicateWarningOpen(false)}
          duplicates={duplicatesFound}
          onConfirmSubmit={() => {
            setDuplicateWarningOpen(false);
            doSubmitComplaint();
          }}
          onViewComplaint={(cid) => {
            setDuplicateWarningOpen(false);
            navigate(`/resident/complaints/${cid}`);
          }}
        />
      )}
    </>
  );
};
