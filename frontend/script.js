/* ============================================
   SPEEDDL - COMPLETE JAVASCRIPT
   ============================================ */

const API_URL = 'https://scrapenest-backend.onrender.com';

const themeToggle = document.getElementById('themeToggle');
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const loadingSection = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const resultsSection = document.getElementById('results');
const resultContent = document.getElementById('resultContent');
const homeContent = document.getElementById('homeContent');

// THEME TOGGLE
(function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// URL PARAM HANDLING (?tab=video)
(function handleTabParameter() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (!tab) return;

  const tabMap = {
    'video':    { type: 'Video',    placeholder: 'Paste Instagram video link here...' },
    'photo':    { type: 'Photo',    placeholder: 'Paste Instagram photo link here...' },
    'reels':    { type: 'Reels',    placeholder: 'Paste Instagram Reels link here...' },
    'story':    { type: 'Story',    placeholder: 'Paste Instagram Story link here...' },
    'igtv':     { type: 'IGTV',     placeholder: 'Paste Instagram IGTV link here...' },
    'carousel': { type: 'Carousel', placeholder: 'Paste Instagram carousel link here...' },
    'viewer':   { type: 'Viewer',   placeholder: 'Paste Instagram profile URL or @username here...' }
  };

  const config = tabMap[tab.toLowerCase()];
  if (!config) return;

  if (urlInput) {
    urlInput.placeholder = config.placeholder;
    urlInput.focus();
  }

  document.querySelectorAll('.cat-btn').forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if (text === tab.toLowerCase()) {
      btn.classList.add('active');
    }
  });

  setTimeout(() => {
    const inputBox = document.querySelector('.input-box');
    if (inputBox) {
      inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
})();

// PASTE BUTTON
if (pasteBtn) {
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        urlInput.focus();
      }
    } catch (err) {
      alert('Please paste manually (clipboard access denied)');
    }
  });
}

// CLEAR BUTTON
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    status.textContent = '';
    clearBtn.classList.add('hidden');
    pasteBtn.classList.remove('hidden');
  });
}

// DOWNLOAD HANDLER
if (downloadBtn) {
  downloadBtn.addEventListener('click', handleDownload);
  urlInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleDownload();
  });
}

async function handleDownload() {
  const url = urlInput.value.trim();

  if (!url) {
    status.textContent = 'Please paste an Instagram link or username';
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${API_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch media');
    }

    if (!data.medias || data.medias.length === 0) {
      throw new Error('No media found');
    }

    showResult(data);

  } catch (err) {
    showError(err.message);
  }
}

// STATE: LOADING
function showLoading() {
  if (homeContent) homeContent.classList.add('hidden');
  if (resultsSection) resultsSection.classList.add('hidden');
  if (loadingSection) loadingSection.classList.remove('hidden');

  downloadBtn.disabled = true;
  if (pasteBtn) pasteBtn.classList.add('hidden');
  if (clearBtn) clearBtn.classList.remove('hidden');
  status.textContent = '';

  const url = urlInput.value.toLowerCase();
  let mediaType = 'media';
  if (url.includes('/reel/') || url.includes('/reels/')) mediaType = 'Reel';
  else if (url.includes('/p/')) mediaType = 'Post / Photo';
  else if (url.includes('/tv/')) mediaType = 'IGTV Video';
  else if (url.includes('/stories/')) mediaType = 'Story';
  else mediaType = 'Profile / Stories';

  if (loadingText) {
    loadingText.textContent = `We are fetching the ${mediaType}. Please wait :)`;
  }

  setTimeout(() => {
    if (loadingSection) {
      loadingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// STATE: RESULT (With Real Video Player + Sound Controls)
function showResult(data) {
  if (loadingSection) loadingSection.classList.add('hidden');

  const medias = data.medias || [];
  let html = '';

  medias.forEach((media, index) => {
    const isVideo = media.type === 'video';
    const downloadUrl = media.url;
    const quality = media.quality || 'Original';

    // Real video player with sound controls for videos
    const mediaElement = isVideo
      ? `<video src="${downloadUrl}" poster="${media.thumbnail || ''}" controls playsinline preload="metadata" class="result-preview" style="width:100%; border-radius:12px; background:#000; max-height:450px;"></video>`
      : `<img src="${downloadUrl}" alt="Preview" class="result-preview" loading="lazy" style="width:100%; border-radius:12px; object-fit:cover; max-height:450px;">`;

    html += `
      <div class="result-card" style="${index > 0 ? 'margin-top: 24px;' : ''}">
        ${mediaElement}
        <div class="result-actions" style="margin-top: 12px;">
          <a href="${downloadUrl}" download class="result-download-btn" style="display:block; text-align:center;">
            Download${medias.length > 1 ? ` (Item ${index + 1})` : ''} - ${quality}
          </a>
        </div>
        ${data.title ? `<div class="result-caption" style="margin-top: 8px; font-weight:600;">${escapeHtml(data.title)}</div>` : ''}
        ${data.username ? `<div class="result-caption" style="color:#0284c7;">@${escapeHtml(data.username)}</div>` : ''}
      </div>
    `;
  });

  if (resultContent) resultContent.innerHTML = html;
  if (resultsSection) resultsSection.classList.remove('hidden');

  downloadBtn.disabled = false;

  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// STATE: ERROR
function showError(message) {
  if (loadingSection) loadingSection.classList.add('hidden');
  if (homeContent) homeContent.classList.remove('hidden');

  status.textContent = 'Error: ' + message;
  downloadBtn.disabled = false;

  const inputBox = document.querySelector('.input-box');
  if (inputBox) {
    inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

(function initLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img:not([loading])').forEach(img => {
      if (!img.closest('header') && !img.classList.contains('hero-logo')) {
        img.loading = 'lazy';
        img.decoding = 'async';
      }
    });
  }
})();

(function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
