const REPO = 'lonalven27-hub/darkloner';
const FILE_PATH = 'public/data/courses.json';
const API = 'https://api.github.com';
let token = localStorage.getItem('dl_admin_token') || '';
let coursesData = null;
let currentSha = null;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function setStatus(s) {
  document.getElementById('status').textContent = s;
}

async function loadCourses() {
  try {
    setStatus('Loading...');
    const res = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    currentSha = data.sha;
    const decoded = atob(data.content);
    coursesData = JSON.parse(decoded);
    renderCourses();
    setStatus(`Loaded ${coursesData.courses.length} courses`);
  } catch (e) {
    setStatus('Error loading');
    toast('Error: ' + e.message);
  }
}

async function saveCourses(message) {
  try {
    setStatus('Saving...');
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(coursesData, null, 2))));
    const res = await fetch(`${API}/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || 'Update courses via admin panel',
        content: content,
        sha: currentSha
      })
    });
    if (!res.ok) throw new Error('Save failed');
    const data = await res.json();
    currentSha = data.content.sha;
    setStatus('Saved — Netlify will redeploy in ~1 min');
    toast('Saved! Netlify redeploying...');
  } catch (e) {
    setStatus('Save error');
    toast('Save error: ' + e.message);
  }
}

function renderCourses() {
  const list = document.getElementById('courses-list');
  document.getElementById('course-count').textContent = coursesData.courses.length;
  list.innerHTML = coursesData.courses.map((c, idx) => `
    <div class="admin-row">
      <strong>#${c.id} — ${c.title}</strong>
      <span class="tier-badge tier-${c.tier}" style="margin-left:0.5rem;">${c.tier.toUpperCase()}</span>
      <span class="muted" style="margin-left:0.5rem;">${c.category} · ${c.lessons.length} lessons</span>
      <div style="margin-top:0.75rem;">
        <button class="admin-btn secondary" onclick="editCourse(${idx})">Edit</button>
        <button class="admin-btn danger" onclick="deleteCourse(${idx})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteCourse = function(idx) {
  if (!confirm(`Delete "${coursesData.courses[idx].title}"?`)) return;
  coursesData.courses.splice(idx, 1);
  renderCourses();
  saveCourses('Delete course via admin panel');
};

window.editCourse = function(idx) {
  const c = coursesData.courses[idx];
  const newTitle = prompt('Title:', c.title);
  if (newTitle === null) return;
  const newDesc = prompt('Description:', c.desc);
  if (newDesc === null) return;
  const newTier = prompt('Tier (free/premium/pro/elite):', c.tier);
  if (!['free','premium','pro','elite'].includes(newTier)) {
    toast('Invalid tier'); return;
  }
  c.title = newTitle;
  c.desc = newDesc;
  c.tier = newTier;
  renderCourses();
  saveCourses('Edit course via admin panel');
};

document.getElementById('save-token').addEventListener('click', () => {
  const t = document.getElementById('token-input').value.trim();
  if (!t.startsWith('ghp_')) {
    toast('Token must start with ghp_');
    return;
  }
  localStorage.setItem('dl_admin_token', t);
  token = t;
  showAdmin();
  loadCourses();
});

document.getElementById('reset-token').addEventListener('click', () => {
  if (!confirm('Clear token from this device?')) return;
  localStorage.removeItem('dl_admin_token');
  location.reload();
});

document.getElementById('add-course').addEventListener('click', () => {
  const title = document.getElementById('new-title').value.trim();
  const category = document.getElementById('new-category').value.trim() || 'General';
  const tier = document.getElementById('new-tier').value;
  const desc = document.getElementById('new-desc').value.trim();
  const lessonsRaw = document.getElementById('new-lessons').value.trim();

  if (!title || !desc || !lessonsRaw) {
    toast('Fill title, desc, and lessons');
    return;
  }

  const lessons = lessonsRaw.split('\n').filter(l => l.trim()).map(line => {
    const [t, ...rest] = line.split('|');
    return { title: t.trim(), body: rest.join('|').trim() };
  });

  const nextId = Math.max(...coursesData.courses.map(c => c.id), 0) + 1;
  coursesData.courses.push({ id: nextId, title, category, tier, desc, lessons });

  document.getElementById('new-title').value = '';
  document.getElementById('new-category').value = '';
  document.getElementById('new-desc').value = '';
  document.getElementById('new-lessons').value = '';

  renderCourses();
  saveCourses('Add course via admin panel');
});

function showAdmin() {
  document.getElementById('token-gate').style.display = 'none';
  document.getElementById('admin-ui').style.display = 'block';
}

if (token) {
  showAdmin();
  loadCourses();
}
