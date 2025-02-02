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
      width: 750,
      height: 500,
      margin: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
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
    this.kanbansGroup = this.ctr.append("g").classed("kanban", true);
    this.barsGroup = this.ctr.append("g").classed("bar", true);
    this.nameLabelsGroup = this.ctr.append("g").classed("bar-text", true);
  }

  // Update visualization based on the selected ranking key
  updateVis(rankingKey = "popularity") {
    this.sortDataset(rankingKey);
    const scales = this.createScales(rankingKey);
    const updateTransition = d3.transition().duration(500).ease(d3.easeLinear);

    this.updateBoards(scales, rankingKey, updateTransition);
    this.updateLabels(scales, rankingKey, updateTransition);
    this.updateKanbans(scales, updateTransition);
    this.kanbansGroup
      .append("image")
      .attr("class", "kanban-rope")
      .attr("xlink:href", "assets/svg/kanban_rope.svg")
      .attr("preserveAspectRatio", "none")
      .attr("transform", "rotate(0.5)")
      .attr("width", this.dimensions.ctrWidth);
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
      .range([0, this.dimensions.ctrWidth])
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
    const svgBaseDir = "assets/svg";
    const { xScale, yScale } = scales;

    this.barsGroup
      .selectAll("image")
      .data(this.dataset, (d) => d.name)
      .join("image")
      .attr("id", (d) => d.id)
      .attr("xlink:href", (d) => `${svgBaseDir}/${d.boardSVG}`)
      .attr("preserveAspectRatio", "none")
      .attr("width", xScale.bandwidth())
      .attr("y", 150)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.5);
        this.kanbansGroup.selectAll(`#${d.id}`).attr("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 1);
        this.kanbansGroup.selectAll(`#${d.id}`).attr("opacity", 1);
      })
      .transition(transition)
      .attr("height", (d) => yScale(d[rankingKey]))
      .attr("x", (d) => xScale(d.name));
  }

  updateKanbans(scales, transition) {
    const imgBaseDir = "assets/img/wagyu-brand-kanban";
    const { xScale } = scales;

    this.kanbansGroup
      .selectAll("image:not(.kanban-rope)")
      .data(this.dataset, (d) => d.name)
      .join("image")
      .attr("id", (d) => d.id)
      .attr("xlink:href", (d) => `${imgBaseDir}/${d.kanbanImg}`)
      .attr("width", xScale.bandwidth())
      .attr("y", 8)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.5);
        this.barsGroup.selectAll(`#${d.id}`).attr("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 1);
        this.barsGroup.selectAll(`#${d.id}`).attr("opacity", 1);
      })
      .transition(transition)
      .attr("x", (d) => xScale(d.name));
  }

  // Update the text labels
  updateLabels(scales, rankingKey, transition) {
    const { xScale } = scales;
    const labelMargin = 160;

    this.nameLabelsGroup
      .selectAll("text")
      .data(this.dataset, (d) => d.name)
      .join("text")
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .attr("x", labelMargin)
      .attr("transform", "rotate(90)")
      .on("mouseover", (event, d) => {
        this.barsGroup.selectAll(`#${d.id}`).attr("opacity", 0.5);
        this.kanbansGroup.selectAll(`#${d.id}`).attr("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        this.barsGroup.selectAll(`#${d.id}`).attr("opacity", 1);
        this.kanbansGroup.selectAll(`#${d.id}`).attr("opacity", 1);
      })
      .transition(transition)
      .text((d) => {
        const dollarYen = 155;
        const name = d.name.split(" ")[0];
        if (rankingKey !== "priceYen") {
          return name;
        }
        const priceDollar = (d.priceYen / dollarYen).toFixed(1);
        return `${name} ($${priceDollar})`;
      })
      .attr("y", (d) => -xScale(d.name) - xScale.bandwidth() / 2);
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    switch (currIdx) {
      case 0:
        this.updateVis("popularity");
        break;
      case 1:
        this.updateVis("priceYen");
        break;
      case 2:
        this.updateVis("wantToTry");
        break;
      default:
        break;
    }
  };
}
