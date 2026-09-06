// ===========================
// Flower Animation (Index page only)
// ===========================
(function () {
  const container = document.getElementById("flower-container");
  if (!container) return;

  const flowerCount = 5;
  const interval = window.innerWidth < 480 ? 3000 : 1500;

  function createFlower() {
    const flower = document.createElement("img");
    const randomIndex = Math.floor(Math.random() * flowerCount) + 1;
    flower.src = "images/f" + randomIndex + ".webp";
    flower.classList.add("flower");
    flower.alt = "";
    flower.loading = "lazy";

    const size = Math.random() * 10 + 10;
    flower.style.width = size + "px";
    flower.style.height = size + "px";
    flower.style.left = Math.random() * window.innerWidth - 20 + "px";
    flower.style.animationDuration = Math.random() * 10 + 20 + "s";

    container.appendChild(flower);

    flower.addEventListener("animationend", function () {
      flower.remove();
    });
  }

  setInterval(createFlower, interval);
})();
