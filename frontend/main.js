import { marked } from 'marked';
import DOMPurify from 'dompurify';

const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : `${window.location.origin}/api`;
const app = document.getElementById('app');
const loginBtn = document.getElementById('nav-login-btn');

let token = localStorage.getItem('token');

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatLongDate = (value) =>
  new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatDateTime = (value) =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const normalizeExcerpt = (value = '', maxLength = 120) => {
  const text = String(value)
    .replace(/[`>#*_~\-]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return '';
  }

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const estimateReadMinutes = (value = '') => {
  const charCount = String(value).replace(/\s+/g, '').length;
  return Math.max(1, Math.round(charCount / 320));
};

function updateLoginNav() {
  if (token) {
    loginBtn.textContent = '管理中心';
    loginBtn.href = '/admin';
  } else {
    loginBtn.textContent = '管理';
    loginBtn.href = '/login';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'glass-toast';

  const color = type === 'error'
    ? '#ffd9d9'
    : type === 'success'
      ? '#d9ffe7'
      : '#ffffff';

  toast.innerHTML = `<span style="color:${color}">${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

function renderSocialLinks(className = 'about-icons') {
  return `
    <div class="${className}">
      <a href="https://github.com/M1KASA2" target="_blank" title="GitHub" aria-label="GitHub">
        <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
      </a>
      <a href="https://music.163.com/#/user/home?id=553807958" target="_blank" title="网易云音乐" aria-label="网易云音乐">
        <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.985 0C5.364 0 0 5.364 0 11.985s5.364 11.985 11.985 11.985 11.985-5.364 11.985-11.985S18.606 0 11.985 0zm4.973 8.178l-.445 2.636a.394.394 0 0 1-.461.32l-2.207-.374a.394.394 0 0 1 .131-.777l1.746.295.317-1.879-5.452-.923-.948 5.606a2.494 2.494 0 0 1 1.388-.157 2.561 2.561 0 1 1-.731 5.052 2.561 2.561 0 0 1-2.081-2.952 2.517 2.517 0 0 1 .516-1.104l1.168-6.924a.394.394 0 0 1 .461-.32l6.14 1.039a.394.394 0 0 1 .458.462zm-5.974 9.01a1.773 1.773 0 1 0-.591-3.498 1.773 1.773 0 0 0 .591 3.498z"/></svg>
      </a>
      <a href="https://space.bilibili.com/287713035?spm_id_from=333.1007.0.0" target="_blank" title="Bilibili" aria-label="Bilibili">
        <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z"/></svg>
      </a>
      <div class="icon-wrapper">
        <a href="javascript:;" title="WeChat" aria-label="WeChat">
          <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg>
        </a>
        <img src="/wechat-qr.jpg" alt="Wechat QR" class="qr-popup" />
      </div>
      <div class="icon-wrapper">
        <a href="javascript:;" title="QQ" aria-label="QQ">
          <svg role="img" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"/></svg>
        </a>
        <img src="/qq-qr.jpg" alt="QQ QR" class="qr-popup" />
      </div>
    </div>
  `;
}

updateLoginNav();

const router = async () => {
  const path = window.location.pathname;
  app.innerHTML = '<div class="glass-card page-state">页面加载中...</div>';

  if (path === '/') {
    await renderHome();
    return;
  }

  if (path === '/archives') {
    await renderArchives();
    return;
  }

  if (path === '/gallery') {
    await renderGallery();
    return;
  }

  if (path === '/about') {
    await renderAbout();
    return;
  }

  if (path.startsWith('/article/')) {
    const id = path.split('/')[2];
    await renderArticle(id);
    return;
  }

  if (path === '/login') {
    renderLogin();
    return;
  }

  if (path === '/admin') {
    if (!token) {
      navigateTo('/login');
      return;
    }

    await renderAdmin();
    return;
  }

  if (path === '/admin/gallery') {
    if (!token) {
      navigateTo('/login');
      return;
    }

    await renderAdminGallery();
    return;
  }

  if (path === '/admin/edit') {
    if (!token) {
      navigateTo('/login');
      return;
    }

    const id = new URLSearchParams(window.location.search).get('id');
    await renderEdit(id);
    return;
  }

  if (path === '/search') {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    await renderSearch(q);
    return;
  }

  app.innerHTML = `
    <div class="glass-card page-state">
      <h1>404</h1>
      <p>这里什么也没有，试试回到首页看看。</p>
    </div>
  `;
};

const navigateTo = (url) => {
  window.history.pushState(null, null, url);
  router();
};

window.addEventListener('popstate', router);

window.handleSearchSubmit = (event) => {
  event.preventDefault();
  const q = document.getElementById('search-input').value.trim();

  if (!q) {
    navigateTo('/');
    return;
  }

  navigateTo(`/search?q=${encodeURIComponent(q)}`);
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-link]');
  if (!link) return;

  event.preventDefault();
  navigateTo(link.href);
});

function buildArticleCard(article, index = 0, highlight = false) {
  const badgeText = highlight ? '生日上线纪念' : index === 0 ? '最新发布' : '随笔记录';
  const excerpt = normalizeExcerpt(article.excerpt || article.content || '');

  return `
    <article class="glass-card article-card${highlight ? ' featured-post' : ''}">
      <div class="article-card-top">
        <span class="article-chip">${badgeText}</span>
        <span class="article-date">${formatLongDate(article.createdAt)}</span>
      </div>
      <a href="/article/${article.id}" data-link class="article-title">${escapeHtml(article.title)}</a>
      <p class="article-excerpt">${escapeHtml(excerpt)}</p>
      <div class="article-actions">
        <span class="article-readtime">阅读约 ${estimateReadMinutes(article.content || excerpt)} 分钟</span>
        <a href="/article/${article.id}" data-link class="article-inline-link">阅读全文</a>
      </div>
    </article>
  `;
}

async function renderSearch(q) {
  app.innerHTML = '<div class="glass-card page-state">正在搜索...</div>';

  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
    const articles = await res.json();

    const highlight = (value = '') => {
      const safeText = escapeHtml(value);
      if (!q) return safeText;

      return safeText.replace(
        new RegExp(`(${escapeRegExp(q)})`, 'gi'),
        '<mark class="search-mark">$1</mark>',
      );
    };

    const resultsHtml = articles.length
      ? articles.map((article) => {
          const excerpt = normalizeExcerpt(article.excerpt || article.content || '', 150);

          return `
            <article class="glass-card article-card search-card">
              <div class="article-card-top">
                <span class="article-chip">搜索结果</span>
                <span class="article-date">${formatLongDate(article.createdAt)}</span>
              </div>
              <a href="/article/${article.id}" data-link class="article-title">${highlight(article.title)}</a>
              <p class="article-excerpt">${highlight(excerpt)}</p>
              <div class="article-actions">
                <span class="article-readtime">匹配到标题或正文内容</span>
                <a href="/article/${article.id}" data-link class="article-inline-link">阅读全文</a>
              </div>
            </article>
          `;
        }).join('')
      : `
          <div class="glass-card page-state">
            <h2>没有找到相关文章</h2>
            <p>关键词 “${escapeHtml(q)}” 暂时没有命中内容，换个词再试试。</p>
          </div>
        `;

    app.innerHTML = `
      <div class="bg-home"></div>
      <section class="search-layout">
        <div class="section-heading">
          <span class="section-kicker">Search</span>
          <h1>搜索结果</h1>
          <p class="section-desc">关键词 “${escapeHtml(q)}” 共找到 ${articles.length} 篇文章。</p>
        </div>
        <div class="article-stack">
          ${resultsHtml}
        </div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="glass-card page-state">
        <h2>搜索失败</h2>
        <p>没有连上后端接口，请确认服务已经启动。</p>
      </div>
    `;
  }
}

async function renderHome() {
  try {
    const [articlesRes, photosRes] = await Promise.all([
      fetch(`${API_URL}/articles`),
      fetch(`${API_URL}/photos`),
    ]);
    const articles = await articlesRes.json();
    const photos = photosRes.ok ? await photosRes.json() : [];

    const articlesHtml = articles.length
      ? articles.map((article, index) => buildArticleCard(article, index, index === 0)).join('')
      : `
          <div class="glass-card page-state">
            <h2>还没有文章</h2>
            <p>第一篇文章正在路上，等会儿再来看看。</p>
          </div>
        `;

    app.innerHTML = `
      <div class="bg-home"></div>
      <div class="home-layout">
        <div class="home-main">
          <section class="home-section">
            <div class="section-heading">
              <span class="section-kicker">Recent Notes</span>
              <h2>最新文章</h2>
            </div>
            <div class="article-stack">
              ${articlesHtml}
            </div>
          </section>
        </div>

        <aside class="home-sidebar">
          <div class="glass-card profile-card">
            <img src="/avatar.jpg" alt="Avatar" class="profile-avatar" />
            <div class="profile-name">J&H</div>
            <div class="profile-bio">一个闲不住的人er</div>
            ${renderSocialLinks('profile-social')}
            <div class="profile-stats">
              <a href="/archives" data-link class="stat-item">
                <span class="stat-value">${articles.length}</span>
                <span class="stat-label">文章</span>
              </a>
              <a href="/gallery" data-link class="stat-item">
                <span class="stat-value">${photos.length}</span>
                <span class="stat-label">照片</span>
              </a>
              <a href="/about" data-link class="stat-item">
                <span class="stat-value">∞</span>
                <span class="stat-label">热爱</span>
              </a>
            </div>
          </div>

          <div class="glass-card music-player-card fade-in-up" style="animation-delay: 0.2s;">
            <div class="music-player-header">
              <div class="music-player-title">
                <svg class="music-note-svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                <span>音乐小站</span>
              </div>
            </div>

            <div class="vinyl-container">
              <div class="vinyl-wrapper">
                <div class="vinyl-disk">
                  <div class="vinyl-cover"></div>
                </div>
              </div>
              <div class="vinyl-info">
                <div class="music-song-name">起风了</div>
                <div class="music-artist-name">买辣椒也用券</div>
              </div>
            </div>

            <div class="music-iframe-wrap">
              <iframe
                id="netease-player-frame"
                frameborder="no"
                border="0"
                marginwidth="0"
                marginheight="0"
                width="100%"
                height="86"
                src="https://music.163.com/outchain/player?type=2&id=447925558&auto=0&height=66"
                allow="autoplay"
              ></iframe>
            </div>
            <div class="music-player-footer">
              <a href="https://music.163.com/#/user/home?id=553807958" target="_blank" class="netease-more-link">查看更多精彩 →</a>
            </div>
          </div>
        </aside>
      </div>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="glass-card page-state">
        <h2>加载文章失败</h2>
        <p>前端已经准备好了，但后端接口暂时没有响应。</p>
      </div>
    `;
  }
}

async function renderArchives() {
  try {
    const res = await fetch(`${API_URL}/articles`);
    const articles = await res.json();

    const timelineHtml = articles.length
      ? `
          <div class="timeline">
            ${articles
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((article) => `
                <div class="timeline-item">
                  <div class="timeline-date">${formatShortDate(article.createdAt)}</div>
                  <a href="/article/${article.id}" data-link class="timeline-title">${escapeHtml(article.title)}</a>
                </div>
              `)
              .join('')}
          </div>
        `
      : '<div class="glass-card page-state">暂时还没有归档内容。</div>';

    app.innerHTML = `
      <div class="bg-archives"></div>
      <section class="glass-card archive-shell">
        <div class="section-heading archive-heading">
          <span class="section-kicker">Archive</span>
          <h1>文章归档</h1>
          <p class="section-desc">目前共计 ${articles.length} 篇文章。写下来的东西，会慢慢堆成自己的时间线。</p>
        </div>
        ${timelineHtml}
      </section>
    `;
  } catch (error) {
    app.innerHTML = `
      <div class="glass-card page-state">
        <h2>加载归档失败</h2>
        <p>后端接口没有响应，稍后再试试看。</p>
      </div>
    `;
  }
}

function buildPhotoCard(photo, index = 0) {
  const title = photo.title || '未命名照片';
  const description = photo.description || '收藏在相册里的一个瞬间。';

  return `
    <article class="glass-card photo-card" style="--photo-delay:${Math.min(index * 55, 420)}ms">
      <button class="photo-frame" type="button" data-photo-id="${photo.id}" aria-label="查看照片：${escapeHtml(title)}">
        <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(title)}" loading="lazy" />
      </button>
      <div class="photo-card-body">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="photo-meta">
          <span>${formatLongDate(photo.createdAt)}</span>
          <span>${formatFileSize(photo.size)}</span>
        </div>
      </div>
    </article>
  `;
}

function openPhotoLightbox(photo) {
  const existing = document.querySelector('.photo-lightbox');
  if (existing) existing.remove();

  const lightbox = document.createElement('div');
  lightbox.className = 'photo-lightbox';
  lightbox.innerHTML = `
    <button class="photo-lightbox-close" type="button" aria-label="关闭照片">×</button>
    <figure class="photo-lightbox-panel">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || '相册照片')}" />
      <figcaption>
        <strong>${escapeHtml(photo.title || '未命名照片')}</strong>
        ${photo.description ? `<span>${escapeHtml(photo.description)}</span>` : ''}
      </figcaption>
    </figure>
  `;

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('.photo-lightbox-close')) {
      lightbox.remove();
    }
  });

  document.body.appendChild(lightbox);
}

