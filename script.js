// ===== Configuration =====
const CONFIG = {
  sourceURL: 'apps.json',
  get publicSourceURL() {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    return `${base}/apps.json`;
  }
};

// ===== Theme Management =====
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  return localStorage.getItem('theme');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
  const stored = getStoredTheme();
  const theme = stored || getSystemTheme();
  applyTheme(theme);

  // Listen for system theme changes (only when no manual override)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
  showToast(`Switched to ${next} mode`);
}

// ===== Sideloading URL Schemes =====
function getSideloadLinks(sourceURL) {
  const encoded = encodeURIComponent(sourceURL);
  return [
    {
      name: 'AltStore',
      url: `altstore://source?url=${encoded}`,
      logo: 'img/altstore.png',
      className: 'altstore'
    },
    {
      name: 'SideStore',
      url: `sidestore://source?url=${encoded}`,
      logo: 'img/sidestore.png',
      className: 'sidestore'
    },
    {
      name: 'Feather',
      url: `feather://source/${sourceURL}`,
      logo: 'img/feather.png',
      className: 'feather'
    }
  ];
}

// ===== Utility Functions =====
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getAppColor(app) {
  return app.tintColor ? `#${app.tintColor.replace('#', '')}` : '#a855f7';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Rendering =====
function renderSideloadButtons() {
  const grid = document.getElementById('sideload-grid');
  const links = getSideloadLinks(CONFIG.publicSourceURL);

  grid.innerHTML = links.map(link => `
    <a href="${link.url}" class="sideload-btn liquid-glass ${link.className}" title="Open in ${link.name}">
      <span class="btn-icon"><img src="${link.logo}" alt="${link.name}"></span>
      <span>Open in ${link.name}</span>
    </a>
  `).join('');
}

function renderAppCard(app) {
  const color = getAppColor(app);
  const latestVersion = app.versions && app.versions[0];
  const size = latestVersion ? formatBytes(latestVersion.size) : '';
  const version = latestVersion ? latestVersion.version : '';
  const date = latestVersion && latestVersion.date ? formatDate(latestVersion.date) : '';

  const iconHTML = app.iconURL
    ? `<img src="${app.iconURL}" alt="${app.name}" class="app-icon" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="app-icon-placeholder" style="background:${color};display:none">${app.name.charAt(0)}</div>`
    : `<div class="app-icon-placeholder" style="background:${color}">${app.name.charAt(0)}</div>`;

  const metaText = [size, date].filter(Boolean).join(' | ');

  return `
    <div class="app-card liquid-glass" data-bundle="${app.bundleIdentifier}" onclick="openAppDetail('${app.bundleIdentifier}')">
      <div class="app-card-header">
        ${iconHTML}
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="app-developer">${app.developerName}</div>
          ${version ? `<span class="app-version-badge">v${version}</span>` : ''}
        </div>
      </div>
      <div class="app-subtitle">${app.subtitle || app.localizedDescription?.substring(0, 100) || ''}</div>
      <div class="app-card-footer">
        <span class="app-meta"><span class="app-size">${size}</span>${date ? `<span class="app-date"> | ${date}</span>` : ''}</span>
        <button class="app-get-btn" style="background:${color}" onclick="event.stopPropagation();openAppDetail('${app.bundleIdentifier}')">GET</button>
      </div>
    </div>
  `;
}

function renderApps(apps) {
  const grid = document.getElementById('apps-grid');
  const count = document.getElementById('apps-count');

  if (!apps || apps.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-icon">📱</div>
        <div class="empty-state-text">No apps found</div>
      </div>`;
    count.textContent = '0 apps';
    return;
  }

  count.textContent = `${apps.length} app${apps.length !== 1 ? 's' : ''}`;
  grid.innerHTML = apps.map(renderAppCard).join('');

  // Stagger animation
  const cards = grid.querySelectorAll('.app-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.08}s`;
  });
}

// ===== App Detail Modal =====
let sourceData = null;

