const params = new URLSearchParams(location.search);
const courseId = parseInt(params.get('id'));
const user = JSON.parse(localStorage.getItem('dl_user') || 'null');
if (!user) window.location.href = 'login.html';

const TIER_RANK = { free: 0, premium: 1, pro: 2, elite: 3 };

let course = null;
let currentLesson = 0;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderLesson() {
  const lesson = course.lessons[currentLesson];
  const total = course.lessons.length;

  const progressPct = Math.round(((currentLesson + 1) / total) * 100);

  const bodyHtml = escapeHtml(lesson.body).replace(/\n/g, '<br>');

  document.getElementById('lesson-container').innerHTML = `
    <div class="lesson-header">
      <span class="lesson-count">Lesson ${currentLesson + 1} of ${total}</span>
      <span class="lesson-pct">${progressPct}%</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
    <h2 class="lesson-title">${escapeHtml(lesson.title)}</h2>
    <div class="lesson-body">${bodyHtml}</div>
    <div class="lesson-nav">
      <button class="btn ${currentLesson === 0 ? 'disabled' : ''}" id="prev-btn" ${currentLesson === 0 ? 'disabled' : ''}>← Previous</button>
      ${
        currentLesson < total - 1
          ? '<button class="btn" id="next-btn">Next →</button>'
          : '<a href="dashboard.html" class="btn">✅ Finish Course</a>'
      }
    </div>
  `;

  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn && currentLesson > 0) {
    prevBtn.addEventListener('click', () => {
      currentLesson--;
      renderLesson();
      window.scrollTo(0, 0);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentLesson++;
      renderLesson();
      window.scrollTo(0, 0);
    });
  }
}

fetch('data/courses.json')
  .then(r => r.json())
  .then(data => {
    const c = data.courses.find(x => x.id === courseId);
    if (!c) {
      document.getElementById('course-title').textContent = 'Course not found';
      return;
    }

    document.getElementById('course-title').textContent = c.title;
    document.getElementById('course-desc').textContent = c.desc;

    const userRank = TIER_RANK[user.tier || 'free'];
    const needRank = TIER_RANK[c.tier];

    if (userRank < needRank) {
      document.getElementById('lesson-container').innerHTML =
        `<div class="locked"><h3>🔒 Locked</h3><p>This course requires <strong>${escapeHtml(c.tier.toUpperCase())}</strong>.</p><a href="pricing.html" class="btn">Upgrade</a></div>`;
      return;
    }

    course = c;
    currentLesson = 0;
    renderLesson();
  })
  .catch(() => {
    document.getElementById('lesson-container').innerHTML = '<p>Error loading course.</p>';
  });

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('dl_user');
  window.location.href = 'index.html';
});
