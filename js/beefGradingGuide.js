export class BeefGradingGuide {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.countryFlags = {
      Japan: "assets/svg/Japan.svg",
      Australia: "assets/svg/Australia.svg",
      USA: "assets/svg/USA.svg",
    };

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    await this.loadData();
    this.updateVis();
  }

  async loadData() {
    this.dataset = await d3.json("data/beef_grading.json", d3.autoType);
  }

  setDimensions() {
    this.dimensions = {
      width: 500,
      height: 700,
      margin: {
        top: 100,
        right: 0,
        bottom: 0,
        left: 100,
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

  createGroups() {
    this.labelGroups = svg.append("g");
    this.countryMarkGroups = svg.append("g");
  }

  getCountryUnion(country) {
    return d3.union(
      this.dataset.filter((d) => d.country === country).map((d) => d.grade)
    );
  }

  updateVis() {
    const series = d3
      .stack()
      .keys(d3.union(this.dataset.map((d) => d.grade))) // distinct series keys, in input order
      .value(([, D], key) => (D.get(key) ? D.get(key).bms : 0))(
      // get value for each series key and stack
      d3.index(
        this.dataset,
        (d) => d.country,
        (d) => d.grade
      )
    ); // group by stack then series key

    const countries = Array.from(new Set(this.dataset.map((d) => d.country)));

    const colorScales = {
      Japan: d3
        .scaleOrdinal()
        .domain(this.getCountryUnion("Japan"))
        .range(d3.schemeOranges[5]),
      Australia: d3
        .scaleOrdinal()
        .domain(this.getCountryUnion("Australia"))
        .range(d3.schemeBlues[9]),
      USA: d3
        .scaleOrdinal()
        .domain(this.getCountryUnion("Japan"))
        .range(d3.schemeGreys[3]),
    };

    const xScale = d3
      .scaleBand()
      .domain(countries)
      .range([0, this.dimensions.ctrWidth])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
      .rangeRound([this.dimensions.ctrHeight, 0]);

    this.ctr
      .append("g")
      .selectAll("image")
      .data(series)
      .join("image")
      .attr("xlink:href", (d) => `assets/img/bms/bms${d.key}.png`) // Use the flag URL based on the country
      .attr("x", (d) => xScale(d[0].data[0]))
      .attr("y", (d) => yScale(d[0][1]))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale(0) - yScale(1) - 1);

    this.ctr
      .append("g")
      .selectAll()
      .data(series)
      .join("g")
      .selectAll("rect")
      .data((D) => D.map((d) => ((d.key = D.key), d)))
      .join("rect")
      .attr("fill", (d) => {
        const country = d.data[0];
        return country === "BMS" ? "white" : colorScales[country](d.key); // Use the country's color scale
      })
      .attr("x", (d) => xScale(d.data[0]))
      .attr("y", (d) => yScale(d[1]))
      .attr("opacity", (d) => (d.data[0] === "BMS" ? 0 : 1))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .on("mouseover", (event, d) => {
        console.log(d);
      });

    this.ctr
      .append("g")
      .selectAll()
      .data(series)
      .join("g")
      .selectAll("text")
      .data((D) => D.map((d) => ((d.key = D.key), d)))
      .join("text")
      .text((d) => d.data[1]?.get(d.key)?.gradeName)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .attr("x", (d) =>
        d.data[0] === "BMS"
          ? xScale(d.data[0]) - xScale.bandwidth() / 3
          : xScale(d.data[0]) + xScale.bandwidth() / 2
      )
      .attr("y", (d) => yScale(d[1]) + (yScale(d[0]) - yScale(d[1])) / 2);

    this.ctr
      .append("g")
      .selectAll("image")
      .data(series[series.length - 1])
      .join("image")
      .attr("xlink:href", (d) => this.countryFlags[d.data[0]]) // Use the flag URL based on the country
      .attr("x", (d) => xScale(d.data[0]) - 25 + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d[1]) - 60)
      .attr("width", 50)
      .attr("height", 50);
  }

  // onMouseOver(event, item) {

  // }
}
