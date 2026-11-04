/* أكوادي — تطبيق بطاقات لحفظ أكواد Swift و HTML */
(() => {
  'use strict';

  // ═════════════════ التخزين ═════════════════
  const STORE_KEY = 'akwadi.v1';

  function defaults() {
    return {
      progress: {},            // id → حالة SRS
      custom: [],              // بطاقات المستخدم
      settings: { newPerDay: 10, deck: 'all' },
      extraNew: { date: '', count: 0 },
      log: {}                  // 'YYYY-MM-DD' → { reviews, correct, newCount }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const base = defaults();
        return { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}) } };
      }
    } catch (e) { /* تخزين غير متاح */ }
    return defaults();
  }

  let store = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* تجاهل */ }
  }

  // ═════════════════ أدوات مساعدة ═════════════════
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function dayKey(t = Date.now()) {
    const d = new Date(t);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function todayLog() {
    const k = dayKey();
    if (!store.log[k]) store.log[k] = { reviews: 0, correct: 0, newCount: 0 };
    return store.log[k];
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /** تأكيد بنقرتين بدل نافذة confirm (التي لا تعمل في بعض المتصفحات المضمّنة). */
  function confirmClick(btn, msg) {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = '1';
    btn.dataset.label = btn.textContent;
    btn.textContent = 'اضغط مرة أخرى للتأكيد';
    toast(msg);
    setTimeout(() => {
      if (!btn.isConnected) return;
      delete btn.dataset.armed;
      btn.textContent = btn.dataset.label;
    }, 3500);
    return false;
  }

  const LANG_LABEL = { swift: 'Swift', html: 'HTML' };

  // ═════════════════ البطاقات ═════════════════
  function allCards() { return BUILTIN_CARDS.concat(store.custom); }
  function cardById(id) { return allCards().find(c => c.id === id); }

  /** يقسم الكود إلى أجزاء نصية وفراغات. */
  function parseCode(code) {
    const parts = [];
    const re = /\{\{([\s\S]+?)\}\}/g;
    let last = 0, m;
    while ((m = re.exec(code))) {
      if (m.index > last) parts.push({ type: 'text', v: code.slice(last, m.index) });
      parts.push({ type: 'blank', answers: m[1].split('|').map(a => a.trim()).filter(Boolean) });
      last = re.lastIndex;
    }
    if (last < code.length) parts.push({ type: 'text', v: code.slice(last) });
    return parts;
  }

  function normalize(s, lang) {
    let v = String(s)
      .replace(/[“”„]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, '');
    if (lang === 'html') v = v.toLowerCase();
    return v;
  }

  function isCorrect(value, answers, lang) {
    const v = normalize(value, lang);
    return v.length > 0 && answers.some(a => normalize(a, lang) === v);
  }

  // ═════════════════ تلوين الكود ═════════════════
  const SWIFT_KW = 'let|var|func|return|if|else|guard|switch|case|default|for|in|while|repeat|break|continue|struct|class|enum|protocol|extension|init|self|Self|import|true|false|nil|throws|throw|try|do|catch|async|await|some|any|mutating|private|public|static|override|final|where|as|is|inout|lazy|weak';
  const SWIFT_RE = new RegExp(
    '(\\/\\/.*$)|("(?:[^"\\\\\\n]|\\\\.)*")|(@\\w+)|\\b(' + SWIFT_KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Z]\\w*)\\b',
    'gm'
  );
  const HTML_RE = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][\w-]*|<!DOCTYPE)|(\s[a-zA-Z-:@]+)(?==)|("[^"]*")|(\/?>)/g;

  function highlight(text, lang) {
    const re = lang === 'swift' ? SWIFT_RE : HTML_RE;
    const classes = lang === 'swift'
      ? ['com', 'str', 'attr', 'kw', 'num', 'type']
      : ['com', 'tag', 'attr', 'str', 'tag'];
    re.lastIndex = 0;
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      out += esc(text.slice(last, m.index));
      const gi = m.slice(1).findIndex(g => g !== undefined);
      out += `<span class="tk-${classes[gi]}">${esc(m[0])}</span>`;
      last = re.lastIndex;
    }
    out += esc(text.slice(last));
    // عزل النصوص العربية داخل الكود حتى لا يختلط اتجاهها مع الكود
    return out.replace(/[\u0600-\u06FF](?:[\u0600-\u06FF\s.،؟!:]*[\u0600-\u06FF])?/g, '<span class="ar">$&</span>');
  }

  /** يعرض الكود: interactive = حقول إدخال، وإلا تظهر الإجابات مظللة. */
  function renderCode(card, interactive) {
    let html = '', bi = 0;
    for (const p of parseCode(card.code)) {
      if (p.type === 'text') {
        html += highlight(p.v, card.lang);
      } else if (interactive) {
        const w = Math.max(3, ...p.answers.map(a => a.length)) + 1;
        html += `<span class="blank-wrap"><input class="blank" data-i="${bi}" style="width:${w}ch" ` +
          `autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" dir="ltr" aria-label="الفراغ رقم ${bi + 1}"></span>`;
        bi++;
      } else {
        html += `<mark class="ans">${esc(p.answers[0])}</mark>`;
      }
    }
    return `<pre class="code" dir="ltr"><code>${html}</code></pre>`;
  }

  // ═════════════════ الحالة والإحصاءات ═════════════════
  function cardStatus(id, now = Date.now()) {
    const s = store.progress[id];
    if (!s) return 'new';
    if (s.due <= now) return 'due';
    return s.interval >= 21 ? 'mature' : 'learning';
  }

  function deckCards(deck = store.settings.deck) {
    return allCards().filter(c => deck === 'all' || c.lang === deck);
  }

  function newLimitLeft() {
    const extra = store.extraNew.date === dayKey() ? store.extraNew.count : 0;
    return Math.max(0, store.settings.newPerDay + extra - todayLog().newCount);
  }

  // ═════════════════ جلسة المراجعة ═════════════════
  let session = null;

  function buildSession(cram = false) {
    const now = Date.now();
    const cards = deckCards();
    let queue;
    if (cram) {
      queue = cards.filter(c => store.progress[c.id]).map(c => c.id);
      shuffle(queue);
      queue = queue.slice(0, 15);
    } else {
      const due = cards.filter(c => store.progress[c.id] && store.progress[c.id].due <= now)
        .sort((a, b) => store.progress[a.id].due - store.progress[b.id].due)
        .map(c => c.id);
      const fresh = cards.filter(c => !store.progress[c.id]).slice(0, newLimitLeft()).map(c => c.id);
      // نخلط الجديدة بين المراجعات
      queue = [];
      const step = fresh.length ? Math.max(1, Math.floor(due.length / fresh.length)) : 0;
      let fi = 0;
      due.forEach((id, i) => {
        queue.push(id);
        if (step && (i + 1) % step === 0 && fi < fresh.length) queue.push(fresh[fi++]);
      });
      while (fi < fresh.length) queue.push(fresh[fi++]);
    }
    session = { queue, cram, done: 0, total: queue.length, current: null };
    nextCard();
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextCard() {
    const id = session.queue.shift();
    session.current = id ? { id, checked: false, allCorrect: false, hints: 0 } : null;
    renderReview();
  }

  function updateCounts() {
    const now = Date.now();
    const cards = deckCards();
    const due = cards.filter(c => store.progress[c.id] && store.progress[c.id].due <= now).length;
    const fresh = Math.min(newLimitLeft(), cards.filter(c => !store.progress[c.id]).length);
    $('#c-due').textContent = due;
    $('#c-new').textContent = fresh;
  }

  function renderReview() {
    updateCounts();
    const area = $('#review-area');
    const cur = session && session.current;
    if (!cur) { area.innerHTML = renderDone(); bindDone(); return; }

    const card = cardById(cur.id);
    if (!card) { nextCard(); return; }
    const st = store.progress[card.id];
    const isNew = !st;
    const pct = session.total ? Math.round((session.done / session.total) * 100) : 0;

    area.innerHTML = `
      <div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <article class="flashcard" data-lang="${card.lang}">
        <div class="fc-head">
          <span class="badge lang-${card.lang}">${LANG_LABEL[card.lang]}</span>
          ${session.cram ? '<span class="badge cram">مراجعة حرّة</span>'
            : isNew ? '<span class="badge new">جديدة</span>' : '<span class="badge rev">مراجعة</span>'}
          <span class="fc-count">${session.done + 1} / ${Math.max(session.total, session.done + 1)}</span>
        </div>
        <h2 class="fc-title">${esc(card.title)}</h2>
        ${card.note ? `<p class="fc-note">${esc(card.note)}</p>` : ''}
        ${renderCode(card, true)}
        <p class="fc-instr">أكمل الفراغات ثم اضغط <kbd>Enter</kbd> للتحقق.</p>
        <div class="fc-actions" id="fc-actions"></div>
      </article>`;

    renderActions();
    const inputs = $$('.blank', area);
    inputs.forEach((inp, i) => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nextEmpty = inputs.slice(i + 1).find(x => !x.value.trim());
          if (nextEmpty && !e.ctrlKey && !e.metaKey && inp.value.trim()) nextEmpty.focus();
          else check(false);
        }
      });
      inp.addEventListener('input', () => {
        const ans = blanksOf(card)[i].answers;
        const w = Math.max(3, inp.value.length, ...ans.map(a => a.length)) + 1;
        inp.style.width = w + 'ch';
      });
    });
    if (inputs[0]) inputs[0].focus({ preventScroll: true });
  }

  function blanksOf(card) { return parseCode(card.code).filter(p => p.type === 'blank'); }

  function renderActions() {
    const cur = session.current;
    const box = $('#fc-actions');
    if (!cur.checked) {
      box.innerHTML = `
        <button class="btn ghost" data-act="hint">💡 تلميح</button>
        <button class="btn ghost" data-act="reveal">👁 إظهار الإجابة</button>
        <button class="btn primary" data-act="check">تحقّق ✓</button>`;
    } else {
      const st = store.progress[cur.id] || SRS.newState();
      const suggested = !cur.allCorrect ? 0 : cur.hints > 0 ? 1 : 2;
      const labels = ['مرة أخرى', 'صعب', 'جيد', 'سهل'];
      const result = cur.allCorrect
        ? `<div class="result ok">🎉 إجابة صحيحة${cur.hints ? ' (باستخدام تلميح)' : ''}!</div>`
        : `<div class="result bad">الإجابات الصحيحة ظاهرة باللون الأخضر — كيف كان تذكّرك؟</div>`;
      box.innerHTML = result + `<div class="grades">` + labels.map((l, g) => `
        <button class="btn grade g${g}${g === suggested ? ' suggested' : ''}" data-grade="${g}">
          <span class="g-label">${l}</span>
          <span class="g-iv">${session.cram ? '—' : SRS.previewLabel(st, g)}</span>
          <kbd>${g + 1}</kbd>
        </button>`).join('') + `</div>`;
      const sb = $('.grade.suggested', box);
      if (sb) sb.focus({ preventScroll: true });
    }
    $$('[data-act]', box).forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'check') check(false);
      else if (a === 'reveal') check(true);
      else if (a === 'hint') hint();
    }));
    $$('[data-grade]', box).forEach(b => b.addEventListener('click', () => grade(+b.dataset.grade)));
  }

  function hint() {
    const card = cardById(session.current.id);
    const blanks = blanksOf(card);
    const inputs = $$('#review-area .blank');
    for (let i = 0; i < inputs.length; i++) {
      const inp = inputs[i];
      const ans = blanks[i].answers[0];
      if (isCorrect(inp.value, blanks[i].answers, card.lang)) continue;
      // أطول بادئة صحيحة + حرف واحد
      let k = 0;
      while (k < inp.value.length && k < ans.length && inp.value[k] === ans[k]) k++;
      inp.value = ans.slice(0, Math.min(ans.length, k + 1));
      inp.dispatchEvent(new Event('input'));
      inp.focus();
      inp.classList.add('hinted');
      session.current.hints++;
      return;
    }
    toast('كل الفراغات صحيحة — اضغط تحقّق');
  }

  function check(reveal) {
    const cur = session.current;
    if (!cur || cur.checked) return;
    const card = cardById(cur.id);
    const blanks = blanksOf(card);
    let all = true;
    $$('#review-area .blank').forEach((inp, i) => {
      const ok = !reveal && isCorrect(inp.value, blanks[i].answers, card.lang);
      if (!ok) all = false;
      inp.disabled = true;
      inp.classList.add(ok ? 'ok' : 'bad');
      if (!ok) {
        const fix = document.createElement('span');
        fix.className = 'fix';
        fix.textContent = blanks[i].answers[0];
        inp.parentNode.appendChild(fix);
        if (!inp.value.trim()) inp.classList.add('empty');
      }
    });
    cur.checked = true;
    cur.allCorrect = all;
    $('.fc-instr').textContent = '';
    renderActions();
  }

  function grade(g) {
    const cur = session.current;
    if (!cur || !cur.checked) return;
    if (!session.cram) {
      const log = todayLog();
      const prev = store.progress[cur.id];
      if (!prev) log.newCount++;
      log.reviews++;
      if (cur.allCorrect) log.correct++;
      store.progress[cur.id] = SRS.schedule(prev || SRS.newState(), g);
      save();
      if (g === 0) {
        // تعود البطاقة لاحقًا في الجلسة نفسها
        const pos = Math.min(session.queue.length, 3);
        session.queue.splice(pos, 0, cur.id);
        session.total++;
      }
    } else if (g === 0) {
      session.queue.push(cur.id);
      session.total++;
    }
    session.done++;
    nextCard();
  }

  function renderDone() {
    const now = Date.now();
    const cards = deckCards();
    const remainingNew = cards.filter(c => !store.progress[c.id]).length;
    const upcoming = cards.map(c => store.progress[c.id]).filter(Boolean).map(s => s.due).filter(d => d > now).sort((a, b) => a - b)[0];
    let next = '';
    if (upcoming) {
      const days = Math.round((SRS.startOfDay(upcoming) - SRS.startOfDay(now)) / SRS.DAY);
      next = days <= 0 ? 'البطاقة التالية مستحقة اليوم بعد قليل.' : `أقرب مراجعة بعد ${SRS.formatDays(days)}.`;
    }
    const reviewed = session && session.done;
    const studied = cards.some(c => store.progress[c.id]);
    return `
      <div class="done">
        <div class="done-icon">${reviewed ? '🏆' : '✨'}</div>
        <h2>${reviewed ? 'أحسنت! أنهيت جلسة المراجعة' : 'لا توجد بطاقات مستحقة الآن'}</h2>
        ${reviewed ? `<p>راجعت ${session.done} بطاقة في هذه الجلسة.</p>` : ''}
        ${next ? `<p class="muted">${next}</p>` : ''}
        <div class="done-actions">
          ${remainingNew && !session.cram ? `<button class="btn primary" id="more-new">تعلّم 5 بطاقات جديدة إضافية</button>` : ''}
          ${studied ? `<button class="btn ghost" id="cram">مراجعة حرّة (لا تغيّر الجدولة)</button>` : ''}
          ${session && session.cram ? `<button class="btn ghost" id="back-normal">العودة للمراجعة العادية</button>` : ''}
        </div>
      </div>`;
  }

  function bindDone() {
    const more = $('#more-new');
    if (more) more.addEventListener('click', () => {
      const k = dayKey();
      if (store.extraNew.date !== k) store.extraNew = { date: k, count: 0 };
      store.extraNew.count += 5;
      save();
      buildSession();
    });
    const cram = $('#cram');
    if (cram) cram.addEventListener('click', () => buildSession(true));
    const back = $('#back-normal');
    if (back) back.addEventListener('click', () => buildSession());
  }

  // اختصارات لوحة المفاتيح للتقييم
  document.addEventListener('keydown', e => {
    if (currentView !== 'review' || !session || !session.current || !session.current.checked) return;
    const t = e.target;
    if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !t.disabled) || t.tagName === 'SELECT')) return;
    if (['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); grade(+e.key - 1); }
  });

  // ═════════════════ التنقل بين الصفحات ═════════════════
  let currentView = 'review';
  function showView(v) {
    currentView = v;
    $$('.tabs button').forEach(b => {
      const on = b.dataset.view === v;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    if (v === 'review') { if (!session || !session.current) buildSession(); else updateCounts(); }
    if (v === 'cards') renderCardList();
    if (v === 'stats') renderStats();
  }
  $$('.tabs button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));

  // فلتر المجموعة
  function syncDeckButtons() {
    $$('.deck-filter button').forEach(b => b.classList.toggle('active', b.dataset.deck === store.settings.deck));
  }
  $$('.deck-filter button').forEach(b => b.addEventListener('click', () => {
    store.settings.deck = b.dataset.deck;
    save();
    syncDeckButtons();
    buildSession();
  }));

  // ═════════════════ قائمة البطاقات ═════════════════
  const STATUS_LABEL = { new: 'جديدة', due: 'مستحقة', learning: 'قيد التعلّم', mature: 'محفوظة' };

  function dueLabel(id) {
    const s = store.progress[id];
    if (!s) return '';
    if (s.due <= Date.now()) return 'مستحقة الآن';
    const days = Math.round((SRS.startOfDay(s.due) - SRS.startOfDay()) / SRS.DAY);
    return days <= 0 ? 'اليوم' : `بعد ${SRS.formatDays(days)}`;
  }

  function renderCardList() {
    const q = $('#search').value.trim().toLowerCase();
    const lang = $('#list-lang').value;
    const cards = allCards().filter(c =>
      (lang === 'all' || c.lang === lang) &&
      (!q || (c.title + ' ' + c.note + ' ' + c.code).toLowerCase().includes(q)));
    $('#list-count').textContent = `${cards.length} بطاقة`;
    const list = $('#card-list');
    if (!cards.length) { list.innerHTML = '<p class="muted center">لا توجد بطاقات مطابقة.</p>'; return; }
    list.innerHTML = cards.map(c => {
      const st = cardStatus(c.id);
      const custom = c.id.startsWith('c-');
      return `
        <details class="card-item" data-id="${esc(c.id)}">
          <summary>
            <span class="badge lang-${c.lang}">${LANG_LABEL[c.lang]}</span>
            <span class="ci-title">${esc(c.title)}</span>
            ${custom ? '<span class="badge mine">بطاقتي</span>' : ''}
            <span class="status s-${st}">${STATUS_LABEL[st]}</span>
            <span class="ci-due muted">${dueLabel(c.id)}</span>
          </summary>
          ${c.note ? `<p class="fc-note">${esc(c.note)}</p>` : ''}
          ${renderCode(c, false)}
          <div class="ci-actions">
            ${store.progress[c.id] ? `<button class="btn small ghost" data-reset="${esc(c.id)}">إعادة تعيين التقدّم</button>` : ''}
            ${custom ? `<button class="btn small ghost" data-edit="${esc(c.id)}">تعديل</button>
                        <button class="btn small danger" data-del="${esc(c.id)}">حذف</button>` : ''}
          </div>
        </details>`;
    }).join('');

    $$('[data-reset]', list).forEach(b => b.addEventListener('click', () => {
      delete store.progress[b.dataset.reset];
      save(); session = null; renderCardList(); toast('أُعيد تعيين البطاقة');
    }));
    $$('[data-del]', list).forEach(b => b.addEventListener('click', () => {
      if (!confirmClick(b, 'ستُحذف هذه البطاقة نهائيًا')) return;
      const id = b.dataset.del;
      store.custom = store.custom.filter(c => c.id !== id);
      delete store.progress[id];
      save(); session = null; renderCardList(); toast('حُذفت البطاقة');
    }));
    $$('[data-edit]', list).forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
  }

  $('#search').addEventListener('input', renderCardList);
  $('#list-lang').addEventListener('change', renderCardList);

  // ═════════════════ نموذج إضافة / تعديل بطاقة ═════════════════
  const form = $('#card-form');
  let editingId = null;

  function openForm(id = null) {
    editingId = id;
    form.reset();
    if (id) {
      const c = cardById(id);
      $("#f-lang").value = c.lang;
      $("#f-title").value = c.title;
      $("#f-note").value = c.note || '';
      $("#f-code").value = c.code;
    }
    $('#form-heading').textContent = id ? 'تعديل البطاقة' : 'بطاقة جديدة';
    form.hidden = false;
    updatePreview();
    $("#f-title").focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeForm() { form.hidden = true; editingId = null; }

  function updatePreview() {
    const card = { lang: $("#f-lang").value, code: $("#f-code").value || '' };
    const n = blanksOf(card).length;
    $('#form-preview').innerHTML = card.code.trim()
      ? renderCode(card, false) + `<p class="muted">عدد الفراغات: ${n}</p>`
      : '<p class="muted">ستظهر المعاينة هنا…</p>';
  }

  $('#add-card').addEventListener('click', () => openForm());
  $('#cancel-form').addEventListener('click', closeForm);
  form.addEventListener('input', updatePreview);
  $("#f-code").addEventListener('keydown', e => {
    // Tab يضيف مسافات داخل الكود
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const t = e.target, s = t.selectionStart;
      t.setRangeText('    ', s, t.selectionEnd, 'end');
      updatePreview();
    }
  });
  $('#wrap-blank').addEventListener('click', () => {
    const t = $("#f-code"), s = t.selectionStart, e = t.selectionEnd;
    if (s === e) { toast('حدّد جزءًا من الكود أولًا'); return; }
    t.setRangeText('{{' + t.value.slice(s, e) + '}}', s, e, 'end');
    t.focus();
    updatePreview();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const card = {
      id: editingId || 'c-' + Date.now().toString(36),
      lang: $("#f-lang").value,
      title: $("#f-title").value.trim(),
      note: $("#f-note").value.trim(),
      code: $("#f-code").value.replace(/\s+$/, '')
    };
    if (!card.title) { toast('اكتب عنوانًا للبطاقة'); return; }
    if (!blanksOf(card).length) { toast('أضف فراغًا واحدًا على الأقل بين {{ و }}'); return; }
    if (editingId) {
      store.custom = store.custom.map(c => c.id === editingId ? card : c);
    } else {
      store.custom.push(card);
    }
    save();
    session = null;
    toast(editingId ? 'حُفظت التعديلات' : 'أُضيفت البطاقة ✓');
    closeForm();
    renderCardList();
  });

  // ═════════════════ الإحصاءات والإعدادات ═════════════════
  function streak() {
    let n = 0;
    let t = Date.now();
    if (!(store.log[dayKey(t)] && store.log[dayKey(t)].reviews)) t -= SRS.DAY;
    while (store.log[dayKey(t)] && store.log[dayKey(t)].reviews > 0) { n++; t -= SRS.DAY; }
    return n;
  }

  function renderStats() {
    const cards = allCards();
    const counts = { new: 0, due: 0, learning: 0, mature: 0 };
    cards.forEach(c => counts[cardStatus(c.id)]++);
    const tl = todayLog();
    const acc = tl.reviews ? Math.round((tl.correct / tl.reviews) * 100) + '%' : '—';
    const weekEnd = SRS.startOfDay() + 8 * SRS.DAY;
    const week = cards.filter(c => store.progress[c.id] && store.progress[c.id].due < weekEnd).length;
    const per = l => {
      const cs = cards.filter(c => c.lang === l);
      const learned = cs.filter(c => store.progress[c.id] && store.progress[c.id].reps > 0).length;
      return { learned, total: cs.length, pct: cs.length ? Math.round(learned / cs.length * 100) : 0 };
    };
    const sw = per('swift'), ht = per('html');

    $('#stat-grid').innerHTML = [
      ['🔥', streak(), 'أيام متتالية'],
      ['📝', tl.reviews, 'مراجعات اليوم'],
      ['🎯', acc, 'دقة اليوم'],
      ['⏰', counts.due, 'مستحقة الآن'],
      ['🌱', counts.learning, 'قيد التعلّم'],
      ['🧠', counts.mature, 'محفوظة (21+ يومًا)'],
      ['🆕', counts.new, 'لم تُدرس بعد'],
      ['📅', week, 'مستحقة خلال أسبوع']
    ].map(([i, v, l]) => `<div class="stat"><span class="stat-icon">${i}</span><b>${v}</b><span>${l}</span></div>`).join('');

    $('#lang-progress').innerHTML = [['swift', sw], ['html', ht]].map(([l, p]) => `
      <div class="lp">
        <div class="lp-head"><span class="badge lang-${l}">${LANG_LABEL[l]}</span><span>${p.learned} / ${p.total}</span></div>
        <div class="bar lang-${l}"><span style="width:${p.pct}%"></span></div>
      </div>`).join('');

    // نشاط آخر 14 يومًا
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const t = Date.now() - i * SRS.DAY;
      const l = store.log[dayKey(t)];
      days.push({ t, n: l ? l.reviews : 0 });
    }
    const max = Math.max(1, ...days.map(d => d.n));
    const fmt = new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#activity').innerHTML = days.map(d => `
      <div class="col" title="${fmt.format(d.t)}: ${d.n} مراجعة">
        <span class="col-n">${d.n || ''}</span>
        <span class="col-bar" style="height:${Math.round(d.n / max * 100)}%"></span>
        <span class="col-d">${new Date(d.t).getDate()}</span>
      </div>`).join('');

    $('#new-per-day').value = store.settings.newPerDay;
  }

  $('#new-per-day').addEventListener('change', e => {
    const v = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 10));
    store.settings.newPerDay = v;
    e.target.value = v;
    save(); session = null;
    toast('حُفظ الإعداد');
  });

  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `akwadi-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    // نسخة في الحافظة أيضًا، لأن بعض المتصفحات المضمّنة تمنع التنزيل
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(store)).then(
        () => toast('نُزّلت النسخة ونُسخت إلى الحافظة'),
        () => {});
    }
  });

  $('#import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      if (typeof d !== 'object' || !d.progress) throw new Error('bad');
      const base = defaults();
      store = { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}) } };
      save(); session = null; syncDeckButtons(); renderStats();
      toast('استُعيدت النسخة الاحتياطية ✓');
    } catch (err) {
      toast('الملف غير صالح');
    }
    e.target.value = '';
  });

  $('#reset-all').addEventListener('click', e => {
    if (!confirmClick(e.currentTarget, 'سيُحذف كل التقدّم والسجل، وتبقى بطاقاتك')) return;
    store.progress = {};
    store.log = {};
    store.extraNew = { date: '', count: 0 };
    save(); session = null; renderStats();
    toast('أُعيد تعيين التقدّم');
  });

  // ═════════════════ البدء ═════════════════
  syncDeckButtons();
  showView('review');
})();
