export class StickyHorizontalScroll {
  constructor(selector) {
    this.stickySections = [...document.querySelectorAll(selector)];
    this.init();
  }

  init() {
    window.addEventListener("scroll", () => this.onScroll());
  }

  onScroll() {
    this.stickySections.forEach((section) => this.transform(section));
  }

  transform(section) {
    const offsetTop = section.parentElement.offsetTop;
    const scrollSection = section.querySelector(".horizontal-scroll");

    let percentage = ((window.scrollY - offsetTop) / window.innerHeight) * 100;
    percentage = Math.max(0, Math.min(percentage, 300));

    scrollSection.style.transform = `translate3d(${-percentage}vw, 0, 0)`;
  }
}
