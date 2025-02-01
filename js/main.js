import { BeefPartsMap } from "./beefPartsMap.js";
import { BeefGradingGuide } from "./beefGradingGuide.js";
import { Cuisines } from "./cuisines.js";
import { Map } from "./map.js";
import { StickyHorizontalScroll } from "./stickyHorizontalScroll.js";
import { RankingBoard } from "./rankingBoard.js";
import { ScrollamaSetting } from "./scrollamaSetting.js";
import { KobeTajimaCompare } from "./kobeTajimaCompare.js";
import { WagyuExportChart } from "./wagyuExportChart.js";

const draw = async () => {
  const beefGradingGuide = new BeefGradingGuide("#beef-grading-guide");
  const beefPartsMap = new BeefPartsMap(
    "#beef-parts-map",
    "#beef-parts-tooltip"
  );

  const map = new Map("#map");
  new ScrollamaSetting(map, "#map-scrolly");

  const wagyuExportChart = new WagyuExportChart("#export-chart");
  new ScrollamaSetting(wagyuExportChart, "#export-chart-scrolly", 0.35);

  const kobeTajimaCompare = new KobeTajimaCompare("#kobe-tajima-compare", [
    "#kobe-tajima-label-2008",
    "#kobe-tajima-label-2013",
    "#kobe-tajima-label-2018",
    "#kobe-tajima-label-2023",
  ]);
  new ScrollamaSetting(kobeTajimaCompare, "#kobe-tajima-compare-scrolly");

  const rankingBoard = new RankingBoard("#ranking-board");
  new ScrollamaSetting(rankingBoard, "#ranking-board-scrolly");

  const cuisines = new Cuisines(
    "cuisine-list",
    "selected-cuisine-img",
    "selected-cuisine-name",
    "selected-cuisine-jp-name",
    "selected-cuisine-explanation",
    "Yakiniku"
  );

  new StickyHorizontalScroll(".sticky-wrap");
};

draw();