function bindGalleryLightbox(photos) {
  const photoMap = new Map(photos.map((photo) => [String(photo.id), photo]));
  document.querySelectorAll('.photo-frame').forEach((button) => {
    button.addEventListener('click', () => {
      const photo = photoMap.get(button.dataset.photoId);
      if (photo) openPhotoLightbox(photo);
    });
  });
}

async function renderGallery() {
  app.innerHTML = '<div class="glass-card page-state">相册加载中...</div>';

  try {
    const res = await fetch(`${API_URL}/photos`);
    const photos = await res.json();

    const photosHtml = photos.length
      ? `<div class="photo-grid">${photos.map(buildPhotoCard).join('')}</div>`
      : `
          <div class="glass-card gallery-empty">
            <h2>相册正在等待第一束光</h2>
            <p>登录后台后可以上传照片，给每张照片写一个标题和一小段说明。</p>
          </div>
        `;

    app.innerHTML = `
      <div class="bg-gallery"></div>
      <section class="gallery-shell">
        <header class="gallery-hero">
          <span class="section-kicker">Gallery</span>
          <h1>相册</h1>
          <p>把一些生活里的光影收起来。照片不必解释太多，能被再次看见就很好。</p>
          <div class="gallery-count">
            <span>${photos.length}</span>
            <small>photos</small>
          </div>
        </header>
        ${photosHtml}
      </section>
    `;

    bindGalleryLightbox(photos);
  } catch (error) {
    app.innerHTML = `
      <div class="glass-card page-state">
        <h2>相册加载失败</h2>
        <p>后端接口没有响应，请确认服务已经启动。</p>
      </div>
    `;
  }
}

