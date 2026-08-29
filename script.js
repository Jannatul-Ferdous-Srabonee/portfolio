// Scroll spy - update active link based on which section is in view
function updateActiveLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    let current = '';
    sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
    }
    });

    navLinks.forEach(link => {
    link.removeAttribute('aria-current');
    });

    if (current) {
    const activeLink = document.querySelector(`nav a[href="#${current}"]`);
    if (activeLink) {
        activeLink.setAttribute('aria-current', 'page');
    }
    }
}

// Keyboard navigation support
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        }
    }
    });
});

// Update active link on scroll and on page load
window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);
updateActiveLink();

// Focus management - move focus to main content when section is scrolled to
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
        setTimeout(() => {
        const heading = target.querySelector('h1, h2');
        if (heading) {
            heading.focus();
            heading.scrollIntoView({ behavior: 'smooth' });
        }
        }, 100);
    }
    });
});

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const html = document.documentElement;

// Check saved preference or system preference
function initTheme() {
  const saved = localStorage.getItem('theme');
  const isDark = saved === 'dark' || 
    (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  setTheme(isDark ? 'dark' : 'light');
}

function setTheme(theme) {
  const themeIcon = document.querySelector('.theme-icon');
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    themeToggle.setAttribute('aria-label', 'Light Mode');
    // themeLabel.textContent = 'Light';
    themeIcon.src = 'assets/light_mode_icon.svg';  // Light mode icon
  } else {
    html.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-label', 'Dark Mode');
    // themeLabel.textContent = 'Dark';
    themeIcon.src = 'assets/dark_mode_icon.svg';  // Dark mode icon
  }
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  setTheme(isDark ? 'light' : 'dark');
});

// Initialize on page load
initTheme();

// =========================================================
// NAME PRONUNCIATION
// User-triggered only (never autoplay). Audio is one channel among
// several — IPA + plain-English respelling are always visible in the
// caption regardless of whether the audio plays or loads.
// =========================================================
(function namePronunciation() {
  const btn = document.getElementById('pronounce-btn');
  const audio = document.getElementById('name-audio');
  if (!btn || !audio) return;

  const syllableTimings = [
    { start: 0.00, end: 0.29 }, // Jan / dʒə
    { start: 0.29, end: 0.56 }, // na / ˈnɑː
    { start: 0.56, end: 1.06 }, // tul / tʊl
    { start: 1.06, end: 1.64 }, // fer / fɜr
    { start: 1.64, end: 2.05 }, // dous / ˈdaʊs
    { start: 2.07, end: 2.94 }, // SRA / sra
    { start: 2.84, end: 3.13 }, // boh / ˈboʊ
    { start: 3.13, end: 3.60 }, // nee / ni
  ];

  function clearHighlight() {
    document.querySelectorAll('.syl.is-current').forEach((s) => s.classList.remove('is-current'));
  }

  btn.setAttribute('aria-pressed', 'false');

  btn.addEventListener('click', () => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      clearHighlight();
      return;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay/decoding failed silently — respelling + IPA caption
      // are already visible, so nothing is lost.
    });
  });

  audio.addEventListener('timeupdate', () => {
    const t = audio.currentTime;
    syllableTimings.forEach((seg, i) => {
      const active = t >= seg.start && t < seg.end;
      document.querySelectorAll(`.syl[data-syl="${i}"]`).forEach((el) => {
        el.classList.toggle('is-current', active);
      });
    });
  });

  audio.addEventListener('play', () => btn.setAttribute('aria-pressed', 'true'));
  audio.addEventListener('pause', () => { btn.setAttribute('aria-pressed', 'false'); clearHighlight(); });
  audio.addEventListener('ended', () => { btn.setAttribute('aria-pressed', 'false'); clearHighlight(); });
})();

// =========================================================
// NEWS LIST: sort entries newest-first by parsing "Mon YYYY" dates
// =========================================================
(function sortNewsList() {
  const list = document.querySelector('.news-list');
  if (!list) return;

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  function parseDate(text) {
    const match = text.trim().toLowerCase().match(/([a-z]{3})[a-z]*\.?\s+(\d{4})/);
    if (!match) return -Infinity;
    const monthIndex = months.indexOf(match[1]);
    const year = parseInt(match[2], 10);
    return year * 12 + (monthIndex === -1 ? 0 : monthIndex);
  }

  const items = Array.from(list.children);
  items
    .map((item) => ({ item, key: parseDate(item.querySelector('.news-date')?.textContent || '') }))
    .sort((a, b) => b.key - a.key)
    .forEach(({ item }) => list.appendChild(item));
})();

