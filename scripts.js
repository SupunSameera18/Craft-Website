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
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (currentPage !== "index.html") return;

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
// YouTube Video Grid (Vlog page only)
// ===========================
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (currentPage !== "vlog.html") return;

  const videoContainer = document.getElementById("video-container");
  if (!videoContainer) return;

  // Unique video URLs (no duplicates)
  const videoUrls = [
    "https://www.youtube.com/watch?v=zvrRAD1QzWg",
    "https://www.youtube.com/watch?v=aNIPCzIGBiI",
    "https://www.youtube.com/watch?v=n1irtk-KdwQ",
    "https://www.youtube.com/watch?v=m8GI4tECFWU",
  ];

  function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&#]*)/);
    return match ? match[1] : null;
  }

  function fetchVideoDetails(videoId) {
    const apiUrl =
      "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" +
      videoId +
      "&format=json";

    fetch(apiUrl)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        const title = data.title;
        const thumbnailUrl =
          "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
        displayVideo(title, thumbnailUrl, videoId);
      })
      .catch(function (error) {
        console.error("Error fetching video details:", error);
      });
  }

  function displayVideo(title, thumbnailUrl, videoId) {
    const videoItem = document.createElement("div");
    videoItem.classList.add("video-item");

    const img = document.createElement("img");
    img.src = thumbnailUrl;
    img.alt = title;
    img.classList.add("thumbnail-image");
    img.loading = "lazy";

    const titleEl = document.createElement("p");
    titleEl.classList.add("video-title");
    titleEl.textContent = title;

    videoItem.appendChild(img);
    videoItem.appendChild(titleEl);

    videoItem.addEventListener("click", function () {
      window.open(
        "https://www.youtube.com/watch?v=" + videoId,
        "_blank",
        "noopener,noreferrer",
      );
    });

    videoContainer.appendChild(videoItem);
  }

  videoUrls.forEach(function (url) {
    const videoId = extractVideoId(url);
    if (videoId) {
      fetchVideoDetails(videoId);
    }
  });
})();

// ===========================
// Blog System (Blog page only)
// ===========================
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (currentPage !== "blog.html") return;

  // --- Configuration ---
  // Default admin credentials (change these as needed)
  var ADMIN_USERNAME = "admin";
  var ADMIN_PASSWORD = "kraft2024";

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
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function savePosts(posts) {
    try {
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
