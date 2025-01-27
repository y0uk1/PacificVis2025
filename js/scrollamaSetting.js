export class ScrollamaSetting {
  constructor(_visInstance, _scrollyElement) {
    this.visInstance = _visInstance;
    this.scrollyElement = _scrollyElement;

    this.initScrollama();
  }

  initScrollama() {
    const scrolly = d3.select(this.scrollyElement);
    this.figure = scrolly.select("figure");
    const article = scrolly.select("article");
    this.steps = article.selectAll(".step");

    this.scroller = scrollama();

    this.setupStickyfill();
    this.handleResize();

    this.scroller
      .setup({
        step: `${this.scrollyElement} article .step`,
        offset: 0.5,
        debug: true,
      })
      .onStepEnter((response) => {
        this.addActiveClass(response);
        this.visInstance.handlerStepEnter(response);
      });

    window.addEventListener("resize", this.handleResize);
  }

  setupStickyfill() {
    d3.selectAll(".sticky").each(function () {
      Stickyfill.add(this);
    });
  }

  handleResize = () => {
    const stepH = Math.floor(window.innerHeight * 0.75);
    this.steps.style("height", stepH + "px");
    this.steps.style("width", "250px");

    const figureHeight = window.innerHeight / 2;
    const figureMarginTop = (window.innerHeight - figureHeight) / 2;

    this.figure
      .style("height", figureHeight + "px")
      .style("top", figureMarginTop + "px");

    this.scroller.resize();
  };

  addActiveClass = (response) => {
    const currIdx = response.index;
    this.steps.classed("is-active", (d, i) => i === currIdx);
  };
}
