import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { PhotoUpload } from '../../components/PhotoUpload';
import { DuplicateWarningModal } from '../../components/DuplicateWarningModal';
import { useToast } from '../../context/ToastContext';

export const NewComplaint = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

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

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

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
      setLoading(false);
      setSuccess(true);
      toast.success('Complaint Raised', `Ticket registered under ${category} category.`);

      setTimeout(() => {
        navigate('/resident/my-complaints');
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to raise complaint.');
      triggerShake();
      toast.error('Submission failed', err.message || 'Could not create complaint.');
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a short title for the complaint.');
      triggerShake();
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed description.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
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
    } catch {
      await doSubmitComplaint();
    }
  };

  return (
    <>
      <Navbar
        title="Raise Maintenance Complaint"
        subtitle="Submit a service request with description, category SLA, and multiple photos"
        extraAction={
          <Link to="/resident/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
        }
      />

      <div className="page-body" style={{ maxWidth: '780px' }}>
        <div
          className={`stagger-1 ${isShaking ? 'card-shake' : ''}`}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            transition: 'box-shadow 0.25s ease'
          }}
        >
          {error && (
            <div
              style={{
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#F04B4F',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
                animation: 'itemSlideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
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
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title Input */}
            <div className="input-group">
              <label className="input-label">Complaint Title *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Water leakage in kitchen pipeline"
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Link to="/resident/dashboard" className="btn btn-secondary">
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading || success}
                className={`btn ${success ? 'btn-success' : 'btn-primary'}`}
                style={{ padding: '10px 22px' }}
              >
                {loading ? (
                  <span className="btn-spinner" style={{ width: '14px', height: '14px' }} />
                ) : success ? (
                  <Check size={16} className="btn-checkmark-icon" />
                ) : (
                  <PlusCircle size={15} />
                )}
                <span>{loading ? 'Submitting...' : success ? 'Submitted!' : 'Submit Complaint'}</span>
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
