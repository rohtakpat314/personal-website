(function () {
  const id = window.PROJECT_ID;
  const project = PROJECTS[id];

  if (!project) {
    document.body.innerHTML = '<p style="padding:2rem;color:#f0e6d2;">Project not found. <a href="../index.html#projects" style="color:#c4a882;">Back to portfolio</a></p>';
    return;
  }

  document.title = `${project.title} | Rohtak Patwardhan`;

  const lb = { index: 0, items: [], activeSet: null };
  const lbSets = {};
  let lbSetCounter = 0;

  function registerGallerySet(items) {
    const id = `lb-set-${lbSetCounter++}`;
    lbSets[id] = items.map(item => ({
      type: 'image',
      src: item.src,
      alt: item.alt,
      caption: item.caption,
      contain: item.contain !== false,
    }));
    return id;
  }

  function lightboxItems() {
    return lb.activeSet || lb.items;
  }

  function buildLightboxItems() {
    const items = [];
    const seen = new Set();
    function add(item) {
      const key = item.src;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ type: item.type || 'image', src: item.src, alt: item.alt, caption: item.caption, contain: item.contain });
    }
    (project.visuals || []).forEach(add);
    project.sections?.forEach(sec => {
      sec.blocks?.forEach(b => {
        if (b.image) add({ type: 'image', src: b.image.src, alt: b.image.alt, caption: b.image.caption, contain: b.image.contain });
        if (b.figures?.items) b.figures.items.forEach(item => add({ type: 'image', src: item.src, alt: item.alt, caption: b.figures.caption || item.alt, contain: item.contain !== false }));
        if (b.gallery?.items) b.gallery.items.forEach(item => add({ type: 'image', src: item.src, alt: item.alt, caption: item.caption, contain: item.contain !== false }));
      });
    });
    return items;
  }

  const lbItems = buildLightboxItems();
  const lbIndexBySrc = new Map(lbItems.map((item, i) => [item.src, i]));

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderHero(visuals) {
    if (!visuals.length) {
      if (!project.status) return '';
      return `<div class="p-hero"><div class="p-hero-placeholder">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>
        <span class="p-hero-badge">${project.status || 'Visuals coming soon'}</span>
      </div></div>`;
    }

    const v = visuals[0];
    const aspectCls = v.aspect === 'square' ? ' p-hero-square' : '';
    const cls = (v.contain ? 'p-hero p-hero-contain' : 'p-hero') + aspectCls;
    const lbIdx = lbIndexBySrc.get(v.src) ?? 0;
    if (v.type === 'video') {
      return `<div class="${cls} p-lb-trigger" data-lb-index="${lbIdx}" role="button" tabindex="0" aria-label="Enlarge video"><video autoplay muted loop playsinline><source src="${esc(v.src)}"></video></div>`;
    }
    return `<div class="${cls} p-lb-trigger" data-lb-index="${lbIdx}" role="button" tabindex="0" aria-label="Enlarge image"><img src="${esc(v.src)}" alt="${esc(v.alt || project.title)}"></div>`;
  }

  function renderGallery(visuals) {
    if (visuals.length < 2) return '';
    const extra = visuals.slice(1);
    return `<section class="p-section">
      <h2 class="p-sec-label">Gallery</h2>
      <div class="p-gallery" id="gallery">
        ${extra.map((v) => {
          const index = lbIndexBySrc.get(v.src) ?? 0;
          if (v.type === 'video') {
            return `<button class="p-gallery-item" type="button" data-lb-index="${index}" aria-label="${esc(v.caption || 'Video')}">
              <video muted playsinline><source src="${esc(v.src)}"></video>
              ${v.caption ? `<span class="p-gallery-caption">${esc(v.caption)}</span>` : ''}
            </button>`;
          }
          return `<button class="p-gallery-item" type="button" data-lb-index="${index}" aria-label="${esc(v.caption || v.alt || 'Image')}">
            <img src="${esc(v.src)}" alt="${esc(v.alt || '')}" loading="lazy">
            ${v.caption ? `<span class="p-gallery-caption">${esc(v.caption)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </section>`;
  }

  const githubLink = project.github
    ? `<a href="${esc(project.github)}" target="_blank" rel="noopener" class="p-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.6-.3-5.4-1.3-5.4-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.5-2.8 5.5-5.4 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>
        View on GitHub
      </a>`
    : '';

  const webappLink = project.webapp
    ? `<a href="${esc(project.webapp)}" target="_blank" rel="noopener" class="p-link p-link--primary">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        Live Web App
      </a>`
    : '';

  function renderTopLink() {
    const items = [webappLink, githubLink].filter(Boolean).join('');
    if (!items) return '';
    return `<div class="p-top-links">${items}</div>`;
  }

  function renderLinks() {
    const links = [];
    project.docs.forEach(d => {
      links.push(`<a href="${esc(d.href)}" target="_blank" rel="noopener" class="p-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${esc(d.label)}
      </a>`);
    });
    if (!links.length) return '';
    return `<section class="p-section">
      <h2 class="p-sec-label">Resources</h2>
      <div class="p-links">${links.join('')}</div>
    </section>`;
  }

  function renderSpecBlock(title, specs) {
    if (!specs?.length) return '';
    return `<section class="p-section">
      <h2 class="p-sec-label">${esc(title)}</h2>
      <div class="p-specs">
        ${specs.map(s => `<div class="p-spec-row"><span class="p-spec-label">${esc(s.label)}</span><span class="p-spec-value">${esc(s.value)}</span></div>`).join('')}
      </div>
    </section>`;
  }

  function renderTableBlock(title, headers, rows, opts) {
    if (!rows?.length) return '';
    const plain = opts === true || opts?.plain;
    const cls = plain ? 'p-table p-table--2col' : 'p-table';
    return `<section class="p-section">
      <h2 class="p-sec-label">${esc(title)}</h2>
      <div class="p-table-wrap">
        <table class="${cls}">
          <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </section>`;
  }

  function renderSpecSections() {
    if (project.specSections?.length) {
      return project.specSections.map(sec => {
        if (sec.table) return renderTableBlock(sec.title, sec.table.headers, sec.table.rows, sec.table.plain);
        return renderSpecBlock(sec.title, sec.specs);
      }).join('');
    }
    if (project.specs?.length) return renderSpecBlock('Technical Specifications', project.specs);
    return '';
  }

  function renderCycleBreakdown() {
    const cb = project.cycleBreakdown;
    if (!cb) return '';
    return `<section class="p-section">
      <h2 class="p-sec-label">${esc(cb.title || 'End-to-End Cycle Breakdown')}</h2>
      ${cb.intro ? `<div class="p-body" style="margin-bottom:1.25rem;"><p>${esc(cb.intro)}</p></div>` : ''}
      <div class="p-table-wrap">
        <table class="p-table p-table--2col">
          <thead><tr>${cb.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${cb.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      ${cb.summary ? `<div class="p-callout" style="margin-top:1.25rem;">${esc(cb.summary)}</div>` : ''}
    </section>`;
  }

  function renderAnalysis() {
    if (!project.analysis?.length) return '';
    return `<section class="p-section">
      <h2 class="p-sec-label">System Analysis</h2>
      <div class="p-body">${project.analysis.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    </section>`;
  }

  function renderPreBlock(title, text) {
    if (!text) return '';
    return `<section class="p-section">
      <h2 class="p-sec-label">${esc(title)}</h2>
      <pre class="p-pre">${esc(text)}</pre>
    </section>`;
  }

  function renderGalleryLink(g) {
    if (!g?.items?.length) return '';
    const setId = registerGallerySet(g.items);
    const hint = g.hint
      ? `<p class="p-gallery-hint">${esc(g.hint)}</p>`
      : (g.label ? `<p class="p-gallery-hint">${esc(g.label)}</p>` : '');
    const previewSrc = g.preview || g.items[0].src;
    const previewAlt = g.previewAlt || g.items[0].alt || 'View all RTL parts';
    const aria = esc(g.caption || g.hint || g.label || 'View images');
    const cls = [
      'p-doc-figure p-doc-figure--contain p-gallery-preview',
      g.wide ? 'p-doc-figure--wide' : '',
    ].filter(Boolean).join(' ');
    const cap = g.caption ? `<figcaption class="p-doc-caption">${esc(g.caption)}</figcaption>` : '';
    return `${hint}<figure class="${cls}">
      <button type="button" class="p-doc-figure-btn p-gallery-link" data-lb-set="${setId}" aria-label="${aria}">
        <img src="${esc(previewSrc)}" alt="${esc(previewAlt)}" loading="lazy">
      </button>
      ${cap}
    </figure>`;
  }

  function renderDocBlock(b) {
    if (typeof b === 'string') return `<div class="p-body"><p>${esc(b)}</p></div>`;
    if (b.p) {
      const paras = Array.isArray(b.p) ? b.p : [b.p];
      return `<div class="p-body">${paras.map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
    }
    if (b.subhead) return `<h3 class="p-subhead">${esc(b.subhead)}</h3>`;
    if (b.link) return `<div class="p-links"><a href="${esc(b.link.href)}" target="_blank" rel="noopener" class="p-link p-link--primary">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        ${esc(b.link.label || 'Open link')}
      </a></div>`;
    if (b.code) return `<pre class="p-pre">${esc(b.code)}</pre>`;
    if (b.callout) return `<div class="p-callout">${esc(b.callout)}</div>`;
    if (b.list) return `<ul class="p-list">${b.list.map(li => `<li>${esc(li)}</li>`).join('')}</ul>`;
    if (b.stats) return `<div class="p-stats">${b.stats.map(s => `<div class="p-stat"><span class="p-stat-value">${esc(s.value)}</span><span class="p-stat-label">${esc(s.label)}</span></div>`).join('')}</div>`;
    if (b.specs) return `<div class="p-specs">${b.specs.map(s => `<div class="p-spec-row"><span class="p-spec-label">${esc(s.label)}</span><span class="p-spec-value">${esc(s.value)}</span></div>`).join('')}</div>`;
    if (b.table) {
      const t = b.table;
      const cls = t.plain ? 'p-table p-table--2col' : 'p-table';
      return `<div class="p-table-wrap"><table class="${cls}">
        <thead><tr>${t.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`;
    }
    if (b.image) {
      const img = b.image;
      const cls = [
        img.contain !== false ? 'p-doc-figure p-doc-figure--contain' : 'p-doc-figure',
        img.wide ? 'p-doc-figure--wide' : '',
      ].filter(Boolean).join(' ');
      const cap = img.caption ? `<figcaption class="p-doc-caption">${esc(img.caption)}</figcaption>` : '';
      const lbIdx = lbIndexBySrc.get(img.src) ?? 0;
      const label = esc(img.caption || img.alt || 'Enlarge image');
      return `<figure class="${cls}">
        <button type="button" class="p-doc-figure-btn" data-lb-index="${lbIdx}" aria-label="${label}">
          <img src="${esc(img.src)}" alt="${esc(img.alt || '')}" loading="lazy">
        </button>
        ${cap}
      </figure>`;
    }
    if (b.figures) {
      const f = b.figures;
      const cls = [
        'p-doc-figure p-doc-figure-group',
        f.contain !== false ? 'p-doc-figure--contain' : '',
        f.wide ? 'p-doc-figure--wide' : '',
      ].filter(Boolean).join(' ');
      const cap = f.caption ? `<figcaption class="p-doc-caption">${esc(f.caption)}</figcaption>` : '';
      const items = f.items || [];
      const setId = items.length > 1 ? registerGallerySet(items) : null;
      let body = '';
      if (setId) {
        const label = esc(f.caption || 'View images');
        body = `<div class="p-doc-figure-stack" role="button" tabindex="0" data-lb-set="${setId}" aria-label="${label}">
          ${items.map(item => `<img src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy">`).join('')}
        </div>`;
      } else if (items[0]) {
        const item = items[0];
        const lbIdx = lbIndexBySrc.get(item.src) ?? 0;
        const label = esc(item.alt || 'Enlarge image');
        body = `<button type="button" class="p-doc-figure-btn" data-lb-index="${lbIdx}" aria-label="${label}">
          <img src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy">
        </button>`;
      }
      return `<figure class="${cls}">${body}${cap}</figure>`;
    }
    if (b.galleryLink) {
      return renderGalleryLink(b.galleryLink);
    }
    if (b.gallery) {
      const g = b.gallery;
      const label = g.label ? `<div class="p-rtl-head"><p class="p-rtl-label">${esc(g.label)}</p>${g.hint ? `<span class="p-rtl-hint">${esc(g.hint)}</span>` : ''}</div>` : (g.hint ? `<p class="p-rtl-hint">${esc(g.hint)}</p>` : '');
      const items = (g.items || []).map(item => {
        const lbIdx = lbIndexBySrc.get(item.src) ?? 0;
        const cap = item.caption ? `<span class="p-rtl-caption">${esc(item.caption)}</span>` : '';
        const aria = esc(item.caption || item.alt || 'Enlarge image');
        return `<button type="button" class="p-rtl-item" data-lb-index="${lbIdx}" aria-label="${aria}">
          <img src="${esc(item.src)}" alt="${esc(item.alt || '')}" loading="lazy">
          ${cap}
        </button>`;
      }).join('');
      return `<div class="p-rtl-gallery">
        ${label}
        <div class="p-rtl-scroll" tabindex="0" role="region" aria-label="${esc(g.label || 'RTL module gallery')}">
          ${items}
        </div>
      </div>`;
    }
    return '';
  }

  function renderDocSections() {
    if (!project.sections?.length) return '';
    return project.sections.map(sec => `<section class="p-section">
      <h2 class="p-sec-label">${esc(sec.title)}</h2>
      <div class="p-doc">${(sec.blocks || []).map(renderDocBlock).join('')}</div>
    </section>`).join('');
  }

  function renderNav() {
    return PROJECT_ORDER.map(slug => {
      const p = PROJECTS[slug];
      const active = slug === id ? ' active' : '';
      return `<a href="${esc(p.file)}" class="p-nav-link${active}">${esc(p.num)}: ${esc(p.title)}</a>`;
    }).join('');
  }

  const html = `
    <aside class="p-sidebar">
      <a href="../index.html#projects" class="p-back">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to portfolio
      </a>
      <div class="p-nav-label">Projects</div>
      <nav class="p-nav">${renderNav()}</nav>
      <div class="p-sidebar-footer">Rohtak Patwardhan · EE &amp; CS</div>
    </aside>

    <div class="p-mobile-bar">
      <a href="../index.html#projects" class="p-back" style="margin-bottom:0;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Portfolio
      </a>
      <span style="font-size:0.72rem;color:var(--text-3);">${esc(project.num)}</span>
    </div>

    <main class="p-main">
      <div class="p-container">
        <p class="p-num">${esc(project.num)}</p>
        <h1 class="p-title">${esc(project.title)}</h1>
        <div class="p-meta">
          ${project.tools.map(t => `<span class="chip">${esc(t)}</span>`).join('')}
          ${project.status ? `<span class="p-status">${esc(project.status)}</span>` : ''}
        </div>

        ${renderTopLink()}

        ${renderHero(project.visuals)}

        ${project.overview?.length ? `<section class="p-section">
          <h2 class="p-sec-label">Overview</h2>
          <div class="p-body">${project.overview.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        </section>` : ''}

        ${renderDocSections()}
        ${renderSpecSections()}
        ${renderPreBlock(project.designFlow?.title || 'Architecture', project.designFlow?.text)}
        ${renderCycleBreakdown()}
        ${renderAnalysis()}

        ${project.highlights?.length ? `<section class="p-section">
          <h2 class="p-sec-label">Highlights</h2>
          <ul class="p-list">${project.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </section>` : ''}

        ${renderGallery(project.visuals)}
        ${renderLinks()}
      </div>
    </main>

    <div id="lightbox" role="dialog" aria-modal="true" aria-label="Media gallery">
      <div class="lb-header">
        <div><div class="lb-title" id="lb-title"></div><div class="lb-meta" id="lb-meta"></div></div>
        <button class="lb-close" type="button" id="lb-close" aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="lb-img-wrap" id="lb-media"></div>
      <div class="lb-nav">
        <button class="lb-nav-btn" type="button" id="lb-prev" aria-label="Previous"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
        <button class="lb-nav-btn" type="button" id="lb-next" aria-label="Next"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
      </div>
      <div class="lb-dots" id="lb-dots"></div>
    </div>
  `;

  document.getElementById('project-root').innerHTML = html;

  (function loadKatex() {
    if (!document.querySelector('.p-doc')) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(css);
    const s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
      s2.onload = () => {
        window.renderMathInElement(document.getElementById('project-root'), {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  })();

  lb.items = lbItems;

  function renderLightbox() {
    const items = lightboxItems();
    const v = items[lb.index];
    const wrap = document.getElementById('lb-media');
    wrap.innerHTML = '';
    if (v.type === 'video') {
      const vid = document.createElement('video');
      vid.controls = true;
      vid.autoplay = true;
      vid.src = v.src;
      wrap.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = v.src;
      img.alt = v.alt || v.caption || project.title;
      wrap.appendChild(img);
    }
    document.getElementById('lb-title').textContent = v.caption || v.alt || project.title;
    document.getElementById('lb-meta').textContent = `${lb.index + 1} / ${items.length}`;
    const dots = document.getElementById('lb-dots');
    dots.innerHTML = '';
    items.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'lb-dot' + (i === lb.index ? ' active' : '');
      d.type = 'button';
      d.onclick = () => { lb.index = i; renderLightbox(); };
      dots.appendChild(d);
    });
    const showNav = items.length > 1;
    document.getElementById('lb-prev').style.display = showNav ? 'flex' : 'none';
    document.getElementById('lb-next').style.display = showNav ? 'flex' : 'none';
  }

  function openLightbox(index) {
    const items = lightboxItems();
    if (!items.length) return;
    lb.index = index;
    renderLightbox();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function openGallerySet(setId) {
    if (!lbSets[setId]?.length) return;
    lb.activeSet = lbSets[setId];
    openLightbox(0);
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('lb-media').innerHTML = '';
    lb.activeSet = null;
  }

  document.getElementById('project-root').addEventListener('click', e => {
    const setBtn = e.target.closest('[data-lb-set]');
    if (setBtn) {
      openGallerySet(setBtn.dataset.lbSet);
      return;
    }
    const trigger = e.target.closest('[data-lb-index]');
    if (trigger) {
      lb.activeSet = null;
      openLightbox(Number(trigger.dataset.lbIndex));
    }
  });
  document.getElementById('project-root').addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const setBtn = e.target.closest('[data-lb-set]');
    if (setBtn) {
      e.preventDefault();
      openGallerySet(setBtn.dataset.lbSet);
      return;
    }
    const trigger = e.target.closest('.p-lb-trigger[data-lb-index]');
    if (!trigger) return;
    e.preventDefault();
    lb.activeSet = null;
    openLightbox(Number(trigger.dataset.lbIndex));
  });

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', () => {
    const items = lightboxItems();
    lb.index = (lb.index - 1 + items.length) % items.length;
    renderLightbox();
  });
  document.getElementById('lb-next').addEventListener('click', () => {
    const items = lightboxItems();
    lb.index = (lb.index + 1) % items.length;
    renderLightbox();
  });
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') document.getElementById('lb-next').click();
    if (e.key === 'ArrowLeft') document.getElementById('lb-prev').click();
  });
})();
