export class UsStoryBook {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.createBook();
  }

  createBook() {
    $(this.parentElement).turn({
      elevation: 100,
      duration: 1000,
      gradients: true,
      autoCenter: true,
    });
  }

  handlerStepEnter = (response) => {
    const currIdx = response.index;

    switch (currIdx) {
      case 0:
        $(this.parentElement).turn("page", 1);
        break;
      case 1:
        $(this.parentElement).turn("page", 2);
        break;
      case 2:
        $(this.parentElement).turn("page", 4);
        break;
      case 3:
        $(this.parentElement).turn("page", 6);
        break;
      case 4:
        $(this.parentElement).turn("page", 8);
        break;
      case 5:
        $(this.parentElement).turn("page", 10);
        break;
      case 6:
        $(this.parentElement).turn("page", 12);
        break;
      case 7:
        $(this.parentElement).turn("page", 14);
        break;
      default:
        break;
    }
  };
}
