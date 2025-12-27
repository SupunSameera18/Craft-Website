$(document).ready(function () {
  // Smooth scrolling for navigation
  $("a.nav-link").on("click", function (event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      $("html, body").animate(
        {
          scrollTop: $(hash).offset().top, // Adjust offset for fixed navbar height
        },
        800
      );
    }
  });

  // Initialize AOS
  AOS.init();
});

// JavaScript to dynamically create and position flowers
if (
  window.location.pathname === "/index.html" ||
  window.location.pathname === "index.html"
) {
  const container = document.getElementById("flower-container");

  function createFlower() {
    const flower = document.createElement("img");
    flower.src = "images/f" + (Math.floor(Math.random() * 5) + 1) + ".webp"; // Replace with your flower image path
    flower.classList.add("flower");

    // Randomize position, size, rotation, and animation duration
    const size = Math.random() * 10 + 10; // Random size between 20 and 70 pixels
    flower.style.width = `${size}px`;
    flower.style.height = `${size}px`;
    flower.style.left = `${Math.random() * window.innerWidth - 20}px`; // Random horizontal position
    flower.style.animationDuration = `${Math.random() * 10 + 20}s`; // Random animation duration (adjusted for slower effect)
    flower.alt = "animated flower";

    container.appendChild(flower);

    // Remove flower after animation completes
    flower.addEventListener("animationend", () => {
      flower.remove();
    });
  }

  // Generate flowers at intervals
  if (window.innerWidth < 480) {
    setInterval(createFlower, 3000); // Adjust interval as needed (e.g., every 2 seconds)
  } else {
    setInterval(createFlower, 1500); // Adjust interval as needed (e.g., every 2 seconds)
  }
}

//Fetch youtube videos
// List of YouTube video URLs
if (
  window.location.pathname === "/vlog.html" ||
  window.location.pathname === "vlog.html"
) {
  const videoUrls = [
    "https://www.youtube.com/watch?v=zvrRAD1QzWg",
    "https://www.youtube.com/watch?v=aNIPCzIGBiI",
    "https://www.youtube.com/watch?v=n1irtk-KdwQ&t=10s",
    "https://www.youtube.com/watch?v=m8GI4tECFWU",
    "https://www.youtube.com/watch?v=zvrRAD1QzWg",
    "https://www.youtube.com/watch?v=aNIPCzIGBiI",
    "https://www.youtube.com/watch?v=n1irtk-KdwQ&t=10s",
    "https://www.youtube.com/watch?v=m8GI4tECFWU",
    "https://www.youtube.com/watch?v=zvrRAD1QzWg",
    "https://www.youtube.com/watch?v=aNIPCzIGBiI",
    "https://www.youtube.com/watch?v=n1irtk-KdwQ&t=10s",
    "https://www.youtube.com/watch?v=m8GI4tECFWU",
    // Add more URLs as needed
  ];

  // Function to extract the video ID from the URL
  function extractVideoId(url) {
    const videoIdMatch = url.match(/[?&]v=([^&#]*)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  }

  // Function to fetch video title using the YouTube URL
  function fetchVideoDetails(videoId) {
    const apiUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        const title = data.title;
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        displayVideo(title, thumbnailUrl, videoId);
      })
      .catch((error) => console.error("Error fetching video details:", error));
  }

  // Function to display the video with the title and thumbnail
  function displayVideo(title, thumbnailUrl, videoId) {
    const videoContainer = document.getElementById("video-container");

    const videoItem = document.createElement("div");
    videoItem.classList.add("video-item");

    videoItem.innerHTML = `
        <img src="${thumbnailUrl}" alt="Thumbnail" class="thumbnail-image" style="width:100%; height:auto; cursor:pointer; margin-top: 10px; border-radius: 10px">
        <p class="video-title">${title}</p>
    `;

    videoItem.onclick = () => {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
    };

    videoContainer.appendChild(videoItem);
  }

  // Iterate over the video URLs and fetch the details
  videoUrls.forEach((url) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      fetchVideoDetails(videoId);
    }
  });
}