// =========================================================
// PUBLICATION FILTERS (type = single-select, topic = multi-select)
// A paper matches when its type matches the selected type (or "All")
// AND it has at least one of the selected topics (or "All" is selected).
// =========================================================
(function pubFilters() {
  // const cards = document.querySelectorAll('.card');
  const list = document.querySelector('.pub-list');
  if (!list) return;
  
  const cards = list.querySelectorAll('.card');  // Only cards in pub-list
  if (!cards.length) return;
  
  // if (!cards.length) return;

  // const list = document.querySelector('.pub-list');
  // Snapshot the original authored order once, before any reordering happens.
  // Used as a stable tie-breaker and as the resting order for undated/pending work.
  const originalOrder = Array.from(cards);

  const typeGroup = document.querySelector('[data-filter-type="type"] .tag-row');
  const topicGroup = document.querySelector('[data-filter-type="topic"] .tag-row');
  const status = document.getElementById('pub-filter-status');
  const emptyState = document.getElementById('pub-empty-state');

  let selectedType = 'all';
  let selectedTopics = new Set(['all']);

  function applyFilters() {
    let visibleCount = 0;
    const isDefaultAllAll = selectedType === 'all' && selectedTopics.has('all');

    cards.forEach((card) => {
      const cardType = card.dataset.type;
      const cardTopics = (card.dataset.topic || '').split(' ');

      const typeMatch = selectedType === 'all' || cardType === selectedType;
      const topicMatch = selectedTopics.has('all') ||
        cardTopics.some((t) => selectedTopics.has(t));
      
      // not hiding under review and in progress papers
      // const publishedMatch = !isDefaultAllAll || card.dataset.published === 'true';
      // hiding under review and in progress papers
      const publishedMatch = card.dataset.published === 'true';

      const visible = typeMatch && topicMatch && publishedMatch;
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;

    // not hiding under review and in progress papers
    // if (status) {
    //   const total = cards.length;
    //   if (isDefaultAllAll) {
    //     status.textContent = `Showing published/accepted works only. Acceptance rates are provided when available.`;
    //   } else if (visibleCount === total) {
    //     // status.textContent = `Showing all ${total} publications. Acceptance rates are provided when available.`;
    //     status.textContent = `Acceptance rates are provided when available.`;
    //   } else {
    //     // status.textContent = `Showing ${visibleCount} of ${total} publications. Acceptance rates are provided when available.`;
    //     status.textContent = `Acceptance rates are provided when available.`;
    //   }
    // }

    // hiding under review and in progress papers
    if (status) {
      status.textContent = `Acceptance rates are provided when available.`;
      // const total = cards.length;
      // if (visibleCount === total) {
      //   status.textContent = `Showing all ${total} publications. Acceptance rates are provided when available.`;
      // } else {
      //   status.textContent = `Showing ${visibleCount} of ${total} publications. Acceptance rates are provided when available.`;
      // }
    }

    reorderAndNumber();
  }

  // Numbers only apply to publications with a confirmed year (data-year),
  // since under-review / in-preparation work doesn't have one yet.
  // Numbering restarts from 1 based on whatever is currently visible,
  // and the visible dated cards are physically reordered chronologically
  // so the numbers read top-to-bottom in the correct order.
  function reorderAndNumber() {
    const visibleDated = originalOrder.filter((c) => !c.hidden && c.dataset.year);
    visibleDated.sort((a, b) => {
      const ya = parseInt(a.dataset.year, 10);
      const yb = parseInt(b.dataset.year, 10);
      if (ya !== yb) return yb - ya;
      return originalOrder.indexOf(a) - originalOrder.indexOf(b);
    });

    const rest = originalOrder.filter((c) => !visibleDated.includes(c));
    const finalOrder = [...visibleDated, ...rest];

    finalOrder.forEach((card) => list.appendChild(card));

    visibleDated.forEach((card, i) => {
      const badge = card.querySelector('.pub-number');
      // if (badge) badge.textContent = (i + 1) + '.';
      // if (badge) badge.textContent = '#' + (i + 1);
      if (badge) badge.textContent = '#' + (visibleDated.length - i);
    });
    rest.forEach((card) => {
      const badge = card.querySelector('.pub-number');
      if (badge) badge.textContent = '';
    });
  }

  function handleTypeClick(btn) {
    selectedType = btn.dataset.filterValue;
    typeGroup.querySelectorAll('.filter-chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    applyFilters();
  }

  function handleTopicClick(btn) {
    const value = btn.dataset.filterValue;
    const allBtn = topicGroup.querySelector('[data-filter-value="all"]');

    if (value === 'all') {
      selectedTopics = new Set(['all']);
    } else {
      selectedTopics.delete('all');
      if (selectedTopics.has(value)) {
        selectedTopics.delete(value);
      } else {
        selectedTopics.add(value);
      }
      if (selectedTopics.size === 0) selectedTopics.add('all');
    }

    topicGroup.querySelectorAll('.filter-chip').forEach((b) => {
      const v = b.dataset.filterValue;
      b.setAttribute('aria-pressed', String(selectedTopics.has(v)));
    });
    if (allBtn) allBtn.setAttribute('aria-pressed', String(selectedTopics.has('all')));

    applyFilters();
  }

  if (typeGroup) {
    typeGroup.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => handleTypeClick(btn));
    });
  }
  if (topicGroup) {
    topicGroup.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => handleTopicClick(btn));
    });
  }

  applyFilters(); // initialize status text on load
})();

// Video Modal Controls
function openVideoModal(e) {
  e.preventDefault();
  document.getElementById('videoModal').style.display = 'flex';
}
function closeVideoModal() {
  document.getElementById('videoModal').style.display = 'none';
  // Stop the video by reloading the iframe
  const iframe = document.querySelector('#videoModal iframe');
  iframe.src = iframe.src;
}
document.getElementById('videoModal').onclick = function(e) {
  if (e.target === this) closeVideoModal();
}
