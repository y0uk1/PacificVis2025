export class BeefPartsRate {
  constructor(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
  }

  async initVis() {
    this.setDimensions();
    this.createSvg();
    this.createGroups();
    this.createLabels();
    this.updateVis();
  }

  setDimensions() {
    this.dimensions = {
      width: 300,
      height: 180,
      margin: {
        top: 0,
        right: 0,
        bottom: 10,
        left: 0,
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
    this.labelGroup = this.ctr.append("g");
    this.flowerGroup = this.ctr.append("g");
  }

  createLabels() {
    const labelArray = [
      { label: "Low Fat", id: "lowFat" },
      { label: "Tenderness", id: "tenderness" },
      { label: "Rarity", id: "rarity" },
    ];

    this.labelGroup
      .selectAll("text")
      .data(labelArray)
      .join("text")
      .attr("x", 10)
      .attr("y", (d, i) => i * 50 + 20)
      .text((d) => d.label)
      .attr("fill", "black")
      .attr("font-size", "16px")
      .attr("dominant-baseline", "middle");
  }

  updateVis(
    dataset = { lowFat: 0, tenderness: 0, rarity: 0, explanation: "test" }
  ) {
    const duration = 300;
    const updateTransition = d3.transition().duration(duration);

    const categories = ["lowFat", "tenderness", "rarity"];
    let data = [];

    // 各カテゴリの数だけデータを追加
    categories.forEach((category, index) => {
      for (let i = 0; i < 5; i++) {
        // 最大5つ表示
        data.push({
          category,
          index,
          i,
          type: i < dataset[category] ? "flower-on.svg" : "flower-off.svg",
        });
      }
    });

    this.flowerGroup
      .selectAll("image")
      .data(data)
      .join("image")
      .transition(updateTransition)
      .attr("xlink:href", (d) => `assets/svg/${d.type}`) // flower-on/off を設定
      .attr("width", 20)
      .attr("height", 20)
      .attr("x", (d) => 150 + d.i * 30) // 横方向の位置
      .attr("y", (d) => d.index * 50 + 10); // カテゴリごとに間隔を空けて配置
  }
}
