import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';
import { SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const CategorySlaManage = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [slaDays, setSlaDays] = useState(3);

  const fetchCategories = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getCategorySlas();
      setCategories(data);
      if (isManual) toast.success('SLAs updated', 'Latest category SLAs loaded.');
    } catch (err) {
      console.error('Failed to load category SLAs:', err);
      if (isManual) toast.error('Refresh failed', 'Could not retrieve category SLAs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditCategory(null);
    setName('');
    setSlaDays(3);
    setError('');
    setSaveSuccess(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlaDays(cat.sla_days);
    setError('');
    setSaveSuccess(false);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editCategory) {
        await api.updateCategorySla(editCategory.id, {
          sla_days: parseInt(slaDays, 10)
        });
        toast.success('SLA updated', `${editCategory.name} SLA set to ${slaDays} days.`);
      } else {
        await api.createCategorySla({
          name: name.trim(),
          sla_days: parseInt(slaDays, 10),
          is_active: true
        });
        toast.success('Category created', `${name.trim()} added with ${slaDays} days SLA.`);
      }
      setSaving(false);
      setSaveSuccess(true);

      setTimeout(() => {
        setModalOpen(false);
        setSaveSuccess(false);
        fetchCategories();
      }, 700);
    } catch (err) {
      setSaving(false);
      setError(err.message || 'Failed to save category SLA.');
      toast.error('Save failed', err.message || 'Failed to save category SLA.');
    }
  };

  return (
    <>
      <Navbar
        title="Category SLA Configuration"
        subtitle="Define custom resolution targets per maintenance category (e.g. Lift: 1d, Plumbing: 2d)"
        extraAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Category SLA</span>
            </button>
            <button
              onClick={() => fetchCategories(true)}
              className="btn btn-secondary btn-sm"
              disabled={loading || refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-body" style={{ maxWidth: '840px' }}>
        <div
          className="stagger-1"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>
                Service Level Agreements ({categories.length})
              </h2>
              <p style={{ fontSize: '12px', color: '#777777', margin: '2px 0 0 0' }}>
                Updating SLA days dynamically recalculates overdue status across all tickets
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777777' }}>
              No categories configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E7E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s',
                    animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#FCECED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F04B4F'
                      }}
                    >
                      <Layers size={17} />
                    </div>

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#222222' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#777777' }}>
                        Status: <strong style={{ color: cat.is_active ? '#15803D' : '#777777' }}>{cat.is_active ? 'Active' : 'Inactive'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#F04B4F' }}>
                        {cat.sla_days} {cat.sla_days === 1 ? 'Day' : 'Days'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#A0A0A0' }}>
                        Resolution Target
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', display: 'flex', gap: '4px', fontSize: '12px' }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editCategory ? `Edit SLA: ${editCategory.name}` : 'Create New Category SLA'}
          maxWidth="460px"
        >
          {error && (
            <div
              style={{
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#F04B4F',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                animation: 'itemSlideUp 0.25s forwards'
              }}
            >
              <AlertCircle size={15} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSave}>
            {!editCategory && (
              <div className="input-group">
                <label className="input-label">Category Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Landscaping"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">SLA Target (Days) *</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                className="input-field"
                value={slaDays}
                onChange={(e) => setSlaDays(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: '#777777', marginTop: '4px' }}>
                Complaints exceeding this number of days will automatically be flagged as Overdue.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || saveSuccess}
                className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'}`}
              >
                {saving ? (
                  <span className="btn-spinner" style={{ width: '13px', height: '13px' }} />
                ) : saveSuccess ? (
                  <Check size={14} className="btn-checkmark-icon" />
                ) : null}
                <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
