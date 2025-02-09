export class FinalStorySwiper {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.initSwiper();
  }

  initSwiper() {
    const swiper = new Swiper(this.parentElement, {
      direction: "vertical",
      slidesPerView: 1,
      speed: 1000,
      keyboard: {
        enabled: true,
      },
      mousewheel: {
        releaseOnEdges: true,
        forceToAxis: true,
        sensitivity: 1,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      on: {
        slideChange: function () {
          $(`#t-text-${swiper.activeIndex}`).t({
            speed: 100,
            speed_vary: false,
            blink_perm: false,
            fin: function () {
              const newId = `text-${swiper.activeIndex}`;
              $(`#t-text-${swiper.activeIndex}`).attr("id", newId);
            },
          });
          setTimeout(function () {
            swiper.params.mousewheel.releaseOnEdges = false;
          }, 500);
        },
        reachEnd: function () {
          setTimeout(function () {
            swiper.params.mousewheel.releaseOnEdges = true;
          }, 750);
        },
      },
    });
  }
}