function openAppDetail(bundleId) {
  if (!sourceData) return;
  const app = sourceData.apps.find(a => a.bundleIdentifier === bundleId);
  if (!app) return;

  const overlay = document.getElementById('modal-overlay');
  const color = getAppColor(app);
  const latestVersion = app.versions && app.versions[0];

  // Icon
  const iconEl = document.getElementById('modal-app-icon');
  const iconPlaceholder = document.getElementById('modal-app-icon-placeholder');
  if (app.iconURL) {
    iconEl.src = app.iconURL;
    iconEl.alt = app.name;
    iconEl.style.display = 'block';
    iconPlaceholder.style.display = 'none';
    iconEl.onerror = () => {
      iconEl.style.display = 'none';
      iconPlaceholder.style.display = 'flex';
      iconPlaceholder.textContent = app.name.charAt(0);
      iconPlaceholder.style.background = color;
    };
  } else {
    iconEl.style.display = 'none';
    iconPlaceholder.style.display = 'flex';
    iconPlaceholder.textContent = app.name.charAt(0);
    iconPlaceholder.style.background = color;
  }

  document.getElementById('modal-app-name').textContent = app.name;
  document.getElementById('modal-app-developer').textContent = app.developerName;
  document.getElementById('modal-app-version').textContent =
    latestVersion ? `Version ${latestVersion.version} • ${formatBytes(latestVersion.size)}` : '';

  // Description
  document.getElementById('modal-description').textContent = app.localizedDescription || '';

  // Screenshots
  const screenshotsSection = document.getElementById('modal-screenshots-section');
  const screenshotsScroll = document.getElementById('modal-screenshots');
  if (app.screenshotURLs && app.screenshotURLs.length > 0) {
    screenshotsSection.style.display = 'block';
    screenshotsScroll.innerHTML = app.screenshotURLs.map(url =>
      `<img src="${url}" alt="Screenshot" class="screenshot-img" loading="lazy">`
    ).join('');
  } else {
    screenshotsSection.style.display = 'none';
  }

  // Versions / Changelog
  const versionsContainer = document.getElementById('modal-versions');
  if (app.versions && app.versions.length > 0) {
    versionsContainer.innerHTML = app.versions.map((v, i) => `
      <div class="version-item">
        <div class="version-item-header">
          <span class="version-number">v${v.version}${i === 0 ? ' (Latest)' : ''}</span>
          <span class="version-date">${formatDate(v.date)}</span>
        </div>
        ${v.localizedDescription ? `<div class="version-desc">${v.localizedDescription}</div>` : ''}
        <div class="version-meta">
          <span>${formatBytes(v.size)}</span>
          ${v.minOSVersion ? `<span>iOS ${v.minOSVersion}+</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Download button
  const downloadBtn = document.getElementById('modal-download-btn');
  if (latestVersion && latestVersion.downloadURL) {
    downloadBtn.href = latestVersion.downloadURL;
    downloadBtn.style.display = 'flex';
  } else {
    downloadBtn.style.display = 'none';
  }

  // Show modal
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== Copy Source URL =====
function copySourceURL() {
  const url = CONFIG.publicSourceURL;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copied!';
    showToast('Source URL copied to clipboard');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '📋 Copy Source URL';
    }, 2000);
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Source URL copied to clipboard');
  });
}

// ===== Search =====
function handleSearch(query) {
  if (!sourceData || !sourceData.apps) return;
  const q = query.toLowerCase().trim();

  if (!q) {
    renderApps(sourceData.apps);
    return;
  }

  const filtered = sourceData.apps.filter(app =>
    app.name.toLowerCase().includes(q) ||
    app.developerName.toLowerCase().includes(q) ||
    (app.subtitle && app.subtitle.toLowerCase().includes(q)) ||
    (app.localizedDescription && app.localizedDescription.toLowerCase().includes(q))
  );
  renderApps(filtered);
}

// ===== Nav Scroll Effect =====
function initNavScroll() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ===== Initialize =====
async function init() {
  // Theme MUST be initialized before anything else to prevent flash
  initTheme();
  initNavScroll();
  renderSideloadButtons();

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Copy button
  document.getElementById('copy-btn').addEventListener('click', copySourceURL);

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  // Modal close
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Fetch apps
  try {
    const response = await fetch(CONFIG.sourceURL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Validate we got JSON, not an HTML fallback page
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON. Check that apps.json is deployed correctly.');
    }
    sourceData = JSON.parse(text);

    // Update page content from JSON
    if (sourceData.name) {
      document.getElementById('hero-title').textContent = sourceData.name;
      document.getElementById('nav-brand-name').textContent = sourceData.name;
      document.title = sourceData.name;
    }
    if (sourceData.description || sourceData.subtitle) {
      document.getElementById('hero-subtitle').textContent =
        sourceData.description || sourceData.subtitle;
    }

    renderApps(sourceData.apps);
  } catch (error) {
    console.error('Failed to load apps:', error);
    document.getElementById('apps-grid').innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Failed to load apps. Make sure apps.json is accessible.</div>
      </div>`;
  }
}

// Init theme immediately (before DOMContentLoaded) to prevent flash
initTheme();
document.addEventListener('DOMContentLoaded', init);
