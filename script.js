window.MathJax = {
  tex: {
    inlineMath: [["$","$"]],
    displayMath: [["$$","$$"]],
    packages: { '[+]': ['ams'] },
    tags: 'none',
    macros: {
      norm: ["\\left\\lVert #1 \\right\\rVert", 1],
      inner: ["\\left\\langle #1, #2 \\right\\rangle", 2],
      hilbert: ["\\mathcal{H}", 0],
    }
  },
  options: {
    skipHtmlTags: ['script','noscript','style','textarea','pre','code'],
    renderActions: { addMenu: [0, '', ''] },
  },
  chtml: { scale: 1 },
  output: {
    font: 'mathjax-newcm'
  },
};

(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';
  script.defer = true;
  document.head.appendChild(script);
})();

(() => {
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const A = n => String.fromCharCode(64 + n); // 1->A, 2->B ...
  const refMap = new Map(); // id -> {type, label, short}

  const labelBlock = (el, text, subtitle) => {
    const t = document.createElement('div');
    t.className = 'block-title';
    t.appendChild(document.createTextNode(text));
    if (subtitle) {
      const s = document.createElement('span');
      s.className = 'block-subtitle';
      s.textContent = subtitle;
      t.appendChild(document.createTextNode(' '));
      t.appendChild(s);
    }
    el.insertAdjacentElement('afterbegin', t);
    el.setAttribute('data-labeled', '');
  };

  const prefixCaption = (el, text) => {
    if (!el) return;
    const span = document.createElement('span');
    span.className = 'ftno';
    span.textContent = text + ' ';
    el.insertAdjacentElement('afterbegin', span);
    el.setAttribute('data-labeled', '');
  };

  const prefixHeading = (h2, text) => {
    const span = document.createElement('span');
    span.className = 'secno';
    span.textContent = text + '. ';
    h2.insertAdjacentElement('afterbegin', span);
    h2.setAttribute('data-labeled','');
  };

  // Sections (main matter)
  const secs = Array.from(document.querySelectorAll('main > article > section.sec'));
  secs.forEach((sec, i) => {
    const secNum = String(i + 1);
    const h2 = sec.querySelector('h2.section-title');
    if (h2) prefixHeading(h2, secNum);
    if (!sec.id) sec.id = `s${secNum}`;
    refMap.set(sec.id, { type: 'section', label: `Section ${secNum}`, short: secNum });

    let thm=0, eq=0, fig=0, tab=0;
    const items = sec.querySelectorAll('theorem, lemma, corollary, proposition, definition, remark, equation, figure, table');
    items.forEach(el => {
      const tag = el.tagName.toLowerCase();
      const thmLike = ['theorem','lemma','corollary','proposition','definition','remark'];
      let label='', short='';

      if (thmLike.includes(tag)) {
        thm++; short = `${secNum}.${thm}`;
        label = `${cap(tag)} ${short}`;
        if (!el.id) el.id = `${tag}:s${secNum}-${thm}`;
        const opt = el.getAttribute('data-title');
        labelBlock(el, `${label}.`, opt ? `(${opt})` : undefined);
      } else if (tag === 'equation') {
        eq++; short = `${secNum}.${eq}`; label = `(${short})`;
        if (!el.id) el.id = `eq:s${secNum}-${eq}`;
      } else if (tag === 'figure') {
        fig++; short = `${secNum}.${fig}`; label = `Figure ${short}`;
        if (!el.id) el.id = `fig:s${secNum}-${fig}`;
        prefixCaption(el.querySelector('figcaption'), label + '.');
      } else if (tag === 'table') {
        tab++; short = `${secNum}.${tab}`; label = `Table ${short}`;
        if (!el.id) el.id = `tab:s${secNum}-${tab}`;
        prefixCaption(el.querySelector('caption'), label + '.');
      }
      if (label) {
        refMap.set(el.id, { type: tag, label, short });
        el.setAttribute('data-number', short);
      }
    });
  });

  // Appendices (A, B, …)
  const apps = Array.from(document.querySelectorAll('main > article > section.appendix'));
  apps.forEach((sec, i) => {
    const app = A(i + 1);
    const h2 = sec.querySelector('h2.section-title');
    if (h2) prefixHeading(h2, `Appendix ${app}.`);
    if (!sec.id) sec.id = `app${app}`;
    refMap.set(sec.id, { type: 'appendix', label: `Appendix ${app}`, short: app });

    let thm=0, def=0, rem=0, eq=0, fig=0, tab=0;
    const items = sec.querySelectorAll('theorem, lemma, corollary, proposition, definition, remark, equation, figure, table');
    items.forEach(el => {
      const tag = el.tagName.toLowerCase();
      const thmLike = ['theorem','lemma','corollary','proposition'];
      let label='', short='';

      if (thmLike.includes(tag)) {
        thm++; short = `${app}.${thm}`; label = `${cap(tag)} ${short}`;
        if (!el.id) el.id = `${tag}-app${app}-${thm}`;
        const opt = el.getAttribute('data-title');
        labelBlock(el, `${label}.`, opt ? `(${opt})` : undefined);
      } else if (tag === 'equation') {
        eq++; short = `${app}.${eq}`; label = `(${short})`;
        if (!el.id) el.id = `eq-app${app}-${eq}`;
      } else if (tag === 'figure') {
        fig++; short = `${app}.${fig}`; label = `Figure ${short}`;
        if (!el.id) el.id = `fig-app${app}-${fig}`;
        prefixCaption(el.querySelector('figcaption'), label + '.');
      } else if (tag === 'table') {
        tab++; short = `${app}.${tab}`; label = `Table ${short}`;
        if (!el.id) el.id = `tab-app${app}-${tab}`;
        prefixCaption(el.querySelector('caption'), label + '.');
      }
      if (label) {
        refMap.set(el.id, { type: tag, label, short });
        el.setAttribute('data-number', short);
      }
    });
  });

  // XRef formatter
  const fmt = (t, format) => {
    switch (format) {
      case 'full': return t.label;
      case 'bare': return t.short;
      case 'paren':
      case 'auto':
      case undefined:
      default:
        return t.type === 'equation' ? `(${t.short})` : t.label;
    }
  };

  // <xref to="..." format="full | bare | paren | auto">
  document.querySelectorAll('xref').forEach(x => {
    const f  = x.getAttribute('format');
    const id = (() => {
      const id = x.getAttribute('to')?.replace(/^#/, '');
      if (id) return id;
      const content = x.textContent.trim();
      if (!content) return;
      return "def:"+content.replaceAll(" ", "-").toLowerCase();
    })()
    const t  = refMap.get(id);
    if (!t) return;
    const a = document.createElement('a');
    a.className = 'xref';
    a.href = '#' + id;
    if (!x.textContent.trim()) a.textContent = fmt(t, f);
    else a.textContent = x.textContent;
    a.setAttribute('data-type', t.type);
    a.setAttribute('aria-label', t.label);
    x.replaceWith(a);
  });
})();
