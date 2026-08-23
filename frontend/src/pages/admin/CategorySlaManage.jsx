import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';

export const CategorySlaManage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [slaDays, setSlaDays] = useState(3);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategorySlas();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load category SLAs:', err);
    } finally {
      setLoading(false);
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
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlaDays(cat.sla_days);
    setError('');
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
      } else {
        await api.createCategorySla({
          name: name.trim(),
          sla_days: parseInt(slaDays, 10),
          is_active: true
        });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category SLA.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar
        title="Category-Specific SLA Configuration"
        subtitle="Define custom SLA resolution targets per maintenance discipline (e.g., Lift: 1d, Plumbing: 2d)"
        extraAction={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Add Category SLA</span>
            </button>
            <button onClick={fetchCategories} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-body" style={{ maxWidth: '900px' }}>
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
                Configured Service Level Agreements ({categories.length})
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Updating SLA days automatically recalculates deadlines and overdue badges across all active tickets.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No categories configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(13, 21, 39, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(6, 182, 212, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-cyan)'
                      }}
                    >
                      <Layers size={18} />
                    </div>

                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Status: <strong style={{ color: cat.is_active ? 'var(--accent-emerald)' : '#64748b' }}>{cat.is_active ? 'Active' : 'Inactive'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                        {cat.sla_days} {cat.sla_days === 1 ? 'Day' : 'Days'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Max Resolution Window
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '8px 12px', display: 'flex', gap: '6px' }}
                    >
                      <Edit2 size={13} />
                      <span>Edit SLA</span>
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
          maxWidth="480px"
        >
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fb7185',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
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
                  placeholder="e.g. Landscaping & Garden"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">SLA Resolution Target (Days) *</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                className="input-field"
                value={slaDays}
                onChange={(e) => setSlaDays(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Complaints unresolved past this number of days will automatically be flagged as Overdue.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
