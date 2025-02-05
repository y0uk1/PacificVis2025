import { BeefPartsRate } from "./beefPartsRate.js";
export class BeefPartsMap {
  constructor(_parentElement, _tooltipRate, _tooltipExplanation) {
    this.parentElement = _parentElement;
    this.tooltipExplanation = _tooltipExplanation;

    this.beefPartsRate = new BeefPartsRate(_tooltipRate);

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.tooltipExplanation = d3.select(this.tooltipExplanation);
    // this.createTooltip();
    await this.loadData();
    this.addBeefPartsMap();
    this.updateVis();
  }

  async loadData() {
    this.beefPartsExplanation = await d3.json(
      "data/beef_parts_explanation.json",
      d3.autoType
    );
    const response = await fetch("assets/svg/beef-parts.svg");
    this.beefPartsMapSvg = await response.text();
  }

  setDimensions() {
    this.dimensions = {
      width: 800,
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

  addBeefPartsMap() {
    const scale = 0.8;
    this.beefPartsMapGroup = this.ctr
      .append("g")
      .classed("beef-parts-map-group", true);
    const svgElement = new DOMParser().parseFromString(
      this.beefPartsMapSvg,
      "image/svg+xml"
    ).documentElement;
    this.beefPartsMapGroup.node().appendChild(svgElement);

    this.beefPartsMapGroup.attr("transform", `translate(0,0) scale(${scale})`);
  }

  updateVis() {
    this.beefPartsExplanation.map((item) => {
      d3.selectAll(`#${item.part}`)
        .on("mouseover", (event, d) => this.onMouseOver(event, item))
        .on("mouseleave", (event) => this.onMouseLeave(item));
    });
  }

  onMouseOver(event, item) {
    d3.selectAll(`#parts #${item.part}`)
      .classed("parts-on", true)
      .classed("parts-off", false);
    d3.selectAll(`#letters #${item.part}`)
      .classed("letters-on", true)
      .classed("letters-off", false);

    this.beefPartsRate.updateVis({ ...item });

    this.tooltipExplanation.html(
      `
        <p>${item.explanation}</p>
      `
    );
  }

  // Handle mouseleave event
  onMouseLeave(item) {
    d3.selectAll(`#parts #${item.part}`)
      .classed("parts-off", true)
      .classed("parts-on", false);
    d3.selectAll(`#letters #${item.part}`)
      .classed("letters-off", true)
      .classed("letters-on", false);
    this.beefPartsRate.updateVis();
    this.tooltipExplanation.html("");
  }
}
