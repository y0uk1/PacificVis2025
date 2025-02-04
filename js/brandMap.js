export class BrandMap {
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
    this.drawBrandMap();
  }

  async loadData() {
    const [japanGeo, worldGeo, wagyuBrandList] = await Promise.all([
      d3.json("data/japan.geo.json"),
      d3.json("data/world.geo.json"),
      d3.json("data/wagyu_brand_list.json"),
    ]);

    this.geo = { japan: japanGeo, world: worldGeo };
    this.groupedWagyuList = d3.group(wagyuBrandList, (d) => d.prefecture);
    this.wagyuIcon = {
      white: "assets/svg/wagyu-icon-white.svg",
      black: "assets/svg/wagyu-icon-black.svg",
    };
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

  drawBrandMap() {
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
      .attr("fill", (d) =>
        this.groupedWagyuList.get(d.properties.name_nl) ? "red" : "#DDD6CF"
      )
      .attr("fill-opacity", 0.3);

    this.iconGroup
      .selectAll(".cow-icon")
      .data(
        this.geo.japan.features.filter((d) =>
          this.groupedWagyuList.get(d.properties.name_nl)
        )
      )
      .join("image")
      .attr("class", "cow-icon")
      .attr("xlink:href", this.wagyuIcon.black) // Path to the cow icon image
      .attr("width", 20) // Adjust the size of the icon
      .attr("height", 20)
      .attr("x", (d) => projection(d3.geoCentroid(d))[0] - 10)
      .attr("y", (d) => projection(d3.geoCentroid(d))[1] - 10)
      .on("mouseover", (event, d) => this.onMouseOverBrand(event, d))
      .on("mouseleave", (event, d) => this.onMouseLeaveBrand(event, d));
  }

  drawHyogoMap() {
    const duration = 500;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    // 兵庫県のみを取得
    const hyogoFeature = this.geo.japan.features.find(
      (d) => d.properties.name_nl === "Hyogo"
    );

    // 兵庫県のみを表示
    const projection = this.createProjection(
      { type: "FeatureCollection", features: [hyogoFeature] },
      13000,
      [0, -0.2]
    );
    const path = d3.geoPath().projection(projection);

    this.mapGroup
      .selectAll("path")
      .data([hyogoFeature]) // 兵庫県のみをデータにする
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("fill", "#DDD6CF")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("fill-opacity", 0.6);
  }

  onMouseOverBrand(event, d) {
    const imgBaseDir = "assets/img/raw-meet";
    this.tooltip.style("opacity", 1);
    this.tooltip.style("visibility", "visible");
    d3.select(event.currentTarget).attr("xlink:href", this.wagyuIcon.white);

    const prefecture = d.properties.name_nl;
    const brandData = this.groupedWagyuList.get(prefecture)[0];

    this.tooltip
      .html(
        `
        <div class="card custom-card-2">
          <img class="card-img-top" src="${imgBaseDir}/${brandData.image}" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">${brandData.brand}</h5>
            <h6 class="card-title">${brandData.prefecture} Prefecture</h6>
            <p class="card-text">${brandData.explanation}</p>
          </div>
        </div>
      `
      )
      .style("left", event.offsetX - 440 + "px")
      .style("top", event.offsetY - 350 + "px");

    // <div class="container">
    //       <h2 class="text-center">${brandData.brand}</h2>
    //       <h4 class="text-center">(${brandData.prefecture} Prefecture)</h4>
    //       <div class="row">
    //         <div class="col-8">
    //           <p>${brandData.explanation}</p>
    //         </div>
    //         <div class="col-4">
    //           <img src="${imgBaseDir}/${brandData.image}">
    //         </div>
    //       </div>
    //     </div>
  }

  onMouseMove(event) {
    this.tooltip
      .style("left", event.offsetX + 20 + "px")
      .style("top", event.offsetY + 20 + "px");
  }

  onMouseLeaveBrand(event, d) {
    d3.select(event.currentTarget).attr("xlink:href", this.wagyuIcon.black);
    this.tooltip.style("visibility", "hidden");
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    const currDirection = response.direction;
    switch (currIdx) {
      case 0:
        this.drawBrandMap();
        this.iconGroup.attr("visibility", "visible");
        break;
      default:
        break;
    }
  };
}
