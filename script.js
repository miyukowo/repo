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

// Permission usage description key → human-readable label + emoji
const PERMISSION_LABELS = {
  NSCameraUsageDescription: { icon: '📷', label: 'Camera' },
  NSMicrophoneUsageDescription: { icon: '🎤', label: 'Microphone' },
  NSPhotoLibraryUsageDescription: { icon: '🖼️', label: 'Photo Library' },
  NSContactsUsageDescription: { icon: '👥', label: 'Contacts' },
  NSLocationWhenInUseUsageDescription: { icon: '📍', label: 'Location' },
  NSLocationAlwaysUsageDescription: { icon: '📍', label: 'Location (Always)' },
  NSBluetoothPeripheralUsageDescription: { icon: '📡', label: 'Bluetooth' },
  NSBluetoothAlwaysUsageDescription: { icon: '📡', label: 'Bluetooth' },
  NSLocalNetworkUsageDescription: { icon: '🌐', label: 'Local Network' },
  NSAppleMusicUsageDescription: { icon: '🎵', label: 'Apple Music' },
  NSUserTrackingUsageDescription: { icon: '🔎', label: 'Tracking' },
  NSSpeechRecognitionUsageDescription: { icon: '🗣️', label: 'Speech Recognition' },
  NSCalendarsUsageDescription: { icon: '📅', label: 'Calendars' },
  NSRemindersUsageDescription: { icon: '📝', label: 'Reminders' },
  NSMotionUsageDescription: { icon: '🏃', label: 'Motion & Fitness' },
  NSFaceIDUsageDescription: { icon: '🔐', label: 'Face ID' },
  NSSiriUsageDescription: { icon: '🗣️', label: 'Siri' },
  NSPhotoLibraryAddUsageDescription: { icon: '🖼️', label: 'Photo Library (Add)' },
  NSHealthShareUsageDescription: { icon: '❤️', label: 'Health' },
};

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

  // Permissions & Privacy
  renderPermissions(app);

  // Versions / Changelog — paginated
  renderVersionsPaginated(app);

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

