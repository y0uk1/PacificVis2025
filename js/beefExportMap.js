export class BeefExportMap {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.createGroups();
    this.createYearLabel();
    await this.loadData();
    this.processData();
    this.updateVis();
  }

  async loadData() {
    this.geoJson = await d3.json("data/world.geo.json");
    this.dataset = await d3.csv(
      "data/amount_of_exported_kobe_beef.csv",
      (d) => ({
        year: new Date(d.date).getFullYear(),
        exportedTo: d.exportedTo,
        weightKg: +d.weightKg,
      })
    );
  }

  processData() {
    this.summarizedData = Array.from(
      d3.rollup(
        this.dataset,
        (values) => ({
          weightKg: d3.sum(values, (d) => d.weightKg),
          exportedTo: values[0].exportedTo,
        }),
        (d) => d.year,
        (d) => d.exportedTo
      ),
      ([year, countryMap]) =>
        Array.from(countryMap, ([exportedTo, data]) => ({
          year,
          exportedTo,
          ...data,
        }))
    ).flat();
  }

  createConnectData(countries) {
    const countryLocation = {
      "Hong Kong": [114.1094, 22.3964],
      Macau: [113.5438, 22.1987],
      Singapore: [103.8198, 1.352],
      UK: [-3.4359, 55.378],
      Kobe: [138.2529, 36.2048],
      Monaco: [7.4246, 43.7384],
    };

    const connections = countries.map((country) => {
      const countryGeoJson = this.geoJson.features.filter(
        (item) => item.properties.name === country
      )[0];

      const countryCoordinates = countryGeoJson
        ? d3.geoCentroid(countryGeoJson)
        : [0, 0]; // default coordinate

      return {
        type: "LineString",
        exportedTo: country,
        coordinates: [
          countryLocation.Kobe,
          country in countryLocation
            ? countryLocation[country]
            : countryCoordinates,
        ],
      };
    });

    return connections;
  }

  setDimensions() {
    this.dimensions = {
      width: 1200,
      height: 800,
      margin: {
        top: 60,
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

  createTooltip() {
    this.tooltip = d3
      .select(this.parentElement)
      .append("div")
      .classed("tooltip", true);
  }

  createYearLabel() {
    this.yearLabel = this.ctr
      .append("text")
      .attr("fill", "black")
      .attr("font-size", "20px")
      .attr("x", 0)
      .attr("y", this.dimensions.ctrHeight);
  }

  createGroups() {
    this.mapGroup = this.ctr.append("g").classed("map", true);
    this.connectionGroup = this.ctr
      .append("g")
      .classed("connection-line", true);
  }

  createStrokeLengthScale(dataset) {
    return d3
      .scaleLinear()
      .domain(d3.extent(dataset, (d) => d.weightKg))
      .range([0, 40]);
  }

  escapeId(name) {
    // Replace spaces and special characters, and convert to lowercase
    return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  }

  updateVis(year = 2023) {
    const duration = 300;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const scale = 200;
    const center = d3.geoCentroid(this.geoJson);
    const projection = d3
      .geoMercator()
      .center(center)
      .rotate([-140, 0])
      .translate([this.dimensions.ctrWidth / 2, this.dimensions.ctrHeight / 2])
      .scale(scale);

    const filteredData = this.summarizedData.filter(
      (item) => item.year === year
    );
    const groupedData = d3.group(filteredData, (d) => d.exportedTo);
    const countries = Array.from(groupedData.keys());

    const connections = this.createConnectData(countries);

    const path = d3.geoPath().projection(projection);
    const widthLengthScale = this.createStrokeLengthScale(this.summarizedData);

    this.yearLabel.text(year);

    // draw map
    this.mapGroup
      .selectAll("path")
      .data(this.geoJson.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", "white")
      .attr("fill-opacity", 0.3)
      .attr("id", (d) => this.escapeId(d.properties.name));

    this.connectionGroup
      .selectAll("path")
      .data(connections)
      .join("path")
      .on("mouseover", (event, d) => this.onMouseOver(event, d, groupedData))
      .on("mousemove", (event, d) => this.onMouseMove(event))
      .on("mouseleave", (event, d) => this.onMouseLeave(event, d))
      .transition(updateTransition)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("opacity", 0.4)
      .attr("stroke-width", (d) =>
        widthLengthScale(groupedData.get(d.exportedTo)[0].weightKg)
      );
  }

  onMouseOver(event, d, exportData) {
    const format = d3.format(".2f");

    d3.select(event.target).style("opacity", 1);

    const countryId = this.escapeId(d.exportedTo);
    d3.select(`#${countryId}`).attr("fill", "orange").attr("fill-opacity", 0.7);

    this.tooltip.style("opacity", 1);
    this.tooltip.style("visibility", "visible");

    const weightKg = format(exportData.get(d.exportedTo)[0].weightKg);
    this.tooltip
      .html(
        `
        <p>${d.exportedTo}</p>
        <p>${weightKg}kg</p>
      `
      )
      .style("left", event.pageX + 20 + "px")
      .style("top", event.pageY + 20 + "px");
  }

  // Handle mousemove event
  onMouseMove(event) {
    this.tooltip
      .style("left", event.pageX + 20 + "px")
      .style("top", event.pageY + 20 + "px");
  }

  // Handle mouseleave event
  onMouseLeave(event, d) {
    d3.select(event.target).style("opacity", 0.4);
    this.tooltip.style("visibility", "hidden");

    const countryId = this.escapeId(d.exportedTo);
    d3.select(`#${countryId}`).attr("fill", "orange").attr("fill-opacity", 0);
  }
}
