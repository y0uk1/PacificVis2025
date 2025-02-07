export class BeefGradeTable {
  constructor(_parentElement) {
    this.parentElement = d3.select(_parentElement);

    this.createTable();
  }

  createTable() {
    this.parentElement.html(
      `
      <div>
        <table class="table table-bordered text-center">
          <thead>
            <tr>
              <th scope="col" colspan="2" class="text-start">BMS</th>
              <th scope="col">1</th>
              <th scope="col">2</th>
              <th scope="col">3</th>
              <th scope="col">4</th>
              <th scope="col">5</th>
              <th scope="col">6</th>
              <th scope="col">7</th>
              <th scope="col">8</th>
              <th scope="col">9</th>
              <th scope="col">10</th>
              <th scope="col">11</th>
              <th scope="col">12</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" colspan="2" class="text-start">Meat Quality Score</th>
              <th>1</th>
              <th>2</th>
              <th colspan="2">3</th>
              <th colspan="3">4</th>
              <th colspan="5">5</th>
            </tr>
            <tr>
              <th scope="row" rowspan="3" class="text-start">Yield Score</th>
              <td>A</td>
              <td>A1</td>
              <td class="tajima">A2</td>
              <td class="tajima" colspan="2">A3</td>
              <td class="tajima">A4</td>
              <td class="kobe tajima" colspan="2">A4</td>
              <td class="kobe tajima" colspan="5">A5</td>
            </tr>
            <tr>
              <th scope="row">B</th>
              <td>B1</td>
              <td class="tajima">B2</td>
              <td class="tajima" colspan="2">B3</td>
              <td class="tajima">B4</td>
              <td class="kobe tajima" colspan="2">B4</td>
              <td class="kobe tajima" colspan="5">B5</td>
            </tr>
            <tr>
              <th scope="row">C</th>
              <td>C1</td>
              <td>C2</td>
              <td colspan="2">C3</td>
              <td colspan="3">C4</td>
              <td colspan="5">C5</td>
            </tr>
          </tbody>
        </table>
        <p>Meat Quality Score (1 to 5): This is the overall score based on the degree of marbling, firmness, and texture, color, quality, and other factors.</p>
        <p>Yield Score (A to C): This is classified into three grades depending on the amount or percentage of edible cuts that can be grained from a single head of cattle.</p>

      </div>
      `
    );
  }

  resetArea() {
    this.parentElement
      .selectAll(".tajima")
      .classed("bg-light-dark-transition", false);
    this.parentElement.selectAll(".kobe").classed("bg-gold-transition", false);
  }

  changeTajimaBeefArea() {
    this.parentElement
      .selectAll(".tajima")
      .classed("bg-light-dark-transition", true);
    this.parentElement.selectAll(".kobe").classed("bg-gold-transition", false);
  }

  changeKobeBeefArea() {
    this.parentElement.selectAll(".kobe").classed("bg-gold-transition", true);
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;
    const currDirection = response.direction;
    switch (currIdx) {
      case 0:
        this.resetArea();
        break;
      case 1:
        this.changeTajimaBeefArea();
        break;
      case 2:
        this.changeKobeBeefArea();
        break;
      default:
        break;
    }
  };
}
