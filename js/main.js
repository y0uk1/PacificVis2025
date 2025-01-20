import { RankingBoard } from "./rankingBoard.js";

const draw = async () => {
  const rankingData = await d3.csv("data/wagyu_ranking.csv", d3.autoType);

  let rankingKey;

  const rankingBoard = new RankingBoard("#ranking-board", rankingData);

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
};

draw();
