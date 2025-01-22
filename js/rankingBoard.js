export class RankingBoard {
  constructor(_parentElement, _dataset) {
    this.parentElement = _parentElement;
    this.dataset = _dataset;

    this.setDimensions();
    this.createSvg();
    this.createGroups();
    this.updateVis();
  }

  // Initialize chart dimensions
  setDimensions() {
    this.dimensions = {
      width: 800,
      height: 600,
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

  // Create the main SVG element
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

  // Create groups for boards and labels
  createGroups() {
    this.boardsGroup = this.ctr.append("g").classed("board", true);
    this.nameLabelsGroup = this.ctr.append("g").classed("board-text", true);
    this.valueLabelsGroup = this.ctr.append("g").classed("board-text", true);
  }

  // Update visualization based on the selected ranking key
  updateVis(rankingKey = "popularity") {
    this.sortDataset(rankingKey);
    const scales = this.createScales(rankingKey);
    const updateTransition = d3.transition().duration(500).ease(d3.easeLinear);

    this.updateBoards(scales, rankingKey, updateTransition);
    this.updateLabels(scales, rankingKey, updateTransition);
  }

  // Sort dataset by the selected ranking key
  sortDataset(rankingKey) {
    this.dataset.sort((a, b) => d3.descending(a[rankingKey], b[rankingKey]));
  }

  // Create scales for x and y axes
  createScales(rankingKey) {
    const xAccessor = (d) => d[rankingKey];
    const yAccessor = (d) => d.name;

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(this.dataset, xAccessor))
      .range([0, this.dimensions.ctrWidth])
      .nice();

    const yScale = d3
      .scaleBand()
      .domain(this.dataset.map(yAccessor))
      .range([this.dimensions.margin.top, this.dimensions.ctrHeight])
      .padding(0.1);

    return { xScale, yScale };
  }

  // Update the board visuals
  updateBoards(scales, rankingKey, transition) {
    const { xScale, yScale } = scales;

    this.boardsGroup
      .selectAll("image")
      .data(this.dataset, (d) => d.name)
      .join("image")
      .attr("xlink:href", (d) => `assets/svg/${d.boardSVG}`)
      .attr("preserveAspectRatio", "none")
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .transition(transition)
      .attr("width", (d) => xScale(d[rankingKey]))
      .attr("y", (d) => yScale(d.name));
  }

  // Update the text labels
  updateLabels(scales, rankingKey, transition) {
    const { yScale } = scales;
    const labelMargin = 10;

    this.nameLabelsGroup
      .selectAll("text")
      .data(this.dataset, (d) => d.name)
      .join("text")
      .attr("x", labelMargin)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .transition(transition)
      .text((d) => `${d.name} (${d.nameJP}): ${d[rankingKey]}`)
      .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2);
  }
}
