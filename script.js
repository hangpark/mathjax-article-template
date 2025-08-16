window.MathJax = {
  loader: {
    load: ['[tex]/ams', '[tex]/physics', '[tex]/html'],
  },
  tex: {
    inlineMath: [["$","$"]],
    displayMath: [["$$","$$"]],
    packages: { '[+]': ['ams','physics', 'html'] },
    tags: 'none',
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
      let label='', short='', title='';

      if (thmLike.includes(tag)) {
        thm++; short = `${secNum}.${thm}`;
        label = `${cap(tag)} ${short}`;
        if (!el.id) el.id = `${tag}:s${secNum}-${thm}`;
        title = el.getAttribute('data-title');
        labelBlock(el, `${label}.`, title ? `(${title})` : undefined);
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
        refMap.set(el.id, { type: tag, label, short, ...(title ? {title} : {}) });
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
      let label='', short='', title='';

      if (thmLike.includes(tag)) {
        thm++; short = `${app}.${thm}`; label = `${cap(tag)} ${short}`;
        if (!el.id) el.id = `${tag}-app${app}-${thm}`;
        title = el.getAttribute('data-title');
        labelBlock(el, `${label}.`, title ? `(${title})` : undefined);
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
        refMap.set(el.id, { type: tag, label, short, ...(title ? {title} : {}) });
        el.setAttribute('data-number', short);
      }
    });
  });

  // XRef formatter
  const fmt = (t, format) => {
    switch (format) {
      case 'full': return t.label;
      case 'bare': return t.short;
      case 'title': return t.title;
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

/* ===== TOC builder & scrollspy ===== */
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const ABBR = { theorem:"Thm", definition:"Def", lemma:"Lem", corollary:"Cor", proposition:"Prop", remark:"Rem" };
  const tocTrees = $$(".toc-tree"); if (!tocTrees.length) return;
  const sections = $$("main > article > section.sec");
  const thmLike = new Set(Object.keys(ABBR));
  const stripNum = (s="") => s.replace(/^\s*\d+(?:\.\d+)*\.\s*/, "").trim();
  const getNo = el => (el?.querySelector(".secno")?.textContent || "").trim().replace(/\.$/, "");
  const textNo = el => { const c = el?.cloneNode(true); if (!c) return ""; c.querySelectorAll(".secno").forEach(n=>n.remove()); return stripNum(c.textContent||""); };

  const build = () => {
    const root = document.createElement("ul");
    sections.forEach(sec => {
      const secId = sec.id, h = sec.querySelector(":scope > .section-title");
      if (!secId || !h) return;
      const liSec = document.createElement("li"); liSec.className="toc-level-1";
      const aSec = document.createElement("a"); aSec.href=`#${secId}`;
      const span = document.createElement("span"); span.className="toc-text";
      const n = getNo(h), t = textNo(h); span.textContent = `${n ? n + ". " : ""}${t}`; aSec.appendChild(span); liSec.appendChild(aSec);
      const ulSub = document.createElement("ul");

      // subsections
      $$(":scope > section.subsec", sec).forEach(sub => {
        const sh = sub.querySelector(":scope > .section-title");
        const sid = sh?.id || sub.id;
        const sn = getNo(sh), st = textNo(sh);
        const li = document.createElement("li"); li.className="toc-level-2";
        const a = document.createElement("a"); a.href = sid ? `#${sid}` : "#";
        const sp = document.createElement("span"); sp.className="toc-text"; sp.textContent = `${sn ? sn + ". " : ""}${st}`;
        a.appendChild(sp); li.appendChild(a);

        const ulItems = document.createElement("ul"); ulItems.className="toc-items";
        Array.from(sub.children).filter(el => thmLike.has(el.tagName.toLowerCase())).forEach(it => {
          const id = it.id, num = (it.getAttribute("data-number")||"").trim().replace(/\.*\s*$/,""); const dot = num ? num + "." : "";
          const title = (it.getAttribute("data-title")||"").trim();
          const tag = it.tagName.toLowerCase(), ab = ABBR[tag] || tag;
          const li3 = document.createElement("li"); li3.className="toc-level-3";
          const a3 = document.createElement("a"); a3.href = id ? `#${id}` : "#";
          const dotEl = document.createElement("span"); dotEl.className = `toc-kind toc-kind--${tag}`;
          const tx = document.createElement("span"); tx.className="toc-text"; tx.textContent = title ? `${ab} ${dot} ${title}` : `${ab} ${dot}`;
          a3.appendChild(dotEl); a3.appendChild(tx); li3.appendChild(a3); ulItems.appendChild(li3);
        });
        li.appendChild(ulItems); ulSub.appendChild(li);
      });

      // direct items under section
      const direct = Array.from(sec.children).filter(el => thmLike.has(el.tagName.toLowerCase()));
      if (direct.length){ const ulI = document.createElement("ul"); ulI.className="toc-items";
        direct.forEach(it => {
          const id = it.id, num = (it.getAttribute("data-number")||"").trim().replace(/\.*\s*$/,""); const dot = num ? num + "." : "";
          const title = (it.getAttribute("data-title")||"").trim();
          const tag = it.tagName.toLowerCase(), ab = ABBR[tag] || tag;
          const li3 = document.createElement("li"); li3.className="toc-level-3";
          const a3 = document.createElement("a"); a3.href = id ? `#${id}` : "#";
          const dotEl = document.createElement("span"); dotEl.className = `toc-kind toc-kind--${tag}`;
          const tx = document.createElement("span"); tx.className="toc-text"; tx.textContent = title ? `${ab} ${dot} ${title}` : `${ab} ${dot}`;
          a3.appendChild(dotEl); a3.appendChild(tx); li3.appendChild(a3); ulI.appendChild(li3);
        });
        ulSub.appendChild(ulI);
      }

      if (ulSub.childElementCount) liSec.appendChild(ulSub);
      root.appendChild(liSec);
    });

    tocTrees.forEach(n => { n.innerHTML=""; n.appendChild(root.cloneNode(true)); });
  };
  build();

  // Expand/Collapse all (items only)
  const setCollapsed = (c) => {
    tocTrees.forEach(tree => tree.querySelectorAll(".toc-items").forEach(ul => c ? ul.setAttribute("hidden","") : ul.removeAttribute("hidden")));
  };
  $$(".toc-expand").forEach(b => b.addEventListener("click", () => setCollapsed(false)));
  $$(".toc-collapse").forEach(b => b.addEventListener("click", () => setCollapsed(true)));

  // Scrollspy
  const heads = [...$$("main > article > section.sec > .section-title"), ...$$("main > article > section.sec section.subsec > .section-title")];
  const idToLinks = new Map();
  tocTrees.forEach(tree => tree.querySelectorAll("a[href^='#']").forEach(a => {
    const id = a.getAttribute("href").slice(1); if (!idToLinks.has(id)) idToLinks.set(id, []); idToLinks.get(id).push(a);
  }));
  const setActive = (id) => { tocTrees.forEach(tree => tree.querySelectorAll("a[aria-current]").forEach(a => a.removeAttribute("aria-current")));
    (idToLinks.get(id)||[]).forEach(a => a.setAttribute("aria-current","true")); };
  const io = new IntersectionObserver((entries)=>{
    const vis = entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
    if (vis[0]) setActive(vis[0].target.id);
  }, {rootMargin:"-35% 0px -60% 0px", threshold:0.01});
  heads.forEach(h => h && io.observe(h));

  // Smooth scroll & close drawer on click
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']"); if (!a) return;
    const target = document.getElementById(a.getAttribute("href").slice(1)); if (!target) return;
    e.preventDefault(); target.scrollIntoView({behavior:"smooth", block:"start"});
    const t = document.getElementById("toc-drawer-toggle"); if (t && t.checked) t.checked = false;
  });

  // Header menu button toggles drawer
  const menuBtn = document.getElementById("toc-menu-btn");
  const drawerToggle = document.getElementById("toc-drawer-toggle");
  if (menuBtn && drawerToggle){
    const update = () => menuBtn.setAttribute("aria-expanded", String(!!drawerToggle.checked));
    menuBtn.addEventListener("click", ()=>{ drawerToggle.checked = !drawerToggle.checked; update(); });
    drawerToggle.addEventListener("change", update);
  }
})();
