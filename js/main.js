import { BeefPartsMap } from "./beefPartsMap.js";
import { BeefGradingGuide } from "./beefGradingGuide.js";
import { Map } from "./map.js";
import { RankingBoard } from "./rankingBoard.js";
import { ScrollamaSetting } from "./scrollamaSetting.js";
import { KobeTajimaCompare } from "./kobeTajimaCompare.js";
import { WagyuExportChart } from "./wagyuExportChart.js";

const draw = async () => {
  const rankingData = await d3.csv("data/wagyu_ranking.csv", d3.autoType);
  const wagyuExportData = await d3.csv(
    "data/amount_value_of_exported_beef.csv",
    d3.autoType
  );

  const beefGradingGuide = new BeefGradingGuide("#beef-grading-guide");
  const beefPartsMap = new BeefPartsMap(
    "#beef-parts-map",
    "#beef-parts-tooltip"
  );

  const map = new Map("#map");
  new ScrollamaSetting(map, "#map-scrolly");

  const wagyuExportChart = new WagyuExportChart(
    "#wagyu-export-chart",
    wagyuExportData
  );

  const kobeTajimaCompare = new KobeTajimaCompare("#kobe-tajima-compare", [
    "#kobe-tajima-label-2008",
    "#kobe-tajima-label-2013",
    "#kobe-tajima-label-2018",
    "#kobe-tajima-label-2023",
  ]);

  new ScrollamaSetting(kobeTajimaCompare, "#kobe-tajima-compare-scrolly");

  const rankingBoard = new RankingBoard("#ranking-board", rankingData);
  new ScrollamaSetting(rankingBoard, "#ranking-board-scrolly");

  d3.select("#wagyu-stack").on("change", (e) => {
    e.preventDefault();
    wagyuExportChart.updateVis("stackedAreaChart");
  });

  d3.select("#wagyu-line").on("change", (e) => {
    e.preventDefault();
    wagyuExportChart.updateVis("lineChart");
  });
};

draw();