function startRuntimeCounter() {
  const startDateStr = '2026-04-28T23:05:00+08:00';

  const update = () => {
    const start = new Date(startDateStr);
    const now = new Date();
    const diffMs = Math.max(0, now - start);
    const diffSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSecs / (24 * 3600));
    const hours = Math.floor((diffSecs % (24 * 3600)) / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;

    const el = document.getElementById('runtime-counter');
    if (!el) {
      if (window.runtimeInterval) clearInterval(window.runtimeInterval);
      return;
    }

    el.innerText = `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`;
  };

  if (window.runtimeInterval) clearInterval(window.runtimeInterval);
  update();
  window.runtimeInterval = setInterval(update, 1000);
}

async function renderAbout() {
  app.innerHTML = '<div class="glass-card page-state">页面加载中...</div>';

  let aboutContent = '<p>暂时还没有内容。</p>';

  try {
    const res = await fetch(`${API_URL}/settings/about_content`);
    if (res.ok) {
      const data = await res.json();
      aboutContent = data.value;
    }
  } catch (error) {
    console.error('Failed to load about content:', error);
  }

  const isAdmin = !!localStorage.getItem('token');

  app.innerHTML = `
    <div class="bg-about"></div>
    <div class="glass-card about-card">
      ${isAdmin ? '<button id="editAboutBtn" class="edit-btn">编辑内容</button>' : ''}
      <img src="/avatar.jpg" alt="Avatar" class="about-avatar" />
      <h1 class="profile-name about-name">J&H</h1>
      <p class="about-subtitle">一个闲不住的人er</p>

      ${renderSocialLinks('about-icons')}

      <div class="about-content" id="aboutContentDisplay">
        ${aboutContent}
      </div>

      <div class="about-content-editor" id="aboutContentEditor" style="display:none; text-align:left;">
        <textarea id="aboutTextarea" rows="12" class="glass-textarea about-textarea">${escapeHtml(aboutContent)}</textarea>
        <button id="saveAboutBtn" class="submit-btn glass-btn">保存修改</button>
      </div>
    </div>
  `;

  if (!isAdmin) return;

  const editBtn = document.getElementById('editAboutBtn');
  const displayDiv = document.getElementById('aboutContentDisplay');
  const editorDiv = document.getElementById('aboutContentEditor');
  const saveBtn = document.getElementById('saveAboutBtn');
  const textarea = document.getElementById('aboutTextarea');

  editBtn.addEventListener('click', () => {
    displayDiv.style.display = 'none';
    editorDiv.style.display = 'block';
    editBtn.style.display = 'none';
  });

  saveBtn.addEventListener('click', async () => {
    const newContent = textarea.value;
    const originalText = saveBtn.innerText;
    saveBtn.innerText = '保存中...';

    try {
      const res = await fetch(`${API_URL}/settings/about_content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newContent }),
      });

      if (res.ok) {
        showToast('关于页内容已保存', 'success');
        renderAbout();
      } else {
        showToast('保存失败，请检查登录状态', 'error');
        saveBtn.innerText = originalText;
      }
    } catch (error) {
      showToast(`保存出错：${error.message}`, 'error');
      saveBtn.innerText = originalText;
    }
  });
}

async function renderArticle(id) {
  try {
    const res = await fetch(`${API_URL}/articles/${id}`);
    if (res.status === 404) {
      app.innerHTML = '<div class="glass-card page-state">这篇文章不存在。</div>';
      return;
    }

    const article = await res.json();
    const parsedContent = DOMPurify.sanitize(marked.parse(article.content || ''));
    const updatedLabel =
      article.updatedAt && article.updatedAt !== article.createdAt
        ? `<span>最后更新：${formatLongDate(article.updatedAt)}</span>`
        : '';

    app.innerHTML = `
      <div class="bg-article"></div>
      <article class="glass-card article-shell">
        <header class="article-hero-block">
          <a href="/" data-link class="article-back">返回首页</a>
          <span class="section-kicker">Personal Note</span>
          <h1 class="article-page-title">${escapeHtml(article.title)}</h1>
          <div class="article-meta-row">
            <span>发布于 ${formatLongDate(article.createdAt)}</span>
            <span>阅读约 ${estimateReadMinutes(article.content)} 分钟</span>
            ${updatedLabel}
          </div>
        </header>
        <div class="article-body md-content">
          ${parsedContent}
        </div>
      </article>
    `;
  } catch (error) {
    app.innerHTML = '<div class="glass-card page-state">加载文章失败，请稍后再试。</div>';
  }
}

function renderLogin() {
  app.innerHTML = `
    <div class="login-bg"></div>
    <div class="glass-card" style="max-width: 420px; margin: 0 auto; position: relative; z-index: 1;">
      <h2 class="mb-20">后台登录</h2>
      <form id="login-form">
        <input type="text" id="username" class="glass-input" placeholder="用户名" required />
        <input type="password" id="password" class="glass-input" placeholder="密码" required />
        <button type="submit" class="glass-btn" style="width:100%">登录</button>
        <div id="login-error" style="color:#ffd9d9; margin-top:10px; display:none;"></div>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        token = data.token;
        localStorage.setItem('token', token);
        updateLoginNav();
        navigateTo('/admin');
      } else {
        document.getElementById('login-error').textContent = data.error || '登录失败';
        document.getElementById('login-error').style.display = 'block';
      }
    } catch (error) {
      console.error(error);
    }
  });
}

