import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Image as ImageIcon,
  Calendar,
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
        subtitle="Full history, status updates, and discussion thread for your unit"
        extraAction={
          <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            <span>Raise Complaint</span>
          </Link>
        }
      />

      <div className="page-body">
        {/* Filter Controls Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['', 'Open', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter('status', st)}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    background: statusFilter === st ? '#F04B4F' : '#FFFFFF',
                    color: statusFilter === st ? '#FFFFFF' : '#777777',
                    borderColor: statusFilter === st ? '#F04B4F' : '#E7E7E9'
                  }}
                >
                  {st === '' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Category and Search */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="select-field"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                value={categoryFilter}
                onChange={(e) => setFilter('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="input-field"
                    style={{ padding: '6px 10px 6px 28px', fontSize: '12px', width: '180px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={13} color="#777777" style={{ position: 'absolute', left: '8px', top: '9px' }} />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '6px 10px', fontSize: '12px' }}>
                  Find
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#777777', fontSize: '13px' }}>
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '48px 20px',
              textAlign: 'center'
            }}
          >
            <Building size={36} color="#A0A0A0" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#222222', fontSize: '15px', marginBottom: '4px' }}>No Complaints Match Your Filters</h3>
            <p style={{ color: '#777777', fontSize: '13px', marginBottom: '16px' }}>
              Try adjusting your category or status filter, or raise a new request.
            </p>
            <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>Raise Complaint</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {complaints.map((item) => {
              const fullPhotoUrl = item.photo_url ? `${API_ROOT}${item.photo_url}` : null;

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resident/complaints/${item.id}`)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: '1px solid #E7E7E9',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#D5D5D8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E7E7E9';
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                    {fullPhotoUrl ? (
                      <img
                        src={fullPhotoUrl}
                        alt="Thumbnail"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #E7E7E9',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '6px',
                          background: '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A0A0A0',
                          flexShrink: 0
                        }}
                      >
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F04B4F' }}>
                          #{item.id}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            background: '#F3F4F6',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            color: '#777777'
                          }}
                        >
                          {item.category}
                        </span>
                        <SLACountdownBadge complaint={item} />
                        <span style={{ fontSize: '11px', color: '#A0A0A0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} />
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '14px', color: '#222222', margin: '0 0 2px 0', fontWeight: '600' }}>
                        {item.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '12px',
                          color: '#777777',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '560px'
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
