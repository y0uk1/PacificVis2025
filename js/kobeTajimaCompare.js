export class KobeTajimaCompare {
  constructor(_parentElement, _labelElements) {
    this.parentElement = _parentElement;
    this.labelElements = _labelElements;

    this.wagyuImg = {
      kobe: "assets/svg/wagyu-kobe.svg",
      tajima: "assets/svg/wagyu-tajima.svg",
      remove: "assets/svg/wagyu-remove.svg",
    };

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createGroups();
    await this.loadData();
    this.createLabels();
    this.updateVis();
  }

  async loadData() {
    this.dataset = await d3.csv(
      "data/number_of_kobegyu_tajimagyu.csv",
      d3.autoType
    );
  }

  setDimensions() {
    this.dimensions = {
      width: 700,
      height: 500,
      margin: {
        top: 10,
        right: 50,
        bottom: 10,
        left: 50,
      },
    };
    this.dimensions.ctrWidth =
      this.dimensions.width -
      this.dimensions.margin.right -
      this.dimensions.margin.left;
    this.dimensions.ctrHeight =
      this.dimensions.height -
      this.dimensions.margin.top -
      this.dimensions.margin.bottom;
  }

  createSvg() {
    const svg = d3
      .select(this.parentElement)
      .append("svg")
      .attr("width", this.dimensions.width)
      .attr("height", this.dimensions.height);

    this.ctr = svg
      .append("g")
      .attr(
        "transform",
        `translate(${this.dimensions.margin.left}, ${this.dimensions.margin.top})`
      );
  }

  createLabels() {
    this.acceptanceRate = this.ctr
      .append("text")
      .attr("x", this.dimensions.ctrWidth * 0.25)
      .attr("y", this.dimensions.ctrHeight / 2)
      .attr("font-size", "40px")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("fill", "#CBB460");

    this.ctr
      .insert("rect", "text")
      .attr("x", this.dimensions.ctrWidth * 0.25 - 70) // 余白を調整
      .attr("y", this.dimensions.ctrHeight / 2 - 25)
      .attr("width", 140)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("opacity", 0.8);

    this.labelElements.map((labelElement) => {
      const year = parseInt(labelElement.split("-").at(-1));
      const { tajimaGyuCount, kobeGyuCount } = this.getGyuCount(year);

      d3.select(labelElement)
        .append("div")
        .classed("kobe-tajima-label", true)
        .html(
          `
          <div>
            <p>
              <img src="${this.wagyuImg.kobe}" style="width: 30px; height: 30px; margin-right: 10px;">
              Kobe: ${kobeGyuCount}
            </p>
          </div>
          <div>
            <p>
              <img src="${this.wagyuImg.kobe}" style="width: 30px; height: 30px;">
              <img src="${this.wagyuImg.tajima}" style="width: 30px; height: 30px;">
              Tajima: ${tajimaGyuCount}
            </p>
          </div>
          `
        );
    });
  }

  createGroups() {
    this.wagyuGroup = this.ctr.append("g");
  }

  getGyuCount(year) {
    const tajimaGyuCount = this.dataset.filter((d) => d.year === year)[0]
      .tajimaGyu;
    const kobeGyuCount = this.dataset.filter((d) => d.year === year)[0].kobeGyu;

    return { tajimaGyuCount, kobeGyuCount };
  }

  updateVis(year = 2008) {
    const duration = 300;
    const exitTransition = d3.transition().duration(duration);
    const updateTransition = exitTransition.transition().duration(duration);

    const { tajimaGyuCount, kobeGyuCount } = this.getGyuCount(year);

    const scaledTajimaGyuCount = (tajimaGyuCount / 10) | 0;
    const scaledKobeGyuCount = (kobeGyuCount / 10) | 0;

    const expandedData = Array.from(
      { length: scaledTajimaGyuCount },
      (_, i) => ({
        index: i,
        isKobeGyu: i < scaledKobeGyuCount,
      })
    );

    const acceptanceRate = ((kobeGyuCount / tajimaGyuCount) * 100).toFixed(1);
    this.acceptanceRate
      .transition(updateTransition)
      .text(acceptanceRate !== "NaN" ? `${acceptanceRate}%` : "");

    this.wagyuGroup
      .selectAll(".wagyu")
      .data(expandedData)
      .join(
        (enter) =>
          enter
            .append("image")
            .attr("x", (d, i) => this.dimensions.ctrWidth + ((i / 25) | 0) * 21)
            .attr("y", (d, i) => (i % 25) * 19),
        (update) => update,
        (exit) =>
          exit
            .attr("xlink:href", this.wagyuImg.remove)
            .transition(exitTransition)
            .attr("x", (d, i) => this.dimensions.ctrWidth + ((i / 25) | 0) * 21)
            .remove()
      )
      .attr("class", "wagyu")
      .transition(updateTransition)
      .attr("xlink:href", (d) =>
        d.isKobeGyu ? this.wagyuImg.kobe : this.wagyuImg.tajima
      )
      .attr("width", 20)
      .attr("height", 20)
      .attr("x", (d, i) => ((i / 25) | 0) * 21)
      .attr("y", (d, i) => (i % 25) * 19);
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;

    switch (currIdx) {
      case 0:
        this.updateVis(2008);
        break;
      case 1:
        this.updateVis(2013);
        break;
      case 2:
        this.updateVis(2018);
        break;
      case 3:
        this.updateVis(2023);
        break;
      default:
        break;
    }
  };
}
