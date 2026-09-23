/* ============================================
   SPEEDDL - COMPLETE JAVASCRIPT
   ============================================ */

const API_URL = 'https://surgeon-folding-biz-lancaster.trycloudflare.com';

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

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    status.textContent = '';
    clearBtn.classList.add('hidden');
    pasteBtn.classList.remove('hidden');
  });
}

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

// SMART RESULT RENDERER
function showResult(data) {
  if (loadingSection) loadingSection.classList.add('hidden');

  const medias = data.medias || [];
  let html = '';

  // Check karo kya ye Highlights hain
  const isHighlights = medias.some(m => m.quality && m.quality.startsWith('Highlight:'));

  if (isHighlights) {
    // FastDL Style Circular Highlights Tray
    html += `
      <div style="text-align:center; margin-bottom:16px;">
        <h3 style="font-size:1.1rem; color:var(--text); margin-bottom:4px;">${escapeHtml(data.title || '')}</h3>
        <p style="font-size:0.85rem; color:#0284c7; font-weight:600;">@${escapeHtml(data.username || '')}</p>
      </div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; max-width:400px; margin:0 auto 20px;">
    `;

    medias.forEach((media, idx) => {
      const title = media.quality.replace('Highlight:', '').trim();
      html += `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px 4px; text-align:center;">
          <img src="${media.thumbnail}" alt="Cover" style="width:65px; height:65px; border-radius:50%; object-fit:cover; border:2px solid #0284c7; margin-bottom:6px; display:inline-block;">
          <p style="font-size:0.75rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:6px; color:var(--text);">${escapeHtml(title)}</p>
          <a href="${media.url}" download class="result-download-btn" style="padding:4px 8px; font-size:0.68rem; border-radius:6px; display:inline-block;">Download</a>
        </div>
      `;
    });

    html += `</div>`;

  } else {
    // Standard Reels / Photos / Videos / Carousel Cards
    medias.forEach((media, index) => {
      const isVideo = media.type === 'video';
      const downloadUrl = media.url;
      const quality = media.quality || 'Original';

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
  }

  if (resultContent) resultContent.innerHTML = html;
  if (resultsSection) resultsSection.classList.remove('hidden');

  downloadBtn.disabled = false;

  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

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
