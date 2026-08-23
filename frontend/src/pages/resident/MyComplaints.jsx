import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ListOrdered,
  PlusCircle,
  Search,
  Filter,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  RefreshCw,
  Building
} from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';

export const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status') || '';
  const categoryFilter = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter,
          search: searchQuery
        }),
        api.getCategories()
      ]);
      setComplaints(data);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const setFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams);
  };

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Navbar
        title="My Complaints"
        subtitle="Full history, current progress, and administrator updates for your unit"
        extraAction={
          <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>Raise Complaint</span>
          </Link>
        }
      />

      <div className="page-body">
        {/* Filter Controls Bar */}
        <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['', 'Open', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter('status', st)}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  {st === '' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Category and Search */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="select-field"
                style={{ width: 'auto', padding: '7px 12px', fontSize: '13px' }}
                value={categoryFilter}
                onChange={(e) => setFilter('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="input-field"
                    style={{ padding: '7px 12px 7px 32px', fontSize: '13px', width: '200px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Find
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '64px 20px', textAlign: 'center' }}>
            <Building size={42} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Complaints Match Your Filters</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Try adjusting your category or status filter, or raise a new request.
            </p>
            <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
              <PlusCircle size={15} />
              <span>Raise Complaint</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {complaints.map((item) => {
              const fullPhotoUrl = item.photo_url ? `${API_ROOT}${item.photo_url}` : null;

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resident/complaints/${item.id}`)}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                    {fullPhotoUrl ? (
                      <img
                        src={fullPhotoUrl}
                        alt="Thumbnail"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}
                      >
                        <ImageIcon size={22} />
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                          #{item.id}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {item.category}
                        </span>
                        <SLACountdownBadge complaint={item} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 4px 0' }}>
                        {item.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '600px'
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} isOverdue={item.is_overdue} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
