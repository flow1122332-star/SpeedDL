/* ============================================
   SPEEDDL - SCRIPT.JS (PART 1 OF 2)
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

let globalProfileData = null;

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

    if (!data.medias && !data.isProfile) {
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

/* ============================================
   SPEEDDL - SCRIPT.JS (PART 2 OF 2)
   ============================================ */

function showResult(data) {
  if (loadingSection) loadingSection.classList.add('hidden');

  if (data.isProfile) {
    globalProfileData = data;
    renderProfileView(data);
  } else {
    renderMediaView(data);
  }

  if (resultsSection) resultsSection.classList.remove('hidden');
  downloadBtn.disabled = false;

  setTimeout(() => {
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

function renderProfileView(data) {
  const postsCount = (data.posts || []).length;
  const storiesCount = (data.stories || []).length;
  const highlightsCount = (data.highlights || []).length;
  const reelsCount = (data.reels || []).length;

  let html = `
    <div style="max-width:540px; margin:0 auto 20px;">
      <!-- Profile Header -->
      <div style="display:flex; align-items:flex-start; gap:18px; margin-bottom:14px; text-align:left;">
        <div style="position:relative; width:82px; height:82px; flex-shrink:0;">
          <img src="${data.avatar}" alt="Avatar" style="width:82px; height:82px; border-radius:50%; object-fit:cover; border:3px solid #38bdf8; display:block; background:#1e293b;">
          <div style="position:absolute; bottom:0; right:0; background:#0284c7; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; border:2px solid #fff;">⛶</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:1.1rem; font-weight:700; color:var(--text, #0f172a); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
            <span>@${escapeHtml(data.username)}</span>
            <a href="https://www.instagram.com/${escapeHtml(data.username)}/" target="_blank" style="color:#0284c7; text-decoration:none; font-size:0.9rem;">↗</a>
          </div>
          <!-- Stats Row -->
          <div style="display:flex; gap:18px; margin-bottom:8px; font-size:0.85rem; color:#64748b;">
            <div><b style="color:var(--text, #0f172a); font-size:0.95rem;">${escapeHtml(data.postsCount || '0')}</b> posts</div>
            <div><b style="color:var(--text, #0f172a); font-size:0.95rem;">${escapeHtml(data.followers || '0')}</b> followers</div>
            <div><b style="color:var(--text, #0f172a); font-size:0.95rem;">${escapeHtml(data.following || '0')}</b> following</div>
          </div>
          <div style="font-size:0.92rem; font-weight:700; color:var(--text, #0f172a); margin-bottom:4px;">${escapeHtml(data.fullName || '')}</div>
          ${data.bio ? `<div style="font-size:0.8rem; color:#475569; white-space:pre-wrap; line-height:1.4;">${escapeHtml(data.bio)}</div>` : ''}
        </div>
      </div>

      <!-- 4 Live Clickable Tabs -->
      <div style="display:flex; border-bottom:1px solid rgba(0,0,0,0.1); margin:18px 0 16px;">
        <div id="tabBtnPosts" onclick="switchActiveTab('posts')" style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#0284c7; border-bottom:2px solid #0284c7; text-transform:uppercase; cursor:pointer;">POSTS (${postsCount})</div>
        <div id="tabBtnStories" onclick="switchActiveTab('stories')" style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; cursor:pointer;">STORIES (${storiesCount})</div>
        <div id="tabBtnHighlights" onclick="switchActiveTab('highlights')" style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; cursor:pointer;">HIGHLIGHTS (${highlightsCount})</div>
        <div id="tabBtnReels" onclick="switchActiveTab('reels')" style="flex:1; text-align:center; padding:10px 4px; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; cursor:pointer;">REELS (${reelsCount})</div>
      </div>

      <!-- Dynamic Content -->
      <div id="profileTabContent"></div>
    </div>
  `;

  if (resultContent) resultContent.innerHTML = html;
  
  if (postsCount > 0) switchActiveTab('posts');
  else if (storiesCount > 0) switchActiveTab('stories');
  else switchActiveTab('highlights');
}

window.switchActiveTab = function(tab) {
  const data = globalProfileData;
  if (!data) return;

  ['posts', 'stories', 'highlights', 'reels'].forEach(t => {
    const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) {
      if (t === tab) {
        btn.style.color = '#0284c7';
        btn.style.borderBottom = '2px solid #0284c7';
      } else {
        btn.style.color = '#64748b';
        btn.style.borderBottom = 'none';
      }
    }
  });

  const content = document.getElementById('profileTabContent');
  if (!content) return;

  // 1. POSTS
  if (tab === 'posts') {
    const posts = data.posts || [];
    if (posts.length === 0) {
      content.innerHTML = `<p style="color:#64748b; font-size:0.85rem; padding:20px 0; text-align:center;">Koi feed post nahi mila.</p>`;
      return;
    }
    let html = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">`;
    posts.forEach((item, idx) => {
      const isVid = item.type === 'video';
      html += `
        <div style="background:var(--card-bg, #ffffff); border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); display:flex; flex-direction:column;">
          <div style="position:relative; width:100%; aspect-ratio:1/1; background:#000;">
            <img src="${item.thumbnail}" alt="Post" style="width:100%; height:100%; object-fit:cover; display:block;">
            <div style="position:absolute; top:6px; right:6px; color:white; font-size:0.8rem; text-shadow:0 1px 3px rgba(0,0,0,0.8);">${isVid ? '▶' : '⛶'}</div>
          </div>
          <div style="padding:8px 10px; display:flex; flex-direction:column; justify-content:space-between; flex:1;">
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:6px;">❤️ ${(item.likes || 0).toLocaleString()} &bull; 💬 ${item.comments || 0}</div>
            <a href="${item.url}" download class="result-download-btn" style="background:#0284c7; color:white; padding:7px 4px; border-radius:6px; font-size:0.78rem; font-weight:700; text-align:center; text-decoration:none; display:block;">Download</a>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    content.innerHTML = html;

  // 2. REELS
  } else if (tab === 'reels') {
    const reels = data.reels || [];
    if (reels.length === 0) {
      content.innerHTML = `<p style="color:#64748b; font-size:0.85rem; padding:20px 0; text-align:center;">Koi reels nahi mili.</p>`;
      return;
    }
    let html = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">`;
    reels.forEach((item, idx) => {
      html += `
        <div style="background:var(--card-bg, #ffffff); border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); display:flex; flex-direction:column;">
          <div style="position:relative; width:100%; aspect-ratio:9/16; background:#000;">
            <img src="${item.thumbnail}" alt="Reel" style="width:100%; height:100%; object-fit:cover; display:block;">
            <div style="position:absolute; top:6px; right:6px; color:white; font-size:0.85rem; text-shadow:0 1px 3px rgba(0,0,0,0.8);">▶</div>
          </div>
          <div style="padding:8px 10px; display:flex; flex-direction:column; justify-content:space-between; flex:1;">
            <div style="font-size:0.75rem; color:#64748b; margin-bottom:6px;">❤️ ${(item.likes || 0).toLocaleString()} &bull; 💬 ${item.comments || 0}</div>
            <a href="${item.url}" download class="result-download-btn" style="background:#0284c7; color:white; padding:7px 4px; border-radius:6px; font-size:0.78rem; font-weight:700; text-align:center; text-decoration:none; display:block;">Download Reel</a>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    content.innerHTML = html;

  // 3. STORIES
  } else if (tab === 'stories') {
    const stories = data.stories || [];
    if (stories.length === 0) {
      content.innerHTML = `<p style="color:#64748b; font-size:0.85rem; padding:20px 0; text-align:center;">User ne pichhle 24 ghante mein koi active story nahi lagayi hai.</p>`;
      return;
    }
    let sHtml = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">`;
    stories.forEach((s, idx) => {
      sHtml += `
        <div style="background:var(--card-bg, #ffffff); border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); display:flex; flex-direction:column;">
          <div style="position:relative; width:100%; aspect-ratio:9/16; background:#000;">
            <img src="${s.thumbnail || s.url}" alt="Story" style="width:100%; height:100%; object-fit:cover; display:block;">
            <div style="position:absolute; top:6px; right:6px; color:white; font-size:0.8rem; text-shadow:0 1px 3px rgba(0,0,0,0.8);">${s.type === 'video' ? '▶' : '⛶'}</div>
          </div>
          <div style="padding:8px;">
            <a href="${s.url}" download class="result-download-btn" style="background:#0284c7; color:white; padding:8px 4px; border-radius:6px; font-size:0.78rem; font-weight:700; text-align:center; text-decoration:none; display:block;">Download Story</a>
          </div>
        </div>
      `;
    });
    sHtml += `</div>`;
    content.innerHTML = sHtml;

  // 4. HIGHLIGHTS
  } else if (tab === 'highlights') {
    const hls = data.highlights || [];
    if (hls.length === 0) {
      content.innerHTML = `<p style="color:#64748b; font-size:0.85rem; padding:20px 0; text-align:center;">Koi highlights nahi mile.</p>`;
      return;
    }
    let hHtml = `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; text-align:center;">`;
    hls.forEach(h => {
      hHtml += `
        <div onclick="openHighlightAlbum('${h.id}', '${escapeHtml(h.title)}')" style="background:var(--card-bg, #ffffff); border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:10px 4px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
          <img src="${h.cover}" alt="HL" style="width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid #0284c7; margin-bottom:6px; display:inline-block; background:#f1f5f9;">
          <div style="font-size:0.75rem; font-weight:600; color:var(--text, #0f172a); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${escapeHtml(h.title)}</div>
          <span style="font-size:0.68rem; color:#0284c7; font-weight:700;">Open Folder ➔</span>
        </div>
      `;
    });
    hHtml += `</div><div id="albumViewer" style="margin-top:20px;"></div>`;
    content.innerHTML = hHtml;
  }
};

window.openHighlightAlbum = async function(id, title) {
  const viewer = document.getElementById('albumViewer');
  if (!viewer) return;

  viewer.innerHTML = `<p style="color:#0284c7; font-size:0.85rem; padding:14px 0; text-align:center;">Loading "${title}" items...</p>`;
  viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const res = await fetch(`${API_URL}/api/highlight/${id}`);
    const json = await res.json();
    if (!json.success || !json.items || json.items.length === 0) {
      throw new Error('Is highlight ke items nahi mile');
    }

    let aHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 4px;">
        <span style="font-size:0.9rem; font-weight:700; color:var(--text, #0f172a);">${title} (${json.items.length} items)</span>
        <button onclick="document.getElementById('albumViewer').innerHTML=''" style="background:#e2e8f0; border:none; border-radius:6px; padding:4px 8px; font-size:0.75rem; cursor:pointer; font-weight:600;">✕ Close</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;">
    `;

    json.items.forEach((item, idx) => {
      aHtml += `
        <div style="background:var(--card-bg, #ffffff); border-radius:12px; overflow:hidden; box-shadow:0 3px 12px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); display:flex; flex-direction:column;">
          <div style="position:relative; width:100%; aspect-ratio:9/16; background:#000;">
            <img src="${item.thumbnail || item.url}" alt="Item" style="width:100%; height:100%; object-fit:cover; display:block;">
            <div style="position:absolute; top:6px; right:6px; color:white; font-size:0.8rem; text-shadow:0 1px 3px rgba(0,0,0,0.8);">${item.type === 'video' ? '▶' : '⛶'}</div>
          </div>
          <div style="padding:8px;">
            <a href="${item.url}" download class="result-download-btn" style="background:#0284c7; color:white; padding:8px 4px; border-radius:6px; font-size:0.78rem; font-weight:700; text-align:center; text-decoration:none; display:block;">Download Item ${idx + 1}</a>
          </div>
        </div>
      `;
    });
    aHtml += `</div>`;
    viewer.innerHTML = aHtml;

  } catch (err) {
    viewer.innerHTML = `<p style="color:#ef4444; font-size:0.85rem; text-align:center;">Error: ${err.message}</p>`;
  }
};

function renderMediaView(data) {
  const medias = data.medias || [];
  let html = '';

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
          <a href="${downloadUrl}" download class="result-download-btn" style="display:block; text-align:center; background:#0284c7; color:white; padding:12px; border-radius:10px; font-weight:700; text-decoration:none; font-size:0.95rem;">
            Download${medias.length > 1 ? ` (Item ${index + 1})` : ''} - ${quality}
          </a>
        </div>
        ${data.title ? `<div class="result-caption" style="margin-top: 10px; font-weight:600; font-size:0.88rem; text-align:center;">${escapeHtml(data.title)}</div>` : ''}
        ${data.username ? `<div class="result-caption" style="color:#0284c7; font-size:0.85rem; text-align:center;">@${escapeHtml(data.username)}</div>` : ''}
      </div>
    `;
  });

  if (resultContent) resultContent.innerHTML = html;
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

// ============================================
// ABOUT PAGE ANIMATIONS
// ============================================

(function initAboutAnimations() {
  // Count-Up Animation
  function animateCount(el, target, duration = 1800) {
    const isDecimal = target % 1 !== 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = isDecimal ? target.toFixed(1) : target;
      }
    }

    requestAnimationFrame(update);
  }

  // Stats Reveal + Count Up
  const statsRow = document.querySelector('.stats-row');
  if (statsRow) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.stats-row .stat-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 150);
          });
          document.querySelectorAll('.stats-row .count-up').forEach((el, i) => {
            const target = parseFloat(el.closest('.stat-item').dataset.count);
            setTimeout(() => animateCount(el, target), i * 150);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statsRow);
  }

  // Reviews Slider Dots
  const slider = document.getElementById('reviewsSlider');
  const dots = document.querySelectorAll('.slider-dots .dot');
  if (slider && dots.length) {
    slider.addEventListener('scroll', () => {
      const cardWidth = slider.querySelector('.review-card')?.offsetWidth + 20 || 340;
      const activeIndex = Math.round(slider.scrollLeft / cardWidth);
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
      });
    }, { passive: true });

    // Dot click → scroll to card
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const cardWidth = slider.querySelector('.review-card')?.offsetWidth + 20 || 340;
        slider.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
      });
    });
  }
})();
