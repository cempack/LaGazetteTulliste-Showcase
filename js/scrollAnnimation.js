// Transition on scroll

const sections = document.querySelectorAll("section");
const options = {
  root: null,
  threshold: 0.2,
  rootMargin: "0px 0px -100px 0px",
};
const observer = new IntersectionObserver(function (entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    } else {
      entry.target.style.transition = "opacity 1s, transform 1s"; // Add transition
      entry.target.style.opacity = 1;
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, options);
sections.forEach((section) => {
  section.style.transition = "opacity 1s, transform 1s"; // Add transition
  section.style.opacity = 0;
  section.style.transform = "translateY(20px)";
  observer.observe(section);
});
