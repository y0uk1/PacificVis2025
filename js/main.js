import { BeefGradeTable } from "./beefGradeTable.js";
import { BeefPartsMap } from "./beefPartsMap.js";
import { BeefGradingGuide } from "./beefGradingGuide.js";
import { BrandMap } from "./brandMap.js";
import { Cuisines } from "./cuisines.js";
import { FinalStorySwiper } from "./finalStorySwiper.js";
import { KobebeefExportMap } from "./kobebeefExportMap.js";
import { RankingBoard } from "./rankingBoard.js";
import { StickyHorizontalScroll } from "./stickyHorizontalScroll.js";
import { ScrollamaSetting } from "./scrollamaSetting.js";
import { KobeTajimaCompare } from "./kobeTajimaCompare.js";
import { UsStoryBook } from "./usStoryBook.js";
import { WagyuExportChart } from "./wagyuExportChart.js";

const draw = async () => {
  new FinalStorySwiper("#final-story-swiper");

  const usStoryBook = new UsStoryBook("#flipbook");
  new ScrollamaSetting(usStoryBook, "#us-story-scrolly", 0);

  const beefPartsMap = new BeefPartsMap(
    "#beef-parts-map",
    "#beef-parts-rate",
    "#beef-parts-explanation"
  );
  const brandMap = new BrandMap("#brand-map");
  new ScrollamaSetting(brandMap, "#brand-map-scrolly");

  const wagyuExportChart = new WagyuExportChart("#export-chart");
  new ScrollamaSetting(
    wagyuExportChart,
    "#export-chart-scrolly",
    undefined,
    0.5
  );

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

  const beefGradingGuide = new BeefGradingGuide(
    "#beef-grading-guide",
    "selected-bms-meat"
  );

  const exportMap = new KobebeefExportMap("#export-map");
  new ScrollamaSetting(exportMap, "#export-map-scrolly");

  const beefGradeTable = new BeefGradeTable("#beef-grade-table");
  new ScrollamaSetting(beefGradeTable, "#grading-table-scrolly");

  new StickyHorizontalScroll(".sticky-wrap");
};

draw();
