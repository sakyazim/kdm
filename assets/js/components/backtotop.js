/**
 * BackToTop Component
 * Injects a back-to-top button with progress ring if not present
 */
export class BackToTopManager {
  constructor() {
    this.id = 'backToTop';
    this.className = 'btn-back-to-top';
  }

  init() {
    if (document.getElementById(this.id)) return;

    const btn = document.createElement('button');
    btn.id = this.id;
    btn.className = this.className;
    // Accessibility: explicit label, title and button type
    btn.setAttribute('aria-label', 'Sayfanın başına git');
    btn.title = 'Sayfanın başına git';
    btn.type = 'button';

    // Decorative SVG and icon are aria-hidden; add a visually-hidden text for screen readers
    btn.innerHTML = `
      <svg class="progress-ring" width="56" height="56" aria-hidden="true">
        <circle class="progress-ring__bg" cx="28" cy="28" r="24"></circle>
        <circle class="progress-ring__circle" cx="28" cy="28" r="24" stroke-dasharray="150.796" stroke-dashoffset="150.796"></circle>
      </svg>
      <i class="bi bi-arrow-up" aria-hidden="true"></i>
      <span style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">Sayfanın başına git</span>
    `;

    document.body.appendChild(btn);
  }
}

export default BackToTopManager;
