/*
 * نظام التكرار المتباعد — مبني على خوارزمية SM-2 مع تبسيطات.
 * التقييمات: 0 = مرة أخرى، 1 = صعب، 2 = جيد، 3 = سهل
 */
const SRS = (() => {
  const MIN = 60 * 1000;
  const DAY = 24 * 60 * MIN;
  const AGAIN_DELAY = 1 * MIN;

  function startOfDay(t = Date.now()) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function newState() {
    return { reps: 0, interval: 0, ease: 2.5, due: 0, lapses: 0, last: 0 };
  }

  /** يحسب الفاصل الجديد بالأيام (0 يعني إعادة خلال الجلسة). */
  function nextInterval(s, grade) {
    if (grade === 0) return 0;
    if (s.reps === 0) return [0, 1, 1, 3][grade];
    if (s.reps === 1) return [0, 3, 6, 8][grade];
    const ease = newEase(s.ease, grade);
    let iv;
    if (grade === 1) iv = s.interval * 1.2;
    else if (grade === 2) iv = s.interval * ease;
    else iv = s.interval * ease * 1.3;
    return Math.max(s.interval + 1, Math.round(iv));
  }

  function newEase(ease, grade) {
    const q = [0, 3, 4, 5][grade];
    return Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  }

  function schedule(state, grade, now = Date.now()) {
    const s = { ...newState(), ...state, last: now };
    if (grade === 0) {
      if (s.reps > 0) s.lapses += 1;
      s.reps = 0;
      s.interval = 0;
      s.ease = Math.max(1.3, s.ease - 0.2);
      s.due = now + AGAIN_DELAY;
      return s;
    }
    const iv = nextInterval(s, grade);
    s.ease = newEase(s.ease, grade);
    s.reps += 1;
    s.interval = iv;
    s.due = startOfDay(now) + iv * DAY;
    return s;
  }

  /** صياغة عدد الأيام بالعربية مع مراعاة المثنى والجمع. */
  function formatDays(n) {
    if (n <= 0) return 'خلال دقيقة';
    if (n >= 365) {
      const y = Math.round(n / 36.5) / 10;
      return y === 1 ? 'سنة' : `${y} سنة`;
    }
    if (n >= 30) {
      const m = Math.round(n / 30);
      if (m === 1) return 'شهر';
      if (m === 2) return 'شهران';
      if (m <= 10) return `${m} أشهر`;
      return `${m} شهرًا`;
    }
    if (n === 1) return 'يوم';
    if (n === 2) return 'يومان';
    if (n <= 10) return `${n} أيام`;
    return `${n} يومًا`;
  }

  function previewLabel(state, grade) {
    return formatDays(nextInterval({ ...newState(), ...state }, grade));
  }

  return { MIN, DAY, startOfDay, newState, schedule, previewLabel, formatDays };
})();