async function renderAdmin() {
  try {
    const res = await fetch(`${API_URL}/articles`);
    const articles = await res.json();

    const listHtml = articles.map((article) => `
      <div class="glass-card flex-between" style="padding: 15px 20px; margin-bottom: 15px;">
        <div>
          <h3 style="margin-bottom: 5px">${escapeHtml(article.title)}</h3>
          <small style="color: var(--text-muted)">${formatDateTime(article.createdAt)}</small>
        </div>
        <div>
          <a href="/admin/edit?id=${article.id}" data-link class="glass-btn">编辑</a>
          <button class="glass-btn danger" onclick="deleteArticle(${article.id})">删除</button>
        </div>
      </div>
    `).join('');

    app.innerHTML = `
      <div class="flex-between mb-20 admin-header">
        <h2>管理后台</h2>
        <div>
          <a href="/admin/edit" data-link class="glass-btn">新建文章</a>
          <a href="/admin/gallery" data-link class="glass-btn">管理相册</a>
          <button id="logout-btn" class="glass-btn danger" style="margin-left:10px;">退出登录</button>
        </div>
      </div>
      ${listHtml || '<div class="glass-card">还没有文章。</div>'}
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('token');
      token = null;
      updateLoginNav();
      navigateTo('/');
    });
  } catch (error) {
    app.innerHTML = '<div class="glass-card page-state">加载后台失败。</div>';
  }
}

async function renderAdminGallery() {
  try {
    const res = await fetch(`${API_URL}/photos`);
    const photos = await res.json();

    const listHtml = photos.length
      ? photos.map((photo) => `
          <article class="glass-card admin-photo-card">
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.title || '相册照片')}" loading="lazy" />
            <div class="admin-photo-info">
              <h3>${escapeHtml(photo.title || '未命名照片')}</h3>
              <p>${escapeHtml(photo.description || '没有说明')}</p>
              <small>${formatDateTime(photo.createdAt)} · ${formatFileSize(photo.size)}</small>
            </div>
            <button class="glass-btn danger" type="button" onclick="deletePhoto(${photo.id})">删除</button>
          </article>
        `).join('')
      : '<div class="glass-card page-state">还没有照片，先上传一张吧。</div>';

    app.innerHTML = `
      <div class="bg-gallery"></div>
      <section class="admin-gallery-shell">
        <div class="flex-between mb-20 admin-header">
          <div>
            <span class="section-kicker">Gallery Admin</span>
            <h2>相册管理</h2>
          </div>
          <div>
            <a href="/admin" data-link class="glass-btn">文章后台</a>
            <a href="/gallery" data-link class="glass-btn">查看相册</a>
          </div>
        </div>

        <form id="photo-upload-form" class="glass-card photo-upload-card">
          <label class="photo-file-picker" for="photo-file">
            <span class="photo-file-preview" id="photo-file-preview">选择照片</span>
            <input id="photo-file" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required />
          </label>

          <div class="photo-upload-fields">
            <input id="photo-title" name="title" class="glass-input" type="text" placeholder="照片标题" />
            <textarea id="photo-description" name="description" class="glass-textarea" rows="4" placeholder="写一句照片说明"></textarea>
            <p class="upload-hint">支持 JPG、PNG、WebP、GIF、AVIF，单张最大 10MB。HEIC 请先转成 JPG 或 WebP。</p>
            <button id="photo-upload-btn" class="glass-btn" type="submit">上传到相册</button>
          </div>
        </form>

        <div class="admin-photo-list">
          ${listHtml}
        </div>
      </section>
    `;

    const fileInput = document.getElementById('photo-file');
    const titleInput = document.getElementById('photo-title');
    const preview = document.getElementById('photo-file-preview');

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (!titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^.]+$/, '');
      }

      const previewUrl = URL.createObjectURL(file);
      preview.style.backgroundImage = `linear-gradient(to bottom, rgba(9,12,20,0.08), rgba(9,12,20,0.5)), url("${previewUrl}")`;
      preview.textContent = file.name;
    });

    document.getElementById('photo-upload-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = document.getElementById('photo-upload-btn');
      const originalText = button.innerText;
      const formData = new FormData(event.currentTarget);

      button.disabled = true;
      button.innerText = '上传中...';

      try {
        const uploadRes = await fetch(`${API_URL}/photos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await uploadRes.json();

        if (uploadRes.ok) {
          showToast('照片已加入相册', 'success');
          await renderAdminGallery();
        } else if (uploadRes.status === 401 || uploadRes.status === 403) {
          showToast('登录已失效，请重新登录', 'error');
          navigateTo('/login');
        } else {
          showToast(data.error || '上传失败', 'error');
          button.disabled = false;
          button.innerText = originalText;
        }
      } catch (error) {
        showToast(`上传失败：${error.message}`, 'error');
        button.disabled = false;
        button.innerText = originalText;
      }
    });
  } catch (error) {
    app.innerHTML = '<div class="glass-card page-state">加载相册后台失败。</div>';
  }
}

