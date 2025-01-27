export class RankingBoard {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.initVis();
  }

  async initVis() {
    await this.loadData();
    this.setDimensions();
    this.createSvg();
    this.createGroups();
    this.updateVis();
  }

  async loadData() {
    this.dataset = await d3.csv("data/wagyu_ranking.csv", d3.autoType);
  }

  // Initialize chart dimensions
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
    const xAccessor = (d) => d.name;
    const yAccessor = (d) => d[rankingKey];

    const xScale = d3
      .scaleBand()
      .domain(this.dataset.map(xAccessor))
      .range([0, this.dimensions.ctrHeight])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(this.dataset, yAccessor))
      .range([0, this.dimensions.ctrHeight])
      .nice();

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
      .attr("width", xScale.bandwidth())
      .attr("y", 0)
      .transition(transition)
      .attr("height", (d) => yScale(d[rankingKey]))
      .attr("x", (d) => xScale(d.name));
  }

  // Update the text labels
  updateLabels(scales, rankingKey, transition) {
    const { xScale } = scales;
    const labelMargin = 10;

    this.nameLabelsGroup
      .selectAll("text")
      .data(this.dataset, (d) => d.name)
      .join("text")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .attr("x", labelMargin)
      .attr("transform", "rotate(90)")
      .transition(transition)
      .text((d) => `${d.name}: ${d[rankingKey]}`)
      .attr("y", (d) => -xScale(d.name) - xScale.bandwidth() / 2);
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    switch (currIdx) {
      case 0:
        this.updateVis("popularity");
        break;
      case 1:
        this.updateVis("price");
        break;
      case 2:
        this.updateVis("wantToTry");
        break;
      default:
        break;
    }
  };
}
