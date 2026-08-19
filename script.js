// =========================================================
// INPUT MODE DETECTION (Mouse vs Keyboard) — the site's signature demo
// Purely enhances what :focus-visible already does natively;
// nothing here is required for accessibility, it's a teaching layer.
// =========================================================
(function inputModeBadge() {
  const badge = document.getElementById('input-mode-badge');
  const label = document.getElementById('input-mode-label');
  if (!badge || !label) return;

  function setMode(mode) {
    document.body.classList.toggle('mode-keyboard', mode === 'keyboard');
    label.textContent = mode === 'keyboard' ? 'Input: Keyboard' : 'Input: Mouse';
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') setMode('keyboard');
  });
  window.addEventListener('mousedown', () => setMode('mouse'));
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') setMode('mouse');
  });

  setMode('mouse');
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
// CHART / TABLE TOGGLE (data always available as an accessible table;
// the "chart" view is a progressive enhancement, never the only source)
// =========================================================
(function chartTableToggle() {
  const wraps = document.querySelectorAll('[data-viz-toggle]');
  wraps.forEach((wrap) => {
    const chartBtn = wrap.querySelector('[data-view="chart"]');
    const tableBtn = wrap.querySelector('[data-view="table"]');
    const chart = wrap.querySelector('.bar-chart');
    const table = wrap.querySelector('table');
    if (!chartBtn || !tableBtn || !chart || !table) return;

    function show(view) {
      const showChart = view === 'chart';
      chart.hidden = !showChart;
      table.hidden = showChart;
      chartBtn.setAttribute('aria-pressed', String(showChart));
      tableBtn.setAttribute('aria-pressed', String(!showChart));
    }
    chartBtn.addEventListener('click', () => show('chart'));
    tableBtn.addEventListener('click', () => show('table'));
    show('table'); // default to the most robust, screen-reader-friendly view
  });
})();

// =========================================================
// CONTRAST / LOW-VISION CONDITION SIMULATOR
// Demonstrates a UI under different visual conditions for teaching purposes.
// =========================================================
(function contrastSimulator() {
  const group = document.querySelector('[data-sim-controls]');
  const frame = document.querySelector('.sim-frame');
  if (!group || !frame) return;

  const buttons = group.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      frame.className = 'sim-frame'; // reset
      const sim = btn.getAttribute('data-sim');
      if (sim !== 'none') frame.classList.add('sim-' + sim);
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    });
  });
})();

// =========================================================
// ACCESSIBLE ACCORDION (case study details)
// =========================================================
(function accordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panelId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
      const icon = trigger.querySelector('.icon');
      if (icon) icon.textContent = expanded ? '+' : '–';
    });
  });
})();

// =========================================================
// ACCESSIBLE CLIENT-SIDE FORM VALIDATION
// Errors are announced via a live region, associated to fields with
// aria-describedby, and focus moves to the first invalid field.
// =========================================================
(function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;
    const fields = form.querySelectorAll('[required]');

    fields.forEach((field) => {
      const wrap = field.closest('.field');
      const errorEl = wrap.querySelector('.error-text');
      const isValid = field.checkValidity() && field.value.trim() !== '';
      wrap.classList.toggle('error', !isValid);
      if (errorEl) errorEl.hidden = isValid;
      field.setAttribute('aria-invalid', String(!isValid));
      if (!isValid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      status.textContent = 'There is a problem with the form. Please review the highlighted field.';
      firstInvalid.focus();
    } else {
      status.textContent = 'Thanks — your message was captured in this demo (no data is actually sent).';
      form.reset();
    }
  });
})();

// =========================================================
// PUBLICATION FILTERS (type = single-select, topic = multi-select)
// A paper matches when its type matches the selected type (or "All")
// AND it has at least one of the selected topics (or "All" is selected).
// =========================================================
(function pubFilters() {
  const cards = document.querySelectorAll('.pub-card');
  if (!cards.length) return;

  const list = document.querySelector('.pub-list');
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
    //     status.textContent = `Showing all ${total} publications. Acceptance rates are provided when available.`;
    //   } else {
    //     status.textContent = `Showing ${visibleCount} of ${total} publications. Acceptance rates are provided when available.`;
    //   }
    // }

    // hiding under review and in progress papers
    if (status) {
      status.textContent = `Acceptance rates are provided when available.`;
    //   // const total = cards.length;
    //   // if (visibleCount === total) {
    //   //   status.textContent = `Showing all ${total} publications. Acceptance rates are provided when available.`;
    //   // } else {
    //   //   status.textContent = `Showing ${visibleCount} of ${total} publications. Acceptance rates are provided when available.`;
    //   // }
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
    { start: 2.07, end: 2.84 }, // SRA / sra
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