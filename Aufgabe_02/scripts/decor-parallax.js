// Lightweight parallax for decorative rects
(function(){
  if (typeof window === 'undefined') return;
  try {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const layer = document.querySelector('.decor-layer');
    if (!layer) return;
    const rects = Array.from(layer.querySelectorAll('.rect'));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5; // -0.5..0.5
      const y = (e.clientY / window.innerHeight) - 0.5;
      rects.forEach((r, i) => {
        const depth = (i + 1) / rects.length; // 0..1
        const tx = -x * 40 * depth; // move less for far layers
        const ty = -y * 30 * depth;
        const rot = parseFloat(r.dataset.rot || r.style.transform.match(/rotate\(([-0-9.]+)deg\)/)?.[1] || 0);
        r.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
      });
    };

    let raf = null;
    const handler = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=> onMove(e));
    };

    window.addEventListener('pointermove', handler, { passive: true });

    // subtle idle animation: small random jitter occasionally
    setInterval(()=>{
      rects.forEach((r, i)=>{
        const jitter = (Math.random()-0.5)*6;
        const current = r.style.transform;
        r.animate([{ transform: current }, { transform: current + ` translateY(${jitter}px)` }, { transform: current }], { duration: 1400 + i*200, easing: 'ease-in-out' });
      });
    }, 7000);

  } catch (err) {
    // fail silently
    console.warn('decor-parallax failed', err);
  }
})();
