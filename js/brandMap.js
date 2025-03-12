export class BrandMap {
  constructor(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
  }

  async initVis() {
    await this.loadData();
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.createGroups();
    this.createLegend();
    this.drawBrandMap();
  }

  async loadData() {
    const [japanGeo, wagyuBrandList] = await Promise.all([
      d3.json("data/japan.geo.json"),
      d3.json("data/wagyu_brand_list.json"),
    ]);

    this.geo = japanGeo;
    this.groupedWagyuList = d3.group(wagyuBrandList, (d) => d.prefecture);
    this.wagyuIcon = {
      blackContour: "assets/svg/caw-icon/black-contour.svg",
      blackSilhouette: "assets/svg/caw-icon/black-silhouette.svg",
      brownContour: "assets/svg/caw-icon/brown-contour.svg",
      brownSilhouette: "assets/svg/caw-icon/brown-silhouette.svg",
    };
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
    this.legendGroup = this.ctr
      .append("g")
      .attr(
        "transform",
        `translate(${
          this.dimensions.ctrWidth - this.dimensions.margin.right * 5
        }, ${this.dimensions.ctrHeight - this.dimensions.margin.bottom * 2})`
      );
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

  createLegend() {
    const legendArray = [
      {
        label: "Japanese Black",
        legend: this.wagyuIcon.blackSilhouette,
      },
      {
        label: "Japanese Brown",
        legend: this.wagyuIcon.brownSilhouette,
      },
    ];

    const legendRow = this.legendGroup
      .selectAll(".legendRow")
      .data(legendArray)
      .join("g")
      .attr("class", "legendRow")
      .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendRow
      .append("image")
      .attr("width", 20)
      .attr("height", 20)
      .attr("xlink:href", (d) => d.legend);

    legendRow
      .append("text")
      .attr("class", "legendText")
      .attr("x", 30)
      .attr("y", 15)
      .attr("text-anchor", "start")
      .text((d) => d.label);
  }

  drawBrandMap() {
    const duration = 500;
    const updateTransition = d3
      .transition()
      .duration(duration)
      .ease(d3.easeLinear);

    const projection = this.createProjection(this.geo, 1400);
    const path = d3.geoPath().projection(projection);

    console.log(this.groupedWagyuList);
    this.mapGroup
      .selectAll("path")
      .data(this.geo.features)
      .join("path")
      .transition(updateTransition)
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", (d) =>
        this.groupedWagyuList.get(d.properties.name_nl) ? "#CBB460" : "#DDD6CF"
      )
      .attr("fill-opacity", 0.6);

    this.iconGroup
      .selectAll(".cow-icon")
      .data(
        this.geo.features.filter((d) =>
          this.groupedWagyuList.get(d.properties.name_nl)
        )
      )
      .join("image")
      .attr("class", "cow-icon")
      .attr("xlink:href", (d) => {
        const breed = this.groupedWagyuList.get(d.properties.name_nl)[0].breed;
        return breed === "Japanese Black"
          ? this.wagyuIcon.blackSilhouette
          : this.wagyuIcon.brownSilhouette;
      }) // Path to the cow icon image
      .attr("width", 20) // Adjust the size of the icon
      .attr("height", 20)
      .attr("x", (d) => projection(d3.geoCentroid(d))[0] - 10)
      .attr("y", (d) => projection(d3.geoCentroid(d))[1] - 10)
      .on("mouseover", (event, d) => this.onMouseOverBrand(event, d))
      .on("mouseleave", (event, d) => this.onMouseLeaveBrand(event, d));
  }

  onMouseOverBrand(event, d) {
    const imgBaseDir = "assets/img/raw-meet";
    this.tooltip.style("opacity", 1);
    this.tooltip.style("visibility", "visible");
    d3.select(event.currentTarget).attr("xlink:href", (d) => {
      const breed = this.groupedWagyuList.get(d.properties.name_nl)[0].breed;
      return breed === "Japanese Black"
        ? this.wagyuIcon.blackContour
        : this.wagyuIcon.brownContour;
    });

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
  }

  onMouseLeaveBrand(event, d) {
    d3.select(event.currentTarget).attr("xlink:href", (d) => {
      const breed = this.groupedWagyuList.get(d.properties.name_nl)[0].breed;
      return breed === "Japanese Black"
        ? this.wagyuIcon.blackSilhouette
        : this.wagyuIcon.brownSilhouette;
    });
    this.tooltip.style("visibility", "hidden");
  }
}
