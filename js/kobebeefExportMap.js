export class KobebeefExportMap {
  constructor(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.createGroups();
    await this.loadData();
    this.processData();
    this.drawJapanMap();
  }

  async loadData() {
    const [japanGeo, worldGeo, exportDataset] = await Promise.all([
      d3.json("data/japan.geo.json"),
      d3.json("data/world.geo.json"),
      d3.csv("data/amount_of_exported_kobe_beef.csv", (d) => ({
        year: new Date(d.date).getFullYear(),
        exportedTo: d.exportedTo,
        weightKg: +d.weightKg,
      })),
    ]);

    this.geo = { japan: japanGeo, world: worldGeo };
    this.exportDataset = exportDataset;
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
    this.connectionGroup = this.ctr
      .append("g")
      .classed("connection-line", true);
    this.iconGroup = this.ctr.append("g").classed("wagyu-icon", true);
  }

  createStrokeWidthScale(dataset) {
    return d3
      .scaleLinear()
      .domain(d3.extent(dataset, (d) => d.weightKg))
      .range([0, 20]);
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
    const duration = 500;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const projection = this.createProjection(this.geo.japan, 1400);
    const path = d3.geoPath().projection(projection);

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

  drawHyogoMap() {
    const duration = 500;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const testPoints = [
      { x: 498, y: 286, name: "JA-Hyogo-Rokko", farmers: 49 },
      { x: 491, y: 217, name: "JA-Tanba-Sasayama", farmers: 19 },
      { x: 451, y: 177, name: "JA-Tanba-Hikami", farmers: 19 },
      { x: 384, y: 55, name: "JA-Tajima", farmers: 59 },
      { x: 427, y: 245, name: "JA-Minori", farmers: 35 },
      { x: 380, y: 248, name: "JA-Hyogo-Mirai", farmers: 14 },
      { x: 401, y: 312, name: "JA-Hyogo-Minami", farmers: 10 },
      { x: 337, y: 282, name: "JA-Hyogo-Nishi", farmers: 40 },
      { x: 380, y: 248, name: "JA-Hyogo-Nishi", farmers: 40 },
      { x: 316, y: 188, name: "JA-Harima", farmers: 2 },
      { x: 413, y: 417, name: "JA-Awaji-Hinode", farmers: 37 },
      { x: 388, y: 466, name: "JA-Awajishima", farmers: 24 },
    ];

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
      .data([hyogoFeature]) // 兵庫県のみをデータにする
      .join("path")
      .on("click", (event, d) => {
        console.log(event);
        console.log(event.layerX, event.layerY);
      })
      .transition(updateTransition)
      .attr("d", path)
      .attr("fill", "#DDD6CF")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("fill-opacity", 0.6);

    this.ctr
      .selectAll("circle")
      .data(testPoints)
      .join("circle")
      .attr("cx", (d) => d.x - this.dimensions.margin.left)
      .attr("cy", (d) => d.y - this.dimensions.margin.top)
      .attr("r", 3)
      .attr("fill", "red");
  }

  drawExportMap(year = 2024) {
    const duration = 500;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const projection = this.createProjection(this.geo.world, 150, [-115, 10]);
    const path = d3.geoPath().projection(projection);
    const filteredData = this.summarizedExportData.filter(
      (item) => item.year === year
    );
    filteredData.sort((a, b) => b.weightKg - a.weightKg);
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
      .attr("opacity", 0.4)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-width", (d) =>
        widthLengthScale(groupedData.get(d.exportedTo)[0].weightKg)
      );
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
        this.iconGroup.attr("visibility", "visible");
        break;
      case 1:
        this.drawHyogoMap();
        this.iconGroup.attr("visibility", "hidden");
        if (currDirection === "up") {
          this.connectionGroup.attr("visibility", "hidden");
        }
        break;
      case 2:
        this.drawExportMap(2024);
        this.connectionGroup.attr("visibility", "visible");
        break;
      default:
        break;
    }
  };
}
