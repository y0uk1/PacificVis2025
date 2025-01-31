export class Cuisines {
  constructor(
    _containerId,
    _selectedImageId,
    _selectedNameId,
    _selectedJpNameId,
    _selectedExplanation,
    _defaultCuisine
  ) {
    this.cardsContainer = document.getElementById(_containerId); // カードが追加される場所
    this.selectedImage = document.getElementById(_selectedImageId); // 選択された画像
    this.selectedName = document.getElementById(_selectedNameId); // 料理名（英語）
    this.selectedJpName = document.getElementById(_selectedJpNameId); // 料理名（日本語）
    this.selectedExplanation = document.getElementById(_selectedExplanation); // 料理名（日本語）
    this.defaultCuisine = _defaultCuisine;
    this.imageBaseDir = "assets/img/cuisine";
    this.data = [];

    this.initContent();
  }

  async initContent() {
    await this.loadData();
    this.renderCards();
    this.renderSelectedItem(this.defaultCuisine);
  }

  // JSONデータの取得
  async loadData() {
    const response = await fetch("data/cuisines.json");
    this.dataset = await response.json();
  }

  // カードを描画
  renderCards() {
    this.cardsContainer.innerHTML = "";

    this.dataset.forEach((cuisine) => {
      const card = document.createElement("div");
      card.className = "col-md-2";

      card.innerHTML = `
          <div class="card w-100 custom-card" id=${cuisine.name}">
            <img class="card-img-top" src="${this.imageBaseDir}/${cuisine.image}" alt="${cuisine.name}">
            <div class="card-body">
              <p class="card-text text-center">${cuisine.name}</p>
            </div>
          </div>
        `;

      // カードをクリックしたときに画像と名前を変更
      card.addEventListener("click", () => {
        this.updateSelectedCuisine(cuisine);
      });

      this.cardsContainer.appendChild(card);
    });
  }

  renderSelectedItem(name) {
    const selectedCuisine = this.dataset.filter(
      (cuisine) => cuisine.name === name
    )[0];

    console.log(selectedCuisine);
    this.selectedName.textContent = selectedCuisine.name;
    this.selectedJpName.textContent = selectedCuisine.nameJP;
    this.selectedImage.src = `${this.imageBaseDir}/${selectedCuisine.image}`;
    this.selectedExplanation.textContent = selectedCuisine.explanation;
  }

  // 画像と名前を変更する
  updateSelectedCuisine(cuisine) {
    // 画像のアニメーション
    this.selectedImage.classList.remove("fade-in");
    this.selectedImage.classList.add("fade");
    setTimeout(() => {
      this.selectedImage.src = `${this.imageBaseDir}/${cuisine.image}`; // 画像の更新
      this.selectedImage.classList.remove("fade");
      this.selectedImage.classList.add("fade-in");
    }, 500); // 画像の変更が遅れるようにタイミングを合わせる

    // テキストのアニメーション
    this.selectedName.classList.remove("slide-in");
    this.selectedJpName.classList.remove("slide-in");
    this.selectedExplanation.classList.remove("slide-in");
    this.selectedName.classList.add("slide");
    this.selectedJpName.classList.add("slide");
    this.selectedExplanation.classList.add("slide");

    setTimeout(() => {
      this.selectedName.textContent = cuisine.name;
      this.selectedJpName.textContent = cuisine.nameJP;
      this.selectedExplanation.textContent = cuisine.explanation;

      this.selectedName.classList.remove("slide");
      this.selectedJpName.classList.remove("slide");
      this.selectedExplanation.classList.remove("slide");
      this.selectedName.classList.add("slide-in");
      this.selectedJpName.classList.add("slide-in");
      this.selectedExplanation.classList.add("slide-in");
    }, 500); // テキストの変更タイミングを合わせる
  }
}
