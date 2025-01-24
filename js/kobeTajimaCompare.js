export class KobeTajimaCompare {
  constructor(_parentElement, _labelElement) {
    this.parentElement = _parentElement;
    this.labelElement = _labelElement;

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createGroups();
    this.createLabel();
    await this.loadData();
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
      width: 1200,
      height: 800,
      margin: {
        top: 10,
        right: 30,
        bottom: 30,
        left: 60,
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

  createLabel() {
    this.label = d3
      .select(`${this.labelElement}`)
      .append("div")
      .classed("kobe-tajima-label", true);
  }

  createGroups() {
    this.wagyuGroup = this.ctr.append("g");
  }

  updateVis(year = 2023) {
    console.log(year);
    const duration = 300;
    const exitTransition = d3.transition().duration(duration);
    const updateTransition = exitTransition.transition().duration(duration);

    const kobeGyuImg = "assets/svg/wagyu-kobe.svg";
    const tajimaGyuImg = "assets/svg/wagyu-tajima.svg";

    const tajimaGyuCount = this.dataset.filter((d) => d.year === year)[0]
      .tajimaGyu;
    const kobeGyuCount = this.dataset.filter((d) => d.year === year)[0].kobeGyu;

    const scaledTajimaGyuCount = (tajimaGyuCount / 10) | 0;
    const scaledKobeGyuCount = (kobeGyuCount / 10) | 0;

    const expandedData = Array.from(
      { length: scaledTajimaGyuCount },
      (_, i) => ({
        index: i,
        isKobeGyu: i < scaledKobeGyuCount,
      })
    );

    this.label.html(
      `
        <h2>Year: ${year}</h2>
        <div style="display: flex; align-items: center;">
          <img src="${kobeGyuImg}" style="width: 40px; height: 40px; margin-right: 10px;">
          <span class="h4">Kobe Gyu: ${kobeGyuCount}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <img src="${kobeGyuImg}" style="width: 40px; height: 40px; margin-right: 10px;">
          <span class="h4">+</span>
          <img src="${tajimaGyuImg}" style="width: 40px; height: 40px; margin-right: 10px;">
          <span class="h4">Tajima Gyu: ${tajimaGyuCount}</span>
        </div>
        `
    );

    this.wagyuGroup
      .selectAll(".wagyu")
      .data(expandedData)
      .join(
        (enter) => enter.append("image").attr("x", this.dimensions.ctrWidth),
        (update) => update,
        (exit) =>
          exit
            .transition(exitTransition)
            .attr("x", this.dimensions.ctrWidth)
            .attr("y", 0)
            .remove()
      )
      .attr("class", "wagyu")
      .transition(updateTransition)
      .attr("xlink:href", (d) => (d.isKobeGyu ? kobeGyuImg : tajimaGyuImg))
      .attr("width", 22)
      .attr("height", 22)
      .attr("x", (d, i) => ((i / 30) | 0) * 24)
      .attr("y", (d, i) => (i % 30) * 24);
  }
}
