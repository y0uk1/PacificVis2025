export class BeefPartsMap {
  constructor(_parentElement, _tooltipElement) {
    this.parentElement = _parentElement;
    this.tooltipElement = _tooltipElement;

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createGroups();
    this.createTooltip();
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
      height: 600,
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30,
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

  createTooltip() {
    this.tooltip = d3
      .select(`${this.tooltipElement}`)
      .append("div")
      .classed("beef-parts-tooltip", true);
  }

  createGroups() {}

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
    const beefPartsSvg = d3.select("#beef-parts");
    console.log(event.pageY);

    d3.selectAll(`#parts #${item.part}`)
      .classed("parts-on", true)
      .classed("parts-off", false);
    d3.selectAll(`#letters #${item.part}`)
      .classed("letters-on", true)
      .classed("letters-off", false);

    this.tooltip.style("opacity", 1);
    this.tooltip.style("visibility", "visible");

    const lowFatStars = "★".repeat(item.lowFat) + "☆".repeat(5 - item.lowFat);
    const tendernessStars =
      "★".repeat(item.tenderness) + "☆".repeat(5 - item.tenderness);
    const rarityStars = "★".repeat(item.rarity) + "☆".repeat(5 - item.rarity);

    this.tooltip
      .html(
        `
        <h2 class="text-center">${item.name}</h2>
        <p>Low Fat: ${lowFatStars}</p>
        <p>Tenderness: ${tendernessStars}</p>
        <p>Rarity: ${rarityStars}</p>
        <p>${item.explanation}</p>
      `
      )
      .style("right", "10px")
      .style("width", "500px");
  }

  // Handle mouseleave event
  onMouseLeave(item) {
    d3.selectAll(`#parts #${item.part}`)
      .classed("parts-off", true)
      .classed("parts-on", false);
    d3.selectAll(`#letters #${item.part}`)
      .classed("letters-off", true)
      .classed("letters-on", false);
    this.tooltip.style("visibility", "hidden");
  }
}
