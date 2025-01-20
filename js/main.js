import { RankingBoard } from "./rankingBoard.js";
import { WagyuExportChart } from "./wagyuExportChart.js";

const draw = async () => {
  const rankingData = await d3.csv("data/wagyu_ranking.csv", d3.autoType);
  const wagyuExportData = await d3.csv(
    "data/amount_value_of_exported_beef.csv",
    d3.autoType
  );

  let rankingKey;

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
    rankingKey = "want_to_try";
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
};

draw();
