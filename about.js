AOS.init({ duration: 700, once: true, offset: 80 });

// Counters
document.querySelectorAll(".counter").forEach((el) => {
  const end = parseInt(el.getAttribute("data-count")) || 0;
  const c = new countUp.CountUp(el, end, { duration: 2.2, separator: "," });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        c.start();
        io.disconnect();
      }
    });
  });
  io.observe(el);
});

// Swiper
const swiper = new Swiper(".swiper", {
  slidesPerView: 1,
  loop: true,
  autoplay: { delay: 4200, disableOnInteraction: false },
  pagination: { el: ".swiper-pagination", clickable: true },
});

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Scroll to top
const st = document.createElement("button");
st.id = "scrollTop";
st.innerHTML = "↑";
document.body.appendChild(st);
st.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);
window.addEventListener("scroll", () => {
  st.style.display = window.scrollY > 400 ? "flex" : "none";
});
