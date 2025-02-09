export class KobebeefExportMap {
  constructor(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
  }

  async initVis() {
    await this.loadData();
    this.processData();
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.createGroups();
    this.drawJapanMap();
  }

  async loadData() {
    const [japanGeo, worldGeo, exportDataset, farmersDataset] =
      await Promise.all([
        d3.json("data/japan.geo.json"),
        d3.json("data/world.geo.json"),
        d3.csv("data/amount_of_exported_kobe_beef.csv", (d) => ({
          year: new Date(d.date).getFullYear(),
          exportedTo: d.exportedTo,
          weightKg: +d.weightKg,
        })),
        d3.json("data/kobe_beef_farmers.json", d3.autoType),
      ]);

    this.geo = { japan: japanGeo, world: worldGeo };
    this.exportDataset = exportDataset;
    this.farmersDataset = farmersDataset;
  }

  processData() {
    this.summarizedExportData = Array.from(
      d3.rollup(
        this.exportDataset,
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

  createConnections(countries) {
    const countryLocation = {
      "Hong Kong": [114.1094, 22.3964],
      Macau: [113.5438, 22.1987],
      Singapore: [103.8198, 1.352],
      UK: [-3.4359, 55.378],
      Kobe: [138.2529, 36.2048],
      Monaco: [7.4246, 43.7384],
    };

    const connections = countries.map((country) => {
      const countryGeoJson = this.geo.world.features.filter(
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
      width: 800,
      height: 500,
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
    this.svg = d3
      .select(this.parentElement)
      .append("svg")
      .attr("width", this.dimensions.width)
      .attr("height", this.dimensions.height);

    this.ctr = this.svg
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

  createGroups() {
    this.mapGroup = this.ctr.append("g").classed("map", true);
    this.kobeGroup = this.ctr.append("g").classed("kobe", true);
    this.circleGroup = this.ctr.append("g").classed("circle", true);
    this.connectionGroup = this.ctr
      .append("g")
      .classed("connection-line", true);
  }

  createTransition(duration = 500) {
    return d3.transition().duration(duration).ease(d3.easeLinear);
  }

  createStrokeWidthScale(dataset) {
    return d3
      .scaleLinear()
      .domain(d3.extent(dataset, (d) => d.weightKg))
      .range([5, 30]);
  }

  createCircleSizeScale(dataset) {
    return d3
      .scaleLinear()
      .domain(d3.extent(dataset, (d) => d.farmers))
      .range([10, 50]);
  }

  createArrowheadDef() {
    const markerBoxWidth = 10; // 矢印全体のボックスサイズ
    const markerBoxHeight = 10;
    const refX = markerBoxWidth * 0.65; // 矢印の先端を基準点に
    const refY = markerBoxHeight / 2;
    const markerWidth = 4; // スケール調整
    const markerHeight = 4;

    this.svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("markerWidth", markerWidth)
      .attr("markerHeight", markerHeight)
      .attr("viewBox", [0, 0, markerBoxWidth, markerBoxHeight])
      .attr("refX", refX)
      .attr("refY", refY)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M1,1 L9,5 L1,9 L5,5 L1,1") // 矢印形状を調整
      .attr("fill", "orange");
  }

  escapeId(name) {
    // Replace spaces and special characters, and convert to lowercase
    return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  }

  createProjection(geoData, scale, rotate = [0, 0]) {
    const center = d3.geoCentroid(geoData);
    return d3
      .geoMercator()
      .center(center)
      .rotate(rotate)
      .translate([this.dimensions.ctrWidth / 2, this.dimensions.ctrHeight / 2])
      .scale(scale);
  }

  drawJapanMap() {
    const projection = this.createProjection(this.geo.japan, 1400);
    const path = d3.geoPath().projection(projection);
    const updateTransition = this.createTransition();

    this.mapGroup
      .selectAll("path")
      .data(this.geo.japan.features)
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", "#DDD6CF")
      .attr("fill-opacity", 0.3);
  }

  highlightJapanMap() {
    const projection = this.createProjection(this.geo.japan, 1400);
    const path = d3.geoPath().projection(projection);
    const updateTransition = this.createTransition();

    this.mapGroup
      .selectAll("path")
      .data(this.geo.japan.features)
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", (d) =>
        d.properties.name_nl === "Hyogo" ? "red" : "#DDD6CF"
      )
      .attr("fill-opacity", 0.3);
  }

  drawHyogoMap() {
    const updateTransition = this.createTransition();
    // 兵庫県のみを取得
    const hyogoFeature = this.geo.japan.features.find(
      (d) => d.properties.name_nl === "Hyogo"
    );

    // 兵庫県のみを表示
    const projection = this.createProjection(
      { type: "FeatureCollection", features: [hyogoFeature] },
      15500,
      [0, -0.2]
    );
    const path = d3.geoPath().projection(projection);

    this.mapGroup
      .selectAll("path")
      .data([hyogoFeature])
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("fill", "#DDD6CF")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("fill-opacity", 0.6);
  }

  drawKobeDot() {
    const updateTransition = this.createTransition();
    const kobe = { x: 514, y: 297 };
    this.kobeGroup
      .append("circle")
      .attr("cx", kobe.x - this.dimensions.margin.left)
      .attr("cy", kobe.y - this.dimensions.margin.top)
      .attr("r", 8)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .style("opacity", 0)
      .transition(updateTransition)
      .style("opacity", 1);

    this.kobeGroup
      .append("circle")
      .attr("cx", kobe.x - this.dimensions.margin.left)
      .attr("cy", kobe.y - this.dimensions.margin.top)
      .attr("r", 5)
      .attr("fill", "black")
      .style("opacity", 0)
      .transition(updateTransition)
      .style("opacity", 1);

    this.kobeGroup
      .append("text")
      .attr("dominant-baseline", "middle")
      .attr("x", kobe.x - this.dimensions.margin.left + 20)
      .attr("y", kobe.y - this.dimensions.margin.top)
      .attr("font-size", 20)
      .text("Kobe")
      .style("opacity", 0)
      .transition(updateTransition)
      .style("opacity", 1);
  }

  drawDots() {
    const updateTransition = this.createTransition();
    this.circleGroup
      .selectAll("circle")
      .data(this.farmersDataset)
      .join("circle")
      .attr("cx", (d) => d.x - this.dimensions.margin.left)
      .attr("cy", (d) => d.y - this.dimensions.margin.top)
      .style("opacity", 0)
      .attr("fill", "#cbb460")
      .attr("visibility", "visible")
      .on("mouseover", (event, d) => this.onMouseOverFarmer(event, d))
      .on("mouseleave", (event, d) => this.onMouseLeaveFarmer(event, d))
      .transition(updateTransition)
      .attr("r", 5)
      .style("opacity", 1);
  }

  drawBubbleChart() {
    const updateTransition = this.createTransition();
    const circleSizeScale = this.createCircleSizeScale(this.farmersDataset);
    this.circleGroup
      .selectAll("circle")
      .data(this.farmersDataset)
      .join("circle")
      .attr("id", (d) => d.id)
      .attr("cx", (d) => d.x - this.dimensions.margin.left)
      .attr("cy", (d) => d.y - this.dimensions.margin.top)
      .attr("fill", "#cbb460")
      .style("opacity", 1)
      .attr("visibility", "visible")
      .on("mouseover", (event, d) => this.onMouseOverFarmer(event, d))
      .on("mousemove", (event, d) => this.onMouseMove(event))
      .on("mouseleave", (event, d) => this.onMouseLeaveFarmer(event, d))
      .transition(updateTransition)
      .attr("r", (d) => circleSizeScale(d.farmers));

    this.circleGroup
      .selectAll("text")
      .data(this.farmersDataset)
      .join("text")
      .attr("x", (d) => d.x - this.dimensions.margin.left)
      .attr("y", (d) => d.y - this.dimensions.margin.top)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle")
      .on("mouseover", (event, d) => this.onMouseOverFarmer(event, d))
      .on("mousemove", (event, d) => this.onMouseMove(event))
      .on("mouseleave", (event, d) => this.onMouseLeaveFarmer(event, d))
      .transition(updateTransition)
      .attr("fill", "white")
      .style("opacity", 1)
      .attr("visibility", "visible")
      .text((d) => d.farmers);
  }

  toggleOpacity(isCircle, isFarmerNumber, isKobe, isConnection, isVisible) {
    const updateTransition = this.createTransition();

    if (isCircle) {
      this.circleGroup
        .selectAll("circle")
        .transition(updateTransition)
        .style("opacity", isVisible ? 1 : 0)
        .attr("visibility", isVisible ? "visible" : "hidden");
    }
    if (isFarmerNumber) {
      this.circleGroup
        .selectAll("text")
        .transition(updateTransition)
        .style("opacity", isVisible ? 1 : 0)
        .attr("visibility", isVisible ? "visible" : "hidden");
    }
    if (isKobe) {
      this.kobeGroup
        .selectAll("circle")
        .transition(updateTransition)
        .style("opacity", isVisible ? 1 : 0)
        .attr("visibility", isVisible ? "visible" : "hidden");
      this.kobeGroup
        .selectAll("text")
        .transition(updateTransition)
        .style("opacity", isVisible ? 1 : 0)
        .attr("visibility", isVisible ? "visible" : "hidden");
    }
    if (isConnection) {
      this.connectionGroup
        .selectAll("path")
        .transition(updateTransition)
        .style("opacity", isVisible ? 1 : 0)
        .attr("visibility", isVisible ? "visible" : "hidden");
    }
  }

  drawExportMap(year = 2024) {
    const updateTransition = this.createTransition();
    const projection = this.createProjection(this.geo.world, 150, [-115, 10]);
    const path = d3.geoPath().projection(projection);
    const filteredData = this.summarizedExportData.filter(
      (item) => item.year === year
    );
    filteredData.sort((a, b) => b.weightKg - a.weightKg);
    console.log(filteredData);
    const groupedData = d3.group(filteredData, (d) => d.exportedTo);
    const countries = Array.from(groupedData.keys());
    const connections = this.createConnections(countries);
    const widthLengthScale = this.createStrokeWidthScale(
      this.summarizedExportData
    );

    this.mapGroup
      .selectAll("path")
      .data(this.geo.world.features)
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", (d) =>
        this.escapeId(d.properties.name) === "japan" ? "red" : "#DDD6CF"
      )
      .attr("fill-opacity", 0.3)
      .attr("id", (d) => this.escapeId(d.properties.name));

    this.createArrowheadDef();
    this.connectionGroup
      .selectAll("path")
      .data(connections)
      .join("path")
      .on("mouseover", (event, d) =>
        this.onMouseOverExport(event, d, groupedData)
      )
      .on("mousemove", (event, d) => this.onMouseMove(event))
      .on("mouseleave", (event, d) => this.onMouseLeaveExport(event, d))
      .transition(updateTransition)
      .delay((d, i) => i * 500)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .style("opacity", 0.4)
      .attr("visibility", "visible")
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-width", (d) =>
        widthLengthScale(groupedData.get(d.exportedTo)[0].weightKg)
      );
  }

  onMouseOverFarmer(event, d) {
    d3.select(`#${d.id}`).attr("fill", "#DBC88F");
    this.tooltip.style("opacity", 1);
    this.tooltip.style("visibility", "visible");

    this.tooltip
      .html(
        `
        <div class="card bg-base-100">
          <div class="card-body">
            <h5 class="card-title">${d.name} (${d.nameJP})</h5>
          </div>
        </div>
      `
      )
      .style("left", event.offsetX + 20 + "px")
      .style("top", event.offsetY + 20 + "px");
  }

  onMouseLeaveFarmer(event, d) {
    d3.select(`#${d.id}`).attr("fill", "#cbb460");
    this.tooltip.style("visibility", "hidden");
  }

  onMouseOverExport(event, d, exportData) {
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
        <div class="card bg-base-100">
          <div class="card-body">
            <h5 class="card-title">${d.exportedTo}</h5>
            <h6 class="card-title">${weightKg}kg</h6>
          </div>
        </div>
      `
      )
      .style("left", event.offsetX + 20 + "px")
      .style("top", event.offsetY + 20 + "px");
  }

  onMouseMove(event) {
    this.tooltip
      .style("left", event.offsetX + 20 + "px")
      .style("top", event.offsetY + 20 + "px");
  }

  onMouseLeaveExport(event, d) {
    d3.select(event.target).style("opacity", 0.4);
    this.tooltip.style("visibility", "hidden");

    const countryId = this.escapeId(d.exportedTo);
    d3.select(`#${countryId}`).attr("fill", "#DDD6CF");
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    const currDirection = response.direction;
    switch (currIdx) {
      case 0:
        this.drawJapanMap();
        break;
      case 1:
        this.highlightJapanMap();
        if (currDirection === "up") {
          this.toggleOpacity(true, false, true, false, false);
        }
        break;
      case 2:
        this.drawHyogoMap();
        this.drawKobeDot();
        if (currDirection === "up") {
          this.toggleOpacity(true, false, false, false, false);
        }
        break;
      case 3:
        this.drawDots();
        this.toggleOpacity(false, false, true, false, false);
        if (currDirection === "up") {
          this.toggleOpacity(false, true, false, false, false);
        }
        break;
      case 4:
        this.drawBubbleChart();
        if (currDirection === "up") {
          this.toggleOpacity(false, false, false, true, false);
          this.drawHyogoMap();
        }
        break;
      case 5:
        this.drawExportMap(2024);
        this.toggleOpacity(true, true, false, false, false);
        break;
      default:
        break;
    }
  };
}
