/* ================================================
   api.js — Campus Community API Integration Layer
   All API calls go through this file.
   Backend base URL: http://localhost:3000/api
   ================================================

   HOW TO USE IN ANY PAGE:
   -------------------------
   Include this file:   <script src="api.js"></script>
   Then call like this: API.getAnnouncements().then(data => { ... }).catch(err => { ... })

   ENDPOINTS YOUR BACKEND FRIEND NEEDS TO BUILD:
   -----------------------------------------------
   POST   /api/login
   POST   /api/register
   GET    /api/announcements          ?tag=tech
   POST   /api/announcements          (admin only)
   DELETE /api/announcements/:id      (admin only)
   GET    /api/clubs
   POST   /api/clubs                  (admin only)
   DELETE /api/clubs/:id              (admin only)
   GET    /api/events
   POST   /api/events                 (admin only)
   DELETE /api/events/:id             (admin only)
   GET    /api/reminders              (current user)
   POST   /api/reminders
   DELETE /api/reminders/:id
   GET    /api/schedules              (current user)
   POST   /api/schedules
   GET    /api/resources
   POST   /api/resources              (admin, multipart/form-data)
   GET    /api/discussions/categories
   GET    /api/discussions/threads?category_id=1
   GET    /api/discussions/threads/:id/posts
   POST   /api/discussions/threads
   POST   /api/discussions/threads/:id/posts
   GET    /api/users                  (admin only)
   PATCH  /api/users/:id/role         (admin only)
   DELETE /api/users/:id              (admin only)

   TOKEN:
   ------
   After login, store the JWT token: localStorage.setItem('token', token)
   This file automatically sends it with every request.
*/

const API_BASE = 'http://localhost:3000/api';

const API = {

  /* ---- Core request helper ---- */
  async request(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(API_BASE + url, { ...options, headers });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Error ${res.status}`);
    }

    return res.json();
  },

  /* ---- AUTH ---- */
  login(email, password, role) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  },

  register(name, email, password, role) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  /* ---- ANNOUNCEMENTS ---- */
  getAnnouncements(tag = '') {
    return this.request('/announcements' + (tag ? `?tag=${tag}` : ''));
  },

  createAnnouncement(data) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteAnnouncement(id) {
    return this.request(`/announcements/${id}`, { method: 'DELETE' });
  },

  /* ---- CLUBS ---- */
  getClubs() {
    return this.request('/clubs');
  },

  createClub(data) {
    return this.request('/clubs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteClub(id) {
    return this.request(`/clubs/${id}`, { method: 'DELETE' });
  },

  /* ---- EVENTS ---- */
  getEvents() {
    return this.request('/events');
  },

  createEvent(data) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  },

  /* ---- REMINDERS ---- */
  getReminders() {
    return this.request('/reminders');
  },

  createReminder(data) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteReminder(id) {
    return this.request(`/reminders/${id}`, { method: 'DELETE' });
  },

  /* ---- SCHEDULE ---- */
  getSchedules() {
    return this.request('/schedules');
  },

  createSchedule(data) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /* ---- RESOURCES ---- */
  getResources() {
    return this.request('/resources');
  },

  /* ---- DISCUSSIONS ---- */
  getCategories() {
    return this.request('/discussions/categories');
  },

  getThreads(categoryId) {
    return this.request(`/discussions/threads?category_id=${categoryId}`);
  },

  getPosts(threadId) {
    return this.request(`/discussions/threads/${threadId}/posts`);
  },

  createThread(data) {
    return this.request('/discussions/threads', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  createPost(threadId, data) {
    return this.request(`/discussions/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /* ---- USERS (Admin only) ---- */
  getUsers() {
    return this.request('/users');
  },

  updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  },

  /* ---- HELPERS ---- */
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getRole() {
    return localStorage.getItem('role') || null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
  }

};
