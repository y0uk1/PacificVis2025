export class ScrollamaSetting {
  constructor(
    _visInstance,
    _scrollyElement,
    _stepWidth = 250,
    _stepHRate = 0.75
  ) {
    this.visInstance = _visInstance;
    this.scrollyElement = _scrollyElement;
    this.stepWidth = _stepWidth;
    this.stepHRate = _stepHRate;

    this.initScrollama();
  }

  initScrollama() {
    const scrolly = d3.select(this.scrollyElement);
    this.figure = scrolly.select("figure");
    const article = scrolly.select("article");
    this.steps = article.selectAll(".step");

    this.scroller = scrollama();

    this.setupStickyfill();
    this.handleResize(this.stepHRate);

    this.scroller
      .setup({
        step: `${this.scrollyElement} article .step`,
        offset: 0.5,
        debug: false,
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

  handleResize = (stepHRate) => {
    const stepH = Math.floor(window.innerHeight * stepHRate);
    this.steps.style("height", stepH + "px");
    this.steps.style("width", this.stepWidth + "px");

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
