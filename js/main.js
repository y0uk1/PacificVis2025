import { BeefExportMap } from "./beefExportMap.js";
import { BrandMap } from "./brandMap.js";
import { BeefPartsMap } from "./beefPartsMap.js";
import { BeefGradingGuide } from "./beefGradingGuide.js";
import { RankingBoard } from "./rankingBoard.js";
import { KobeTajimaCompare } from "./kobeTajimaCompare.js";
import { WagyuExportChart } from "./wagyuExportChart.js";

const draw = async () => {
  const rankingData = await d3.csv("data/wagyu_ranking.csv", d3.autoType);
  const wagyuExportData = await d3.csv(
    "data/amount_value_of_exported_beef.csv",
    d3.autoType
  );

  let rankingKey;
  let yearKobeTajima = 2008;
  let yearExport = 2012;

  const beefGradingGuide = new BeefGradingGuide("#beef-grading-guide");
  const kobeTajimaCompare = new KobeTajimaCompare(
    "#kobe-tajima-compare",
    "#kobe-tajima-label"
  );
  const beefPartsMap = new BeefPartsMap(
    "#beef-parts-map",
    "#beef-parts-tooltip"
  );
  const brandMap = new BrandMap("#brand-map");
  const beefExportMap = new BeefExportMap("#kobebeef-export-map");
  const rankingBoard = new RankingBoard("#ranking-board", rankingData);
  const wagyuExportChart = new WagyuExportChart(
    "#wagyu-export-chart",
    wagyuExportData
  );

  d3.select("#ranking-popularity").on("change", (e) => {
    e.preventDefault();
    rankingKey = "popularity";
    rankingBoard.updateVis(rankingKey);
  });

  d3.select("#ranking-price").on("change", (e) => {
    e.preventDefault();
    rankingKey = "price";
    rankingBoard.updateVis(rankingKey);
  });

  d3.select("#ranking-try").on("change", (e) => {
    e.preventDefault();
    rankingKey = "wantToTry";
    rankingBoard.updateVis(rankingKey);
  });

  d3.select("#wagyu-stack").on("change", (e) => {
    e.preventDefault();
    wagyuExportChart.updateVis("stackedAreaChart");
  });

  d3.select("#wagyu-line").on("change", (e) => {
    e.preventDefault();
    wagyuExportChart.updateVis("lineChart");
  });

  const step = () => {
    kobeTajimaCompare.updateVis(yearKobeTajima);
    beefExportMap.updateVis(yearExport);
    yearKobeTajima = yearKobeTajima >= 2023 ? 2008 : yearKobeTajima + 1;
    yearExport = yearExport >= 2024 ? 2012 : yearExport + 1;
  };

  setInterval(step, 1000);
};

draw();
