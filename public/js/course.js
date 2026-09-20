const params = new URLSearchParams(location.search);
const id = parseInt(params.get('id'));
const user = JSON.parse(localStorage.getItem('dl_user') || 'null');
if (!user) window.location.href = 'login.html';

const TIER_RANK = { free: 0, premium: 1, pro: 2, elite: 3 };

fetch('data/courses.json')
  .then(r => r.json())
  .then(data => {
    const c = data.courses.find(x => x.id === id);
    if (!c) {
      document.getElementById('course-title').textContent = 'Course not found';
      return;
    }

    document.getElementById('course-title').textContent = c.title;
    document.getElementById('course-desc').textContent = c.desc;

    const userRank = TIER_RANK[user.tier || 'free'];
    const needRank = TIER_RANK[c.tier];

    if (userRank >= needRank) {
      const html = c.lessons.map((l, i) =>
        `<h3>Lesson ${i + 1} — ${l.title}</h3><p>${l.body}</p>`
      ).join('');
      document.getElementById('course-body').innerHTML = html;
    } else {
      document.getElementById('course-body').innerHTML =
        `<div class="locked"><h3>🔒 Locked</h3><p>This course requires <strong>${c.tier.toUpperCase()}</strong>.</p><a href="pricing.html" class="btn">Upgrade</a></div>`;
    }
  })
  .catch(() => {
    document.getElementById('course-body').innerHTML = '<p>Error loading course.</p>';
  });

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('dl_user');
  window.location.href = 'index.html';
});
