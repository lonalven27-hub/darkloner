const TIER_RANK = { free: 0, premium: 1, pro: 2, elite: 3 };

function loadCourses() {
  const list = document.getElementById('course-list');
  if (!list) return;

  const user = JSON.parse(localStorage.getItem('dl_user') || 'null');
  const userRank = user ? TIER_RANK[user.tier || 'free'] : 0;

  fetch('data/courses.json')
    .then(r => r.json())
    .then(data => {
      list.innerHTML = data.courses.map(c => {
        const locked = userRank < TIER_RANK[c.tier];
        return `
          <div class="card course-card">
            <h3>${c.title} ${locked ? '🔒' : ''}</h3>
            <p>${c.desc}</p>
            <span class="tier-badge tier-${c.tier}">${c.tier.toUpperCase()}</span>
            <a href="course.html?id=${c.id}" class="btn small">${locked ? 'View' : 'Open'}</a>
          </div>
        `;
      }).join('');
    })
    .catch(() => { list.innerHTML = '<p>Error loading courses.</p>'; });
}
