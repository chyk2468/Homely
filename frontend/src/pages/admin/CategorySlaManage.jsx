import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, RefreshCw, AlertCircle } from 'lucide-react';
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
        title="Category SLA Configuration"
        subtitle="Define custom resolution targets per maintenance category (e.g. Lift: 1d, Plumbing: 2d)"
        extraAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Category SLA</span>
            </button>
            <button onClick={fetchCategories} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-body" style={{ maxWidth: '840px' }}>
        <div
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#777777', fontSize: '13px' }}>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777777' }}>
              No categories configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map((cat) => (
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
                    gap: '14px'
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
                marginBottom: '14px'
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
