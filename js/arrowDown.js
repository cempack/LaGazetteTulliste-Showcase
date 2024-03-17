// Make the arrow down button scroll to the next section smoothly

const arrowDown = document.querySelector(".arrowDown");
const section = document.querySelector("#content");
arrowDown.addEventListener("click", () => {
  section.scrollIntoView({ behavior: "smooth" });
});
