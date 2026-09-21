import confetti from './vendor/confetti-1.9.4.mjs';

let cannon;
const timers = new Set();
const motion = matchMedia('(prefers-reduced-motion: reduce)');

export function stopCelebration() {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  cannon?.reset();
}

export function celebrate() {
  stopCelebration();
  if (motion.matches || document.hidden) return;
  const canvas = document.querySelector('#celebration');
  cannon ??= confetti.create(canvas, { resize: true, disableForReducedMotion: true });
  // Offset launch times, origins and energy: individual paper pieces tumble
  // through overlapping arcs rather than descending as a horizontal curtain.
  const bursts = [
    { at: 0, x: .18, angle: 62, count: 42, speed: 43 },
    { at: 140, x: .82, angle: 118, count: 38, speed: 46 },
    { at: 360, x: .24, angle: 70, count: 30, speed: 34 },
    { at: 590, x: .76, angle: 110, count: 32, speed: 38 },
    { at: 850, x: .48, angle: 88, count: 24, speed: 30 },
  ];
  const small = innerWidth < 600;
  for (const burst of bursts) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (motion.matches || document.hidden) return;
      cannon({
        particleCount: small ? Math.round(burst.count * .7) : burst.count,
        origin: { x: burst.x, y: .72 }, angle: burst.angle, spread: 70,
        startVelocity: small ? burst.speed * .72 : burst.speed,
        gravity: 1.05, decay: .92, drift: burst.x < .5 ? .15 : -.15,
        ticks: 240, scalar: small ? .85 : 1,
        shapes: ['square', 'square', 'circle'], flat: false,
        colors: ['#883b44', '#be6570', '#e6a5a5', '#edc5c2', '#c69b50'],
        disableForReducedMotion: true,
      });
    }, burst.at);
    timers.add(timer);
  }
}
motion.addEventListener('change', () => { if (motion.matches) stopCelebration(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCelebration(); });
