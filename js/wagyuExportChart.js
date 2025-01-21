export class WagyuExportChart {
  constructor(parentElement, dataset) {
    this.parentElement = parentElement;
    this.dataset = dataset;
    this.initVis();
  }

  initVis() {
    this.setDimensions();
    this.setAccessors();
    this.createSvg();
    this.processData();
    this.setScales();
    this.createAxes();
    this.createGroups();
    this.updateVis();
  }

  setDimensions() {
    this.dimensions = {
      width: 800,
      height: 600,
      margin: { top: 10, right: 30, bottom: 80, left: 60 },
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

  setAccessors() {
    this.xAccessor = (d) => d.year;
    this.yAccessor = (d) => d.amount;
    this.countryAccessor = (d) => d.country;
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

  processData() {
    this.summarizedData = Array.from(
      d3.rollup(
        this.dataset,
        (values) => ({
          amount: d3.sum(values, (d) => d.amount / 1000),
          value: d3.sum(values, (d) => d.value),
          country_jp: values[0].country_jp,
        }),
        (d) => d.year,
        (d) => d.country
      ),
      ([year, countryMap]) =>
        Array.from(countryMap, ([country, data]) => ({
          year,
          country,
          ...data,
        }))
    ).flat();
  }

  setScales() {
    this.xScale = d3
      .scaleLinear()
      .domain(d3.extent(this.summarizedData, this.xAccessor))
      .range([0, this.dimensions.ctrWidth])
      .nice();

    this.yScale = d3.scaleLinear().rangeRound([this.dimensions.ctrHeight, 0]);
  }

  createAxes() {
    this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.format("d"));
    this.xAxisGroup = this.ctr
      .append("g")
      .attr("transform", `translate(0, ${this.dimensions.ctrHeight})`)
      .call(this.xAxis);

    this.yAxisGroup = this.ctr
      .append("g")
      .attr("transform", "translate(0, 0)")
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", this.dimensions.ctrWidth)
          .attr("stroke-opacity", 0.1)
      );

    const xLabel = this.xAxisGroup
      .append("text")
      .attr("class", "x axisLabel")
      .attr("y", 30)
      .attr("x", this.dimensions.ctrWidth / 2)
      .attr("font-size", "14px")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text("FY");
  }

  createGroups() {
    this.stackChartGroup = this.ctr.append("g").classed("stack-chart", true);

    this.tooltip = d3.select(this.parentElement).select("tooltip");
  }

  updateVis(mode = "stackedAreaChart") {
    const duration = 300;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const countries = d3.union(this.summarizedData.map((d) => d.country));
    const color = d3
      .scaleOrdinal()
      .domain(countries)
      .range(d3.schemeOranges[3]);

    const data =
      mode === "stackedAreaChart"
        ? this.getStackedData()
        : this.getGroupedData();

    this.updateScales(data, mode);
    this.updateAxes(updateTransition);
    this.drawPaths(data, mode, color, updateTransition);
  }

  getStackedData() {
    return d3
      .stack()
      .keys(d3.union(this.summarizedData.map((d) => d.country)))
      .value(([, group], key) => {
        const entry = group.get(key);
        return entry ? entry.amount : 0;
      })(
      d3.index(
        this.summarizedData,
        (d) => d.year,
        (d) => d.country
      )
    );
  }

  getGroupedData() {
    return Array.from(d3.group(this.summarizedData, (d) => d.country));
  }

  updateScales(data, mode) {
    if (mode === "stackedAreaChart") {
      this.yScale.domain([0, d3.max(data, (d) => d3.max(d, (d) => d[1]))]);
    } else {
      this.yScale.domain(d3.extent(this.summarizedData, this.yAccessor));
    }
  }

  updateAxes(updateTransition) {
    const yAxis = d3.axisLeft(this.yScale).tickFormat((d) => `${d}t`);
    this.yAxisGroup.transition(updateTransition).call(yAxis);
  }

  drawPaths(data, mode, color, updateTransition) {
    const area = d3
      .area()
      .x((d) => this.xScale(d.data[0]))
      .y0((d) => this.yScale(d[0]))
      .y1((d) => this.yScale(d[1]));

    const line = d3
      .line()
      .x((d) => this.xScale(this.xAccessor(d)))
      .y((d) => this.yScale(this.yAccessor(d)));

    this.stackChartGroup
      .selectAll("path")
      .data(data)
      .join("path")
      .transition(updateTransition)
      .attr(
        "d",
        mode === "stackedAreaChart" ? area : ([, values]) => line(values)
      )
      .attr("fill", mode === "stackedAreaChart" ? (d) => color(d.key) : "none")
      .attr(
        "stroke",
        mode === "stackedAreaChart" ? "none" : (d) => color(d[0])
      );
  }
}
