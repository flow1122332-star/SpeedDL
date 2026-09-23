/* ============================================
   SPEEDDL - COMPLETE JAVASCRIPT (WITH POPUP TOAST)
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

// Floating Popup Toast Notification Function
function showDownloadToast(text = '✅ Download Started! Check your notification bar.') {
  let toast = document.getElementById('speeddl-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'speeddl-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 30px;
      font-size: 0.88rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = text;
  toast.style.opacity = '1';
  toast.style.bottom = '30px';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.bottom = '20px';
  }, 3500);
}

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

// RESULT RENDERER (WITH DOWNLOAD POPUP TOAST)
function showResult(data) {
  if (loadingSection) loadingSection.classList.add('hidden');

  const medias = data.medias || [];
  let html = '';

  const isProfileMode = Boolean(data.username);

  if (isProfileMode) {
    html += `<div style="text-align:center; font-size:1.05rem; font-weight:600; color:var(--text, #1e293b); margin-bottom:18px;">Search result</div>`;

    const avatarUrl = data.avatar || (medias.find(m => m.thumbnail)?.thumbnail) || '';
    const fullName = data.fullName || (data.title ? data.title.split('•')[0].trim() : data.username);

    html += `
      <div style="display:flex; align-items:center; justify-content:center; gap:20px; max-width:440px; margin:0 auto 20px;">
        <div style="position:relative; width:84px; height:84px; flex-shrink:0;">
          <img src="${avatarUrl}" alt="Avatar" style="width:84px; height:84px; border-radius:50%; object-fit:cover; border:3px solid #38bdf8; display:block;">
          <div style="position:absolute; bottom:2px; right:2px; background:#0284c7; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; border:2px solid #fff;">⛶</div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:1.15rem; font-weight:700; color:var(--text, #0f172a); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            <span>@${escapeHtml(data.username)}</span>
            <a href="https://www.instagram.com/${escapeHtml(data.username)}/" target="_blank" style="color:#0284c7; text-decoration:none; font-size:0.9rem;">↗</a>
          </div>
          <div style="font-size:0.92rem; font-weight:600; color:#64748b;">${escapeHtml(fullName)}</div>
        </div>
      </div>
    `;

    html += `
      <div style="display:flex; border-bottom:1px solid rgba(0,0,0,0.1); max-width:520px; margin:0 auto 18px;">
        <div style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase;">POSTS</div>
        <div style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase;">STORIES</div>
        <div style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#0284c7; border-bottom:2px solid #0284c7; text-transform:uppercase;">HIGHLIGHTS</div>
        <div style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase;">REELS</div>
      </div>
    `;

    html += `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; max-width:520px; margin:0 auto 30px;">`;

    medias.forEach((media, idx) => {
      const isVideo = media.type === 'video';
      const downloadUrl = media.url;
      const previewImg = media.thumbnail || downloadUrl;
      const title = media.quality ? media.quality.replace('Highlight:', '').trim() : `Item ${idx + 1}`;

      html += `
        <div style="background:var(--card-bg, #ffffff); border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); display:flex; flex-direction:column;">
          <div style="position:relative; width:100%; aspect-ratio:4/5; background:#000;">
            <img src="${previewImg}" alt="Preview" style="width:100%; height:100%; object-fit:contain; background:#0b0f19; display:block;">
            <div style="position:absolute; top:8px; right:8px; display:flex; gap:6px; color:white; font-size:0.85rem; text-shadow:0 1px 3px rgba(0,0,0,0.8);">
              ${isVideo ? '<span>▶</span>' : ''}
              <span>⛶</span>
            </div>
          </div>
          <div style="padding:10px; display:flex; flex-direction:column; flex:1; justify-content:space-between;">
            <div style="font-size:0.82rem; font-weight:600; color:var(--text, #1e293b); margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(title)}</div>
            <a href="${downloadUrl}" download onclick="showDownloadToast('✅ Download Started! Check your notifications.')" class="result-download-btn" style="background:#0284c7; color:white; padding:8px; border-radius:8px; font-size:0.82rem; font-weight:700; text-align:center; text-decoration:none; display:block;">
              Download
            </a>
          </div>
        </div>
      `;
    });

    html += `</div>`;

  } else {
    medias.forEach((media, index) => {
      const isVideo = media.type === 'video';
      const downloadUrl = media.url;
      const quality = media.quality || 'HD Video';

      const mediaElement = isVideo
        ? `<video src="${downloadUrl}" poster="${media.thumbnail || ''}" controls playsinline preload="metadata" class="result-preview" style="width:100%; max-width:360px; aspect-ratio:9/16; border-radius:14px; background:#000; margin:0 auto; display:block; object-fit:contain;"></video>`
        : `<img src="${downloadUrl}" alt="Preview" class="result-preview" loading="lazy" style="width:100%; max-width:400px; max-height:500px; border-radius:14px; object-fit:contain; background:#0c0f17; margin:0 auto; display:block;">`;

      html += `
        <div class="result-card" style="${index > 0 ? 'margin-top: 24px;' : ''}; max-width:460px; margin-left:auto; margin-right:auto;">
          ${mediaElement}
          <div class="result-actions" style="margin-top: 14px;">
            <a href="${downloadUrl}" download onclick="showDownloadToast('✅ Download Started! File is saving to your phone...')" class="result-download-btn" style="display:block; text-align:center; background:#0284c7; color:white; padding:12px; border-radius:10px; font-weight:700; text-decoration:none; font-size:0.95rem;">
              Download${medias.length > 1 ? ` (Item ${index + 1})` : ''} - ${quality}
            </a>
          </div>
          ${data.title ? `<div class="result-caption" style="margin-top: 10px; font-weight:600; font-size:0.88rem; text-align:center;">${escapeHtml(data.title)}</div>` : ''}
          ${data.username ? `<div class="result-caption" style="color:#0284c7; font-size:0.85rem; text-align:center;">@${escapeHtml(data.username)}</div>` : ''}
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
