document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== "undefined") {
    AOS.init();
  }
});

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

// ===========================
// YouTube Channel Videos (Vlog page only)
// Uses YouTube Data API v3 to auto-fetch videos from @HimeshiThisara
// ===========================
(function () {
  if (!document.body.classList.contains("vlog-body")) return;

  const videoContainer = document.getElementById("video-container");
  const loadingEl = document.getElementById("vlog-loading");
  const channelCta = document.getElementById("vlog-channel-cta");
  const loadMoreWrap = document.getElementById("vlog-load-more");
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (!videoContainer) return;

  // =============================================
  // CONFIGURATION
  // =============================================
  // To get a YouTube Data API v3 key (free):
  // 1. Go to https://console.cloud.google.com/apis/credentials
  // 2. Create a project (or select existing)
  // 3. Enable "YouTube Data API v3"
  // 4. Create an API Key (restrict to YouTube Data API v3)
  // 5. Paste the key below
  const API_KEY = "YOUR_YOUTUBE_API_KEY_HERE";
  const CHANNEL_ID = "UCKpFcHMBqZWy_GVfteadPBQ"; // @HimeshiThisara channel ID
  const VIDEOS_PER_PAGE = 10;
  const MIN_DURATION_SECONDS = 61; // Filter out Shorts (≤60s)
  // =============================================

  let allVideos = [];
  let displayedCount = 0;
  let nextPageToken = "";
  let isLoading = false;

  function showLoading() {
    if (loadingEl) loadingEl.style.display = "block";
  }

  function hideLoading() {
    if (loadingEl) loadingEl.style.display = "none";
  }

  function showChannelCta() {
    hideLoading();
    if (channelCta) channelCta.style.display = "block";
  }

  // Parse ISO 8601 duration (PT#H#M#S) to total seconds
  function parseDuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || 0, 10);
    const m = parseInt(match[2] || 0, 10);
    const s = parseInt(match[3] || 0, 10);
    return h * 3600 + m * 60 + s;
  }

  // Format seconds to mm:ss or h:mm:ss
  function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };
    if (h > 0) {
      return h + ":" + pad(m) + ":" + pad(s);
    }
    return m + ":" + pad(s);
  }

  // Format date to readable string
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  // Fetch uploads playlist ID from channel
  function getUploadsPlaylistId() {
    const url =
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=" +
      CHANNEL_ID +
      "&key=" +
      API_KEY;

    return fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.error) {
          throw new Error(data.error.message || "API error");
        }
        if (!data.items || data.items.length === 0) {
          throw new Error("Channel not found");
        }
        return data.items[0].contentDetails.relatedPlaylists.uploads;
      });
  }

  // Fetch a page of video IDs from the uploads playlist
  function fetchPlaylistPage(playlistId, pageToken) {
    let url =
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" +
      playlistId +
      "&key=" +
      API_KEY;

    if (pageToken) {
      url += "&pageToken=" + pageToken;
    }

    return fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.error) {
          throw new Error(data.error.message || "API error");
        }
        const videoIds = [];
        const snippets = {};
        data.items.forEach(function (item) {
          const vid = item.snippet.resourceId.videoId;
          videoIds.push(vid);
          snippets[vid] = item.snippet;
        });
        return {
          videoIds: videoIds,
          snippets: snippets,
          nextPageToken: data.nextPageToken || "",
        };
      });
  }

  // Fetch video details (duration) for a list of video IDs
  function fetchVideoDetails(videoIds) {
    const url =
      "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" +
      videoIds.join(",") +
      "&key=" +
      API_KEY;

    return fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.error) {
          throw new Error(data.error.message || "API error");
        }
        const durations = {};
        data.items.forEach(function (item) {
          durations[item.id] = item.contentDetails.duration;
        });
        return durations;
      });
  }

  // Display a single video card
  function displayVideo(video) {
    const videoItem = document.createElement("div");
    videoItem.classList.add("video-item");

    const img = document.createElement("img");
    img.src = "https://img.youtube.com/vi/" + video.id + "/mqdefault.jpg";
    img.alt = video.title;
    img.classList.add("thumbnail-image");
    img.loading = "lazy";

    const durationEl = document.createElement("span");
    durationEl.classList.add("video-duration");
    durationEl.textContent = video.durationFormatted;

    const titleEl = document.createElement("p");
    titleEl.classList.add("video-title");
    titleEl.textContent = video.title;

    const dateEl = document.createElement("p");
    dateEl.classList.add("video-date");
    dateEl.textContent = video.dateFormatted;

    videoItem.appendChild(img);
    videoItem.appendChild(durationEl);
    videoItem.appendChild(titleEl);
    videoItem.appendChild(dateEl);

    videoItem.addEventListener("click", function () {
      window.open(
        "https://www.youtube.com/watch?v=" + video.id,
        "_blank",
        "noopener,noreferrer",
      );
    });

    videoContainer.appendChild(videoItem);
  }

  // Show a batch of videos from the allVideos array
  function showNextBatch() {
    const end = Math.min(displayedCount + VIDEOS_PER_PAGE, allVideos.length);
    for (let i = displayedCount; i < end; i++) {
      displayVideo(allVideos[i]);
    }
    displayedCount = end;

    // Show/hide load more button
    if (displayedCount < allVideos.length || nextPageToken) {
      if (loadMoreWrap) loadMoreWrap.style.display = "block";
    } else {
      if (loadMoreWrap) loadMoreWrap.style.display = "none";
    }
  }

  // Main: fetch and filter videos from the channel
  let uploadsPlaylistId = "";

  function loadVideos(pageToken) {
    if (isLoading) return;
    isLoading = true;

    // If we have enough buffered videos to show, just show them
    if (allVideos.length - displayedCount >= VIDEOS_PER_PAGE) {
      showNextBatch();
      isLoading = false;
      return;
    }

    // Otherwise, fetch more from YouTube
    if (!pageToken && !nextPageToken && uploadsPlaylistId) {
      // No more pages to fetch
      showNextBatch();
      isLoading = false;
      return;
    }

    const tokenToUse = pageToken || nextPageToken;

    fetchPlaylistPage(uploadsPlaylistId, tokenToUse)
      .then(function (result) {
        nextPageToken = result.nextPageToken;

        if (result.videoIds.length === 0) {
          hideLoading();
          showNextBatch();
          isLoading = false;
          return;
        }

        return fetchVideoDetails(result.videoIds).then(function (durations) {
          result.videoIds.forEach(function (vid) {
            const durationIso = durations[vid];
            if (!durationIso) return;

            const totalSeconds = parseDuration(durationIso);

            // Filter out Shorts (videos ≤ 60 seconds)
            if (totalSeconds < MIN_DURATION_SECONDS) return;

            const snippet = result.snippets[vid];
            allVideos.push({
              id: vid,
              title: snippet.title,
              durationSeconds: totalSeconds,
              durationFormatted: formatDuration(totalSeconds),
              dateFormatted: formatDate(snippet.publishedAt),
              publishedAt: snippet.publishedAt,
            });
          });

          hideLoading();

          // If we still don't have enough videos and there are more pages, fetch another page
          if (
            allVideos.length - displayedCount < VIDEOS_PER_PAGE &&
            nextPageToken
          ) {
            isLoading = false;
            loadVideos(nextPageToken);
            return;
          }

          showNextBatch();
          isLoading = false;
        });
      })
      .catch(function (err) {
        console.error("YouTube API Error:", err);
        hideLoading();
        showChannelCta();
        isLoading = false;
      });
  }

  // Initialize
  function init() {
    showLoading();

    if (API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      showChannelCta();
      return;
    }

    getUploadsPlaylistId()
      .then(function (playlistId) {
        uploadsPlaylistId = playlistId;
        loadVideos("");
      })
      .catch(function (err) {
        console.error("Channel fetch error:", err);
        showChannelCta();
      });
  }

  // Load More button handler
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      loadVideos();
    });
  }

  init();
})();

