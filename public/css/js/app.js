const COURSES = [
  { id: 1, title: 'HTML & CSS Foundations', desc: 'Build your first web pages.', tier: 'free' },
  { id: 2, title: 'JavaScript Basics', desc: 'Variables, functions, loops.', tier: 'free' },
  { id: 3, title: 'Node.js & Backend', desc: 'Servers, APIs, databases.', tier: 'premium' },
  { id: 4, title: 'Website Builder Track', desc: 'Build and launch real sites.', tier: 'premium' },
  { id: 5, title: 'Cyber Security Essentials', desc: 'Ethical hacking, defenses.', tier: 'pro' },
  { id: 6, title: 'Advanced Pentesting', desc: 'Labs, real-world scenarios.', tier: 'elite' }
];

const TIER_RANK = { free: 0, premium: 1, pro: 2, elite: 3 };

function loadCourses() {
  const list = document.getElementById('course-list');
  if (!list) return;

  const user = JSON.parse(localStorage.getItem('dl_user') || 'null');
  const userRank = user ? TIER_RANK[user.tier || 'free'] : 0;

  list.innerHTML = COURSES.map(c => {
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
}
