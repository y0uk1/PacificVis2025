export class BrandMap {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.wagyuIcon = {
      white: "assets/svg/wagyu-icon-white.svg",
      black: "assets/svg/wagyu-icon-black.svg",
    };
    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createTooltip();
    this.createGroups();
    await this.loadData();
    this.updateVis();
  }

  async loadData(mode = "japan") {
    if (mode === "japan") {
      this.geoJson = await d3.json("data/japan.geo.json");
      const wagyu_brand_list = await d3.json("data/wagyu_brand_list.json");
      this.groupedWagyuList = d3.group(wagyu_brand_list, (d) => d.prefecture);
    } else {
      // TODO: world mapへ変更する
      this.geoJson = await d3.json("data/japan_geo.json");
    }

    console.log(this.groupedWagyuList);
  }

  // Initialize chart dimensions
  setDimensions() {
    this.dimensions = {
      width: 1000,
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

  createTooltip() {
    this.tooltip = d3
      .select(this.parentElement)
      .append("div")
      .classed("tooltip", true);
  }

  createGroups() {
    this.mapGroup = this.ctr.append("g").classed("map", true);
    this.iconGroup = this.ctr.append("g").classed("wagyu-icon", true);
  }

  updateVis() {
    const vis = this;
    const scale = 2000;
    const center = d3.geoCentroid(this.geoJson);
    const projection = d3
      .geoMercator()
      .center(center)
      .translate([this.dimensions.ctrWidth / 2, this.dimensions.ctrHeight / 2])
      .scale(scale);

    const path = d3.geoPath().projection(projection);

    // draw map
    this.mapGroup
      .selectAll("path")
      .data(this.geoJson.features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.25)
      .attr("fill", (d) =>
        this.groupedWagyuList.get(d.properties.name_nl) ? "red" : "white"
      )
      .attr("fill-opacity", 0.3);

    // Add cow icons to prefectures with wagyu brands
    this.iconGroup
      .selectAll(".cow-icon")
      .data(
        this.geoJson.features.filter((d) =>
          this.groupedWagyuList.get(d.properties.name_nl)
        )
      )
      .join("image")
      .attr("class", "cow-icon")
      .attr("xlink:href", this.wagyuIcon.black) // Path to the cow icon image
      .attr("width", 30) // Adjust the size of the icon
      .attr("height", 30)
      .attr("x", (d) => projection(d3.geoCentroid(d))[0] - 15) // Center the icon
      .attr("y", (d) => projection(d3.geoCentroid(d))[1] - 15)
      .on("mouseover", function (event, d) {
        vis.tooltip.style("opacity", 1);
        d3.select(this).attr("xlink:href", vis.wagyuIcon.white);

        const prefecture = d.properties.name_nl;
        const brandData = vis.groupedWagyuList.get(prefecture)[0];
        vis.tooltip
          .html(
            `
            <p>${brandData.brand} (${brandData.brand_jp})</p>
            <p>${brandData.prefecture}</p>
            <p>${brandData.explanation}</p>
            <img src="assets/img/${brandData.image}" width="400">
          `
          )
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + 20 + "px");
      })
      .on("mousemove", function (event, d) {
        vis.tooltip
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + 20 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("xlink:href", vis.wagyuIcon.black);
        vis.tooltip.style("opacity", 0);
      });
  }
}