// ===========================
// Blog System (Blog page only)
// ===========================
(function () {
  if (!document.body.classList.contains("blog-body")) return;

  // --- Configuration ---
  var ADMIN_USERNAME = "admin";
  var ADMIN_PASSWORD = "kraft2024";

  // --- Initial/Default Posts (visible to all visitors) ---
  var INITIAL_POSTS = [
    {
      id: 1702000000000,
      title: "Welcome to Our Craft Blog!",
      text: "Hi there, crafty friends! Welcome to our creative space where we share tutorials, inspirations, and behind-the-scenes stories of our handcrafted journey. Stay tuned for exciting content coming soon!",
      image: null,
    },
  ];

  // --- DOM Elements ---
  var adminToggleBtn = document.getElementById("admin-toggle-btn");
  var loginModal = document.getElementById("login-modal");
  var loginBtn = document.getElementById("login-btn");
  var loginCancelBtn = document.getElementById("login-cancel-btn");
  var loginError = document.getElementById("login-error");
  var usernameInput = document.getElementById("admin-username");
  var passwordInput = document.getElementById("admin-password");
  var adminPanel = document.getElementById("admin-panel");
  var publishBtn = document.getElementById("publish-btn");
  var postTitleInput = document.getElementById("post-title");
  var postTextInput = document.getElementById("post-text");
  var postImageInput = document.getElementById("post-image");
  var imagePreview = document.getElementById("image-preview");
  var imagePreviewContainer = document.getElementById(
    "image-preview-container",
  );
  var postsContainer = document.getElementById("blog-posts-container");
  var emptyState = document.getElementById("blog-empty");

  if (!postsContainer) return;

  // --- State ---
  var isAdmin = sessionStorage.getItem("blogAdmin") === "true";
  var pendingImageData = null;

  // --- LocalStorage helpers ---
  function getPosts() {
    try {
      var data = localStorage.getItem("blogPosts");
      var storedPosts = data ? JSON.parse(data) : [];

      // Create a map of stored posts by ID for quick lookup
      var postsMap = {};
      storedPosts.forEach(function (p) {
        postsMap[p.id] = p;
      });

      // Start with initial posts and override with any stored versions
      var result = [];
      INITIAL_POSTS.forEach(function (initialPost) {
        result.push(postsMap[initialPost.id] || initialPost);
      });

      // Add any custom posts (those not in initial posts)
      var initialIds = {};
      INITIAL_POSTS.forEach(function (p) {
        initialIds[p.id] = true;
      });
      storedPosts.forEach(function (p) {
        if (!initialIds[p.id]) {
          result.push(p);
        }
      });

      return result;
    } catch (e) {
      return INITIAL_POSTS.slice();
    }
  }

  function savePosts(posts) {
    try {
      // Save all posts to localStorage (including edited initial ones)
      localStorage.setItem("blogPosts", JSON.stringify(posts));
    } catch (e) {
      alert(
        "Storage is full. Try removing some posts or using smaller images.",
      );
    }
  }

  // --- Image compression via Canvas ---
  function compressImage(file, maxWidth, quality, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var width = img.width;
        var height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var dataUrl = canvas.toDataURL("image/jpeg", quality);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Format date ---
  function formatDate(timestamp) {
    var d = new Date(timestamp);
    var months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  // --- Update UI based on admin state ---
  function updateAdminUI() {
    if (isAdmin) {
      adminToggleBtn.classList.add("logged-in");
      adminToggleBtn.title = "Admin Logout";
      adminToggleBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
      adminPanel.style.display = "block";
    } else {
      adminToggleBtn.classList.remove("logged-in");
      adminToggleBtn.title = "Admin Login";
      adminToggleBtn.innerHTML = '<i class="fas fa-user-lock"></i>';
      adminPanel.style.display = "none";
    }
  }

  // --- Render all posts ---
  function renderPosts() {
    var posts = getPosts();
    postsContainer.innerHTML = "";

    if (posts.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Show newest first
    posts
      .slice()
      .sort(function (a, b) {
        return b.id - a.id;
      })
      .forEach(function (post) {
        var card = document.createElement("div");
        card.className = "blog-post-card";

        // Image
        if (post.image) {
          var img = document.createElement("img");
          img.src = post.image;
          img.alt = post.title;
          img.className = "blog-post-card-image";
          img.loading = "lazy";
          card.appendChild(img);
        }

        // Body
        var body = document.createElement("div");
        body.className = "blog-post-card-body";

        var dateEl = document.createElement("p");
        dateEl.className = "blog-post-card-date";
        dateEl.textContent = formatDate(post.id);
        body.appendChild(dateEl);

        var titleEl = document.createElement("h2");
        titleEl.className = "blog-post-card-title";
        titleEl.textContent = post.title;
        body.appendChild(titleEl);

        var textEl = document.createElement("p");
        textEl.className = "blog-post-card-text";
        textEl.textContent = post.text;
        body.appendChild(textEl);

        card.appendChild(body);

        // Actions
        var actions = document.createElement("div");
        actions.className = "blog-post-card-actions";

        if (post.image) {
          var dlBtn = document.createElement("a");
          dlBtn.className = "blog-download-btn";
          dlBtn.href = post.image;
          dlBtn.download =
            (post.title || "image").replace(/[^a-z0-9]/gi, "_") + ".jpg";
          dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Image';
          actions.appendChild(dlBtn);
        }

        if (isAdmin) {
          var editBtn = document.createElement("button");
          editBtn.className = "blog-edit-btn";
          editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
          editBtn.setAttribute("data-post-id", post.id);
          editBtn.addEventListener("click", function () {
            var postId = parseInt(this.getAttribute("data-post-id"), 10);
            openEditModal(postId);
          });
          actions.appendChild(editBtn);

          var delBtn = document.createElement("button");
          delBtn.className = "blog-delete-btn";
          delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
          delBtn.setAttribute("data-post-id", post.id);
          delBtn.addEventListener("click", function () {
            var postId = parseInt(this.getAttribute("data-post-id"), 10);
            if (confirm("Are you sure you want to delete this post?")) {
              deletePost(postId);
            }
          });
          actions.appendChild(delBtn);
        }

        card.appendChild(actions);
        postsContainer.appendChild(card);
      });
  }

  // --- Delete post ---
  function deletePost(postId) {
    var posts = getPosts();
    posts = posts.filter(function (p) {
      return p.id !== postId;
    });
    savePosts(posts);
    renderPosts();
  }

  // --- Admin toggle button ---
  adminToggleBtn.addEventListener("click", function () {
    if (isAdmin) {
      // Logout
      isAdmin = false;
      sessionStorage.removeItem("blogAdmin");
      updateAdminUI();
      renderPosts(); // Re-render to hide delete buttons
    } else {
      // Show login modal
      loginModal.style.display = "flex";
      loginError.style.display = "none";
      usernameInput.value = "";
      passwordInput.value = "";
      usernameInput.focus();
    }
  });

  // --- Login ---
  function attemptLogin() {
    var user = usernameInput.value.trim();
    var pass = passwordInput.value;
    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
      isAdmin = true;
      sessionStorage.setItem("blogAdmin", "true");
      loginModal.style.display = "none";
      updateAdminUI();
      renderPosts(); // Re-render to show delete buttons
    } else {
      loginError.style.display = "block";
    }
  }

  loginBtn.addEventListener("click", attemptLogin);

  // Allow Enter key to login
  passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") attemptLogin();
  });
  usernameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") attemptLogin();
  });

  // --- Cancel login ---
  loginCancelBtn.addEventListener("click", function () {
    loginModal.style.display = "none";
  });

  // Close modal on background click
  loginModal.addEventListener("click", function (e) {
    if (e.target === loginModal) {
      loginModal.style.display = "none";
    }
  });

  // --- Image preview ---
  postImageInput.addEventListener("change", function () {
    var file = this.files[0];
    if (!file) {
      imagePreviewContainer.style.display = "none";
      pendingImageData = null;
      return;
    }

    compressImage(file, 1200, 0.8, function (dataUrl) {
      pendingImageData = dataUrl;
      imagePreview.src = dataUrl;
      imagePreviewContainer.style.display = "block";
    });
  });

  // --- Publish post ---
  publishBtn.addEventListener("click", function () {
    var title = postTitleInput.value.trim();
    var text = postTextInput.value.trim();

    if (!title) {
      alert("Please enter a title.");
      postTitleInput.focus();
      return;
    }

    if (!text) {
      alert("Please enter some content.");
      postTextInput.focus();
      return;
    }

    var newPost = {
      id: Date.now(),
      title: title,
      text: text,
      image: pendingImageData || null,
    };

    var posts = getPosts();
    posts.push(newPost);
    savePosts(posts);

    // Reset form
    postTitleInput.value = "";
    postTextInput.value = "";
    postImageInput.value = "";
    imagePreviewContainer.style.display = "none";
    pendingImageData = null;

    renderPosts();
  });

  // --- Edit Post ---
  var editModal = document.getElementById("edit-modal");
  var editPostIdInput = document.getElementById("edit-post-id");
  var editTitleInput = document.getElementById("edit-title");
  var editTextInput = document.getElementById("edit-text");
  var editImageInput = document.getElementById("edit-image");
  var editImagePreview = document.getElementById("edit-image-preview");
  var editImagePreviewContainer = document.getElementById(
    "edit-image-preview-container",
  );
  var editRemoveImageBtn = document.getElementById("edit-remove-image-btn");
  var editSaveBtn = document.getElementById("edit-save-btn");
  var editCancelBtn = document.getElementById("edit-cancel-btn");

  var editPendingImageData = null;
  var editImageRemoved = false;

  function openEditModal(postId) {
    var posts = getPosts();
    var post = null;
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === postId) {
        post = posts[i];
        break;
      }
    }
    if (!post) return;

    editPostIdInput.value = post.id;
    editTitleInput.value = post.title;
    editTextInput.value = post.text;
    editImageInput.value = "";
    editPendingImageData = null;
    editImageRemoved = false;

    if (post.image) {
      editImagePreview.src = post.image;
      editImagePreview.style.display = "block";
      editRemoveImageBtn.style.display = "inline-block";
    } else {
      editImagePreview.style.display = "none";
      editRemoveImageBtn.style.display = "none";
    }

    editModal.style.display = "flex";
    editTitleInput.focus();
  }

  function closeEditModal() {
    editModal.style.display = "none";
  }

  editCancelBtn.addEventListener("click", closeEditModal);

  editModal.addEventListener("click", function (e) {
    if (e.target === editModal) closeEditModal();
  });

  editRemoveImageBtn.addEventListener("click", function () {
    editImageRemoved = true;
    editPendingImageData = null;
    editImagePreview.style.display = "none";
    editRemoveImageBtn.style.display = "none";
    editImageInput.value = "";
  });

  editImageInput.addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;

    editImageRemoved = false;
    compressImage(file, 1200, 0.8, function (dataUrl) {
      editPendingImageData = dataUrl;
      editImagePreview.src = dataUrl;
      editImagePreview.style.display = "block";
      editRemoveImageBtn.style.display = "inline-block";
    });
  });

  editSaveBtn.addEventListener("click", function () {
    var postId = parseInt(editPostIdInput.value, 10);
    var newTitle = editTitleInput.value.trim();
    var newText = editTextInput.value.trim();

    if (!newTitle) {
      alert("Please enter a title.");
      editTitleInput.focus();
      return;
    }

    if (!newText) {
      alert("Please enter some content.");
      editTextInput.focus();
      return;
    }

    var posts = getPosts();
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === postId) {
        posts[i].title = newTitle;
        posts[i].text = newText;

        if (editPendingImageData) {
          posts[i].image = editPendingImageData;
        } else if (editImageRemoved) {
          posts[i].image = null;
        }
        break;
      }
    }

    savePosts(posts);
    closeEditModal();
    renderPosts();
  });

  // --- Initialize ---
  updateAdminUI();
  renderPosts();
})();