async function renderEdit(id) {
  let title = '';
  let content = '';

  if (id) {
    try {
      const res = await fetch(`${API_URL}/articles/${id}`);
      const article = await res.json();
      title = article.title || '';
      content = article.content || '';
    } catch (error) {
      console.error(error);
    }
  }

  app.innerHTML = `
    <div class="glass-card" style="max-width: 1200px; margin: 0 auto;">
      <h2 class="mb-20">${id ? '编辑文章' : '新建文章'}</h2>
      <form id="edit-form" style="display:flex; flex-direction:column; gap:20px;">
        <input
          type="text"
          id="title"
          class="glass-input"
          placeholder="文章标题"
          value="${escapeHtml(title)}"
          required
          style="margin-bottom:0;"
        />

        <div style="display:flex; gap:20px; height:500px; flex-wrap:wrap;">
          <textarea id="content" class="glass-textarea" placeholder="在这里写 Markdown..." style="flex:1; min-width:300px; margin-bottom:0; resize:none;">${escapeHtml(content)}</textarea>
          <div id="preview" class="glass-card md-content" style="flex:1; min-width:300px; overflow-y:auto; margin-bottom:0; background:rgba(0,0,0,0.2);">
            ${content ? DOMPurify.sanitize(marked.parse(content)) : '<span style="color:var(--text-muted)">预览区域</span>'}
          </div>
        </div>

        <div class="flex-between">
          <a href="/admin" data-link class="glass-btn">取消</a>
          <button type="submit" class="glass-btn">保存</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('content').addEventListener('input', (event) => {
    const preview = document.getElementById('preview');
    preview.innerHTML = event.target.value
      ? DOMPurify.sanitize(marked.parse(event.target.value))
      : '<span style="color:var(--text-muted)">预览区域</span>';
  });

  document.getElementById('edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const newTitle = document.getElementById('title').value;
    const newContent = document.getElementById('content').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/articles/${id}` : `${API_URL}/articles`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      if (res.ok) {
        showToast('文章已保存', 'success');
        navigateTo('/admin');
      } else if (res.status === 401 || res.status === 403) {
        showToast('登录已失效，请重新登录', 'error');
        navigateTo('/login');
      } else {
        showToast('保存文章失败', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('保存文章失败', 'error');
    }
  });
}

window.deleteArticle = async (id) => {
  if (!confirm('确定要删除这篇文章吗？')) return;

  try {
    const res = await fetch(`${API_URL}/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      showToast('文章已删除', 'success');
      renderAdmin();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('删除失败', 'error');
  }
};

window.deletePhoto = async (id) => {
  if (!confirm('确定要删除这张照片吗？')) return;

  try {
    const res = await fetch(`${API_URL}/photos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      showToast('照片已删除', 'success');
      renderAdminGallery();
    } else if (res.status === 401 || res.status === 403) {
      showToast('登录已失效，请重新登录', 'error');
      navigateTo('/login');
    } else {
      showToast('删除照片失败', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('删除照片失败', 'error');
  }
};

router();
startRuntimeCounter();
