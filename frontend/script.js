/* ============================================
   SPEEDDL - COMPLETE JAVASCRIPT
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'http://YOUR_BACKEND_URL'; // Change this when backend is deployed


// ============================================
// DOM ELEMENTS
// ============================================
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


// ============================================
// THEME TOGGLE
// ============================================
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


// ============================================
// URL PARAM HANDLING (?tab=video)
// ============================================
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
    'viewer':   { type: 'Viewer',   placeholder: 'Paste Instagram profile URL here...' }
  };

  const config = tabMap[tab.toLowerCase()];
  if (!config) return;

  // Update placeholder
  if (urlInput) {
    urlInput.placeholder = config.placeholder;
    urlInput.focus();
  }

  // Highlight active category pill
  document.querySelectorAll('.cat-btn').forEach(btn => {
    const text = btn.textContent.trim().toLowerCase();
    if (text === tab.toLowerCase()) {
      btn.classList.add('active');
    }
  });

  // Scroll to input box
  setTimeout(() => {
    const inputBox = document.querySelector('.input-box');
    if (inputBox) {
      inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
})();


// ============================================
// PASTE BUTTON
// ============================================
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


// ============================================
// CLEAR BUTTON
// ============================================
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    status.textContent = '';
    clearBtn.classList.add('hidden');
    pasteBtn.classList.remove('hidden');
  });
}


// ============================================
// DOWNLOAD HANDLER (3-State Flow)
// ============================================
if (downloadBtn) {
  downloadBtn.addEventListener('click', handleDownload);
  urlInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleDownload();
  });
}

async function handleDownload() {
  const url = urlInput.value.trim();

  // Validation
  if (!url) {
    status.textContent = 'Please paste an Instagram link';
    return;
  }

  if (!url.includes('instagram.com')) {
    status.textContent = 'Please enter a valid Instagram URL';
    return;
  }

  // Switch to Loading state
  showLoading();

  // Demo mode if API not configured
  if (!API_URL || API_URL.includes('YOUR_BACKEND_URL')) {
    setTimeout(() => {
      showResult({
        success: true,
        title: 'Demo Mode - Backend not connected',
        medias: [
          { url: '#', quality: '1080p HD', type: 'video', ext: 'mp4' },
          { url: '#', quality: '720p HD',  type: 'video', ext: 'mp4' },
          { url: '#', quality: 'Original', type: 'image', ext: 'jpg' }
        ]
      });
    }, 2000);
    return;
  }

  // Real API call
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


// ============================================
// STATE: LOADING
// ============================================
function showLoading() {
  // Hide home content
  if (homeContent) homeContent.classList.add('hidden');

  // Hide result, show loading
  if (resultsSection) resultsSection.classList.add('hidden');
  if (loadingSection) loadingSection.classList.remove('hidden');

  // Update input box state
  downloadBtn.disabled = true;
  if (pasteBtn) pasteBtn.classList.add('hidden');
  if (clearBtn) clearBtn.classList.remove('hidden');
  status.textContent = '';

  // Update loading text based on URL type
  const url = urlInput.value.toLowerCase();
  let mediaType = 'media';
  if (url.includes('/reel/') || url.includes('/reels/')) mediaType = 'reel';
  else if (url.includes('/p/')) mediaType = 'post';
  else if (url.includes('/tv/')) mediaType = 'IGTV video';
  else if (url.includes('/stories/')) mediaType = 'story';

  if (loadingText) {
    loadingText.textContent = `We are downloading the ${mediaType}. Please wait :)`;
  }

  // Scroll to loading
  setTimeout(() => {
    if (loadingSection) {
      loadingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}


// ============================================
// STATE: RESULT
// ============================================
function showResult(data) {
  // Hide loading
  if (loadingSection) loadingSection.classList.add('hidden');

  // Build result HTML
  const medias = data.medias || [];
  let html = '';

  medias.forEach((media, index) => {
    const isVideo = media.type === 'video';
    const downloadUrl = media.url;
    const quality = media.quality || 'Original';

    html += `
      <div class="result-card" style="${index > 0 ? 'margin-top: 20px;' : ''}">
        ${isVideo && media.thumbnail
          ? `<img src="${media.thumbnail}" alt="Preview" class="result-preview" loading="lazy">`
          : isVideo
            ? `<video src="${downloadUrl}" controls class="result-preview" preload="metadata"></video>`
            : `<img src="${downloadUrl}" alt="Preview" class="result-preview" loading="lazy">`
        }
        <div class="result-actions">
          <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" download class="result-download-btn">
            Download${medias.length > 1 ? ` Option ${index + 1}` : ''} - ${quality}
          </a>
        </div>
        ${data.title ? `<div class="result-caption">${escapeHtml(data.title)}</div>` : ''}
        ${data.username ? `<div class="result-caption">@${escapeHtml(data.username)}</div>` : ''}
      </div>
    `;
  });

  if (resultContent) resultContent.innerHTML = html;

  // Show result
  if (resultsSection) resultsSection.classList.remove('hidden');

  // Reset button states
  downloadBtn.disabled = false;

  // Scroll to result
  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}


// ============================================
// STATE: ERROR
// ============================================
function showError(message) {
  // Hide loading
  if (loadingSection) loadingSection.classList.add('hidden');

  // Show home content back
  if (homeContent) homeContent.classList.remove('hidden');

  // Show error
  status.textContent = 'Error: ' + message;
  downloadBtn.disabled = false;

  // Scroll to input
  const inputBox = document.querySelector('.input-box');
  if (inputBox) {
    inputBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}


// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// ============================================
// LAZY LOADING (Auto-apply for supported browsers)
// ============================================
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


// ============================================
// SET CURRENT YEAR IN FOOTER
// ============================================
(function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
