(function () {
  const year = document.getElementById("year");
  const pageUrl = document.getElementById("page-url");
  const referrer = document.getElementById("referrer");
  const revealElements = document.querySelectorAll(".reveal");
  const heroSlider = document.querySelector(".hero-slider");
  const heroDotsHost = document.getElementById("hero-slider-dots");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (pageUrl) {
    pageUrl.value = window.location.href;
  }

  if (referrer) {
    referrer.value = document.referrer || "";
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("revealed"));
  }

  initHeroSlider();

  function initHeroSlider() {
    if (!heroSlider || !heroDotsHost) {
      return;
    }

    const slides = Array.from(heroSlider.querySelectorAll(".hero-slide"));
    if (slides.length <= 1) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dots = slides.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Go to screenshot ${index + 1}`);
      dot.addEventListener("click", () => {
        scrollToSlide(index);
        queueAutoplayRestart();
      });
      heroDotsHost.appendChild(dot);
      return dot;
    });

    let activeIndex = 0;
    let autoplayId = 0;
    let resumeId = 0;
    let scrollFrame = 0;

    updateDots(activeIndex);
    startAutoplay();

    heroSlider.addEventListener("scroll", () => {
      if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
      }

      scrollFrame = requestAnimationFrame(() => {
        const nextIndex = getNearestSlideIndex();
        if (nextIndex !== activeIndex) {
          activeIndex = nextIndex;
          updateDots(activeIndex);
        }
      });
    });

    heroSlider.addEventListener("mouseenter", stopAutoplay);
    heroSlider.addEventListener("mouseleave", startAutoplay);
    heroSlider.addEventListener("pointerdown", stopAutoplay);
    heroSlider.addEventListener("pointerup", queueAutoplayRestart);
    heroSlider.addEventListener("touchend", queueAutoplayRestart, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    window.addEventListener("resize", () => {
      scrollToSlide(activeIndex, "auto");
    });

    function scrollToSlide(index, behavior = "smooth") {
      const target = slides[index];
      if (!target) {
        return;
      }

      activeIndex = index;
      updateDots(activeIndex);
      heroSlider.scrollTo({
        left: target.offsetLeft,
        behavior,
      });
    }

    function getNearestSlideIndex() {
      const sliderCenter = heroSlider.scrollLeft + heroSlider.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const distance = Math.abs(sliderCenter - slideCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      return nearestIndex;
    }

    function updateDots(index) {
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle("is-active", isActive);
        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function startAutoplay() {
      if (reduceMotion.matches) {
        return;
      }

      stopAutoplay();
      autoplayId = window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % slides.length;
        scrollToSlide(nextIndex);
      }, 3600);
    }

    function stopAutoplay() {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = 0;
      }
      if (resumeId) {
        window.clearTimeout(resumeId);
        resumeId = 0;
      }
    }

    function queueAutoplayRestart() {
      stopAutoplay();
      if (reduceMotion.matches) {
        return;
      }

      resumeId = window.setTimeout(() => {
        startAutoplay();
      }, 5000);
    }
  }
})();
