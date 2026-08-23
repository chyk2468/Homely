const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const API_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders(isMultipart = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const isMultipart = options.body instanceof FormData;
    const url = `${BASE_URL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isMultipart),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
        this.setToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((err) => {
              if (typeof err === 'string') return err;
              if (err && typeof err === 'object') {
                const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : '';
                const msg = err.msg || JSON.stringify(err);
                return field ? `${field}: ${msg}` : msg;
              }
              return String(err);
            })
            .join(' | ');
        } else if (data.detail && typeof data.detail === 'object') {
          errorMessage = data.detail.msg || data.detail.message || JSON.stringify(data.detail);
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Complaints
  async createComplaint(formData) {
    return this.request('/complaints', {
      method: 'POST',
      body: formData
    });
  }

  async checkDuplicate(data) {
    return this.request('/complaints/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/complaints${queryString}`);
  }

  async getComplaint(id) {
    return this.request(`/complaints/${id}`);
  }

  async getComplaintHistory(id) {
    return this.request(`/complaints/${id}/history`);
  }

  async getCategories() {
    return this.request('/complaints/categories');
  }

  async updateComplaintStatus(id, status, note = '') {
    return this.request(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }

  async updateComplaintPriority(id, priority, note = '') {
    return this.request(`/complaints/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, note })
    });
  }

  // Comments / Discussion
  async getComments(complaintId) {
    return this.request(`/complaints/${complaintId}/comments`);
  }

  async postComment(complaintId, message) {
    return this.request(`/complaints/${complaintId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Resident Feedback
  async getFeedback(complaintId) {
    return this.request(`/complaints/${complaintId}/feedback`);
  }

  async postFeedback(complaintId, rating, comment = '') {
    return this.request(`/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  }

  // Reopen Requests
  async postReopenRequest(complaintId, reason) {
    return this.request(`/complaints/${complaintId}/reopen-request`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Staff endpoints
  async getStaffComplaints(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/staff/complaints${queryString}`);
  }

  async updateStaffComplaintStatus(id, status, note = '') {
    return this.request(`/staff/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }

  // Admin Assignment & Management
  async assignComplaint(complaintId, staffId, note = '') {
    return this.request(`/admin/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ staff_id: staffId, note })
    });
  }

  async getStaffList() {
    return this.request('/admin/staff');
  }

  async createStaff(staffData) {
    return this.request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  }

  async updateStaff(staffId, staffData) {
    return this.request(`/admin/staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify(staffData)
    });
  }

  // Category SLAs
  async getCategorySlas() {
    return this.request('/admin/categories');
  }

  async createCategorySla(data) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCategorySla(catId, data) {
    return this.request(`/admin/categories/${catId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Reopen Review
  async getReopenRequests(status = '') {
    const q = status ? `?status=${status}` : '';
    return this.request(`/admin/reopen-requests${q}`);
  }

  async reviewReopenRequest(requestId, decision, adminNotes = '') {
    return this.request(`/admin/reopen-requests/${requestId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, admin_notes: adminNotes })
    });
  }

  // Audit Logs & Analytics
  async getAuditLogs() {
    return this.request('/admin/audit-logs');
  }

  async getRecurringIssues() {
    return this.request('/admin/analytics/recurring-issues');
  }

  getComplaintsCsvDownloadUrl(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return `${BASE_URL}/admin/reports/complaints/csv${queryString}`;
  }

  // In-App Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST'
    });
  }

  // Notices
  async getNotices() {
    return this.request('/notices');
  }

  async createNotice(noticeData) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData)
    });
  }

  async updateNotice(id, noticeData) {
    return this.request(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noticeData)
    });
  }

  async deleteNotice(id) {
    return this.request(`/notices/${id}`, {
      method: 'DELETE'
    });
  }

  // Dashboard & Settings
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardSummary() {
    return this.request('/dashboard/summary');
  }

  async getOverdueThreshold() {
    return this.request('/settings/overdue-threshold');
  }

  async updateOverdueThreshold(value) {
    return this.request('/settings/overdue-threshold', {
      method: 'PUT',
      body: JSON.stringify({ value: String(value) })
    });
  }
}

export const api = new ApiClient();
