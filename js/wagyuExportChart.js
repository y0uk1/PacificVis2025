export class WagyuExportChart {
  constructor(parentElement) {
    this.parentElement = parentElement;
    this.initVis();
  }

  async initVis() {
    await this.loadData();
    this.setDimensions();
    this.setAccessors();
    this.createSvg();
    this.processData();
    this.setScales();
    this.createAxes();
    this.createGroups();
    this.updateVis("stackedAreaChart", 2012);
  }

  async loadData() {
    this.dataset = await d3.csv(
      "data/amount_value_of_exported_beef.csv",
      d3.autoType
    );
  }

  setDimensions() {
    this.dimensions = {
      width: 700,
      height: 500,
      margin: { top: 80, right: 20, bottom: 50, left: 80 },
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
    const countryGroups = {
      "Hong Kong": "hongkong",
      Taiwan: "taiwan",
      USA: "usa",
      Cambodia: "cambodia",
      Singapore: "singapore",
      Thailand: "thailand",
    };

    this.summarizedData = Array.from(
      d3.rollup(
        this.dataset,
        (values) => ({
          amount: d3.sum(values, (d) => d.amount / 1000),
          value: d3.sum(values, (d) => d.value),
          country_jp: values[0].country_jp,
        }),
        (d) => d.year,
        (d) => countryGroups[d.country] || "others"
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

    const countries = d3.union(this.summarizedData.map((d) => d.country));
    this.colorScale = d3
      .scaleOrdinal()
      .domain(countries)
      .range([
        "#fbb4ae",
        "#b3cde3",
        "#ccebc5",
        "#decbe4",
        "#fed9a6",
        "#fddaec",
        "#e5d8bd",
      ]);
  }

  createAxes() {
    this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.format("d"));
    this.xAxisGroup = this.ctr
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.dimensions.ctrHeight})`)
      .call(this.xAxis);

    this.yAxisGroup = this.ctr
      .append("g")
      .attr("transform", "translate(0, 0)")
      .attr("class", "y-axis")
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
      .attr("class", "x-axisLabel")
      .attr("y", 40)
      .attr("x", this.dimensions.ctrWidth / 2)
      .text("Year");

    const yLabel = this.yAxisGroup
      .append("text")
      .attr("class", "y-axisLabel")
      .attr("y", -60)
      .attr("x", -this.dimensions.ctrHeight / 2)
      .attr("transform", "rotate(-90)")
      .text("Export Volume");
  }

  createGroups() {
    this.chartGroup = this.ctr.append("g").classed("chart", true);
    this.legend = this.ctr.append("g").attr("transform", "translate(50, -25)");
  }

  updateVis(mode, year) {
    const duration = 100;
    const updateTransition = d3.transition().duration(duration);

    const data =
      mode === "stackedAreaChart"
        ? this.getStackedData(year)
        : this.getGroupedData(year);

    this.updateScales(mode);
    this.updateAxes(updateTransition);
    this.drawPaths(data, mode, updateTransition);
    this.addLegend();
  }

  getYearFilteredData(year) {
    return this.summarizedData.filter((d) => d.year <= year);
  }

  getStackedData(year) {
    const filteredData = this.getYearFilteredData(year);

    const countryOrder = [
      "others",
      "thailand",
      "singapore",
      "cambodia",
      "usa",
      "hongkong",
      "taiwan",
    ];

    return d3
      .stack()
      .keys(countryOrder)
      .value(([, group], key) => {
        const entry = group.get(key);
        return entry ? entry.amount : 0;
      })(
      d3.index(
        filteredData,
        (d) => d.year,
        (d) => d.country
      )
    );
  }

  getGroupedData(year) {
    const filteredData = this.getYearFilteredData(year);
    return Array.from(d3.group(filteredData, (d) => d.country));
  }

  updateScales(mode) {
    if (mode === "stackedAreaChart") {
      const data = this.getStackedData(2024);
      this.yScale.domain([0, d3.max(data, (d) => d3.max(d, (d) => d[1]))]);
    } else {
      this.yScale.domain(d3.extent(this.summarizedData, this.yAccessor));
    }
  }

  updateAxes(updateTransition) {
    const yAxis = d3.axisLeft(this.yScale).tickFormat((d) => `${d}t`);
    this.yAxisGroup.transition(updateTransition).call(yAxis);
  }

  drawPaths(data, mode, updateTransition) {
    const area = d3
      .area()
      .x((d) => this.xScale(d.data[0]))
      .y0((d) => this.yScale(d[0]))
      .y1((d) => this.yScale(d[1]));

    const line = d3
      .line()
      .x((d) => this.xScale(this.xAccessor(d)))
      .y((d) => this.yScale(this.yAccessor(d)));

    this.chartGroup
      .selectAll("path")
      .data(data)
      .join("path")
      .transition(updateTransition)
      .attr("id", (d) => (mode === "stackedAreaChart" ? d.key : d[0]))
      .attr(
        "d",
        mode === "stackedAreaChart" ? area : ([, values]) => line(values)
      )
      .attr(
        "fill",
        mode === "stackedAreaChart" ? (d) => this.colorScale(d.key) : "none"
      )
      .attr(
        "stroke",
        mode === "stackedAreaChart" ? "none" : (d) => this.colorScale(d[0])
      )
      .attr("stroke-width", 4);
  }

  addLegend() {
    const legendArray = [
      { label: "Taiwan", id: "taiwan" },
      { label: "Hong Kong", id: "hongkong" },
      { label: "USA", id: "usa" },
      { label: "Cambodia", id: "cambodia" },
      { label: "Singapore", id: "singapore" },
      { label: "Thailand", id: "thailand" },
      { label: "Others", id: "others" },
    ];

    const legendCol = this.legend
      .selectAll(".legendCol")
      .data(legendArray)
      .enter()
      .append("g")
      .attr("class", "legendCol")
      .attr(
        "transform",
        (d, i) => `translate(${(i % 4) * 140}, ${((i / 4) | 0) * 30 - 30})`
      )
      .attr("id", (d) => d.id);

    legendCol
      .append("rect")
      .attr("class", "legendRect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", (d) => this.colorScale(d.id))
      .on("mouseover", (event, d) => this.onMouseOver(d))
      .on("mouseleave", () => this.onMouseLeave());

    legendCol
      .append("text")
      .attr("class", "legendText")
      .attr("x", 20)
      .attr("y", 10)
      .attr("text-anchor", "start")
      .text((d) => d.label)
      .on("mouseover", (event, d) => this.onMouseOver(d))
      .on("mouseleave", () => this.onMouseLeave());
  }

  onMouseOver(d) {
    d3.selectAll(".legendCol").attr("opacity", 0.1);
    d3.selectAll(".chart path").attr("opacity", 0.1);
    d3.selectAll(`#${d.id}`).attr("opacity", 1);
  }

  onMouseLeave() {
    d3.selectAll(".legendCol").attr("opacity", 1);
    d3.selectAll(".chart path").attr("opacity", 1);
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    if (currIdx < 13) {
      this.updateVis("stackedAreaChart", currIdx + 2012);
    } else {
      this.updateVis("lineChart", 2024);
    }
  };
}