// ===== Permissions Rendering =====
function renderPermissions(app) {
  const permsSection = document.getElementById('modal-permissions-section');
  const permsContainer = document.getElementById('modal-permissions');
  const entsSection = document.getElementById('modal-entitlements-section');
  const entsContainer = document.getElementById('modal-entitlements');
  const entsToggle = document.getElementById('entitlements-toggle');

  const perms = app.appPermissions;
  if (!perms) {
    permsSection.style.display = 'none';
    entsSection.style.display = 'none';
    return;
  }

  // Privacy descriptions
  if (perms.privacy && Object.keys(perms.privacy).length > 0) {
    permsSection.style.display = 'block';
    permsContainer.innerHTML = Object.entries(perms.privacy).map(([key, desc]) => {
      const info = PERMISSION_LABELS[key] || { icon: '🔒', label: key.replace(/^NS|UsageDescription$/g, '').replace(/([A-Z])/g, ' $1').trim() };
      return `
        <div class="permission-item">
          <span class="permission-icon">${info.icon}</span>
          <div class="permission-info">
            <div class="permission-label">${info.label}</div>
            <div class="permission-desc">${desc}</div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    permsSection.style.display = 'none';
  }

  // Entitlements
  if (perms.entitlements && perms.entitlements.length > 0) {
    entsSection.style.display = 'block';
    entsContainer.style.display = 'none';
    entsToggle.textContent = 'Show';
    entsContainer.innerHTML = perms.entitlements.map(ent => {
      const shortName = ent.split('.').pop();
      return `<span class="entitlement-chip" title="${ent}">${shortName}</span>`;
    }).join('');

    entsToggle.onclick = () => {
      const isHidden = entsContainer.style.display === 'none';
      entsContainer.style.display = isHidden ? 'flex' : 'none';
      entsToggle.textContent = isHidden ? 'Hide' : 'Show';
    };
  } else {
    entsSection.style.display = 'none';
  }
}

// ===== Paginated Version History =====
const VERSIONS_PER_PAGE = 3;
let currentVersionCount = VERSIONS_PER_PAGE;

function renderVersionsPaginated(app) {
  const container = document.getElementById('modal-versions');
  const wrapper = document.getElementById('version-toggle-wrapper');
  const moreBtn = document.getElementById('version-more-btn');
  const lessBtn = document.getElementById('version-less-btn');
  const versions = app.versions || [];

  currentVersionCount = VERSIONS_PER_PAGE;

  function render() {
    const visible = versions.slice(0, currentVersionCount);
    container.innerHTML = visible.map((v, i) => `
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

    // Show/hide buttons
    if (versions.length > VERSIONS_PER_PAGE) {
      wrapper.style.display = 'flex';
      moreBtn.style.display = currentVersionCount < versions.length ? 'inline-flex' : 'none';
      lessBtn.style.display = currentVersionCount > VERSIONS_PER_PAGE ? 'inline-flex' : 'none';
    } else {
      wrapper.style.display = 'none';
    }
  }

  moreBtn.onclick = () => {
    currentVersionCount = Math.min(currentVersionCount + VERSIONS_PER_PAGE, versions.length);
    render();
  };

  lessBtn.onclick = () => {
    currentVersionCount = VERSIONS_PER_PAGE;
    render();
    // Scroll version section into view
    document.getElementById('modal-versions').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  render();
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

// ===== News Rendering =====
function renderNews(newsItems, filter = 'all') {
  const grid = document.getElementById('news-grid');
  if (!newsItems || newsItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <div class="empty-state-icon">📰</div>
        <div class="empty-state-text">No news yet.</div>
      </div>`;
    return;
  }

  let filtered = newsItems;
  if (filter !== 'all') {
    filtered = newsItems.filter(n => {
      if (n._filterGroup) return n._filterGroup === filter;
      return false;
    });
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('news-count').textContent = `(${filtered.length})`;

  grid.innerHTML = filtered.map(news => {
    const tintColor = news.tintColor ? `#${news.tintColor.replace('#', '')}` : '#a855f7';
    const appIcon = news._appIcon || '';
    const appName = news._appName || '';
    return `
      <div class="news-card liquid-glass"${news.url ? ` onclick="window.open('${news.url}', '_blank')"` : ''} style="cursor:${news.url ? 'pointer' : 'default'}">
        ${news.imageURL ? `<div class="news-image"><img src="${news.imageURL}" alt="${news.title}" loading="lazy"></div>` : ''}
        <div class="news-card-body">
          <div class="news-card-meta">
            ${appIcon ? `<img src="${appIcon}" alt="${appName}" class="news-app-icon">` : ''}
            <span class="news-app-name">${appName}</span>
            <span class="news-date">${formatDate(news.date)}</span>
          </div>
          <div class="news-title">${news.title}</div>
          ${news.caption ? `<div class="news-caption">${news.caption}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function setupNewsFilters(newsItems) {
  const filtersContainer = document.getElementById('news-filters');
  if (!newsItems || newsItems.length === 0) return;

  // Extract unique filter groups
  const groups = new Map();
  newsItems.forEach(n => {
    if (n._filterGroup && !groups.has(n._filterGroup)) {
      groups.set(n._filterGroup, n._appName || n._filterGroup);
    }
  });

  // Build filter buttons
  let html = '<button class="news-filter-btn active" data-filter="all">All</button>';
  groups.forEach((label, key) => {
    html += `<button class="news-filter-btn" data-filter="${key}">${label}</button>`;
  });
  filtersContainer.innerHTML = html;

  // Click handlers
  filtersContainer.querySelectorAll('.news-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersContainer.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderNews(newsItems, btn.dataset.filter);
    });
  });
}

// ===== Nav Section Toggle =====
function setupNavSections() {
  document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.nav;

      // Update active state
      document.querySelectorAll('.nav-link[data-nav]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Toggle sections
      document.getElementById('apps').style.display = target === 'apps' ? '' : 'none';
      const heroSection = document.querySelector('.hero');
      if (heroSection) heroSection.style.display = target === 'apps' ? '' : 'none';
      const newsSection = document.getElementById('news');
      if (newsSection) newsSection.style.display = target === 'news' ? '' : 'none';

      // Scroll to top of section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ===== Initialize =====
async function init() {
  // Theme MUST be initialized before anything else to prevent flash
  initTheme();
  initNavScroll();
  renderSideloadButtons();
  setupNavSections();

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

    // News
    if (sourceData.news && sourceData.news.length > 0) {
      // Enrich news items with app info for filtering
      const enrichedNews = sourceData.news.map(item => {
        const linkedApp = item.appID ? sourceData.apps.find(a => a.bundleIdentifier === item.appID) : null;
        return {
          ...item,
          _appName: linkedApp ? linkedApp.name : (item.appID || 'General'),
          _appIcon: linkedApp ? linkedApp.iconURL : '',
          _filterGroup: linkedApp ? linkedApp.name : (item.appID || 'General')
        };
      });

      document.getElementById('nav-news-link').style.display = '';
      document.getElementById('news').style.display = 'none'; // hidden until clicked
      setupNewsFilters(enrichedNews);
      renderNews(enrichedNews);
    }
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
