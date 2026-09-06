// ===========================
// Blog System (Blog page) — Firebase Realtime Database + Firebase Auth
// ===========================
(function () {
  // --- Firebase Configuration ---
  // This config is not a secret — it's meant to be public in client apps.
  // Actual write protection comes from Firebase Auth + the Realtime
  // Database security rules (see README.md), not from hiding this object.
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyBj4a3ydji1bP09sJk5jrqm1TYHwA5_2Bw",
    authDomain: "kraft-website-4f5dc.firebaseapp.com",
    databaseURL:
      "https://kraft-website-4f5dc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kraft-website-4f5dc",
    storageBucket: "kraft-website-4f5dc.firebasestorage.app",
    messagingSenderId: "400396083422",
    appId: "1:400396083422:web:68fc22910be7e16a33624f",
  };

  // --- Fallback posts (shown when Firebase fails) ---
  var FALLBACK_POSTS = [
    {
      id: 1702000000000,
      title: "Welcome to Our Craft Blog!",
      text: "Hi there, crafty friends! Welcome to our creative space where we share tutorials, inspirations, and behind-the-scenes stories of our handcrafted journey. Stay tuned for exciting content coming soon!",
      image: null,
    },
  ];

  // --- Initialize Firebase ---
  var db = null;
  var postsRef = null;
  var auth = null;
  var firebaseReady = false;

  try {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      db = firebase.database();
      postsRef = db.ref("blogPosts");
      auth = firebase.auth();
      firebaseReady = true;
    }
  } catch (e) {
    console.error("Firebase init error:", e);
    firebaseReady = false;
  }

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
  var isAdmin = false;
  var pendingImageData = null;
  var allPosts = [];

  // --- Firebase helpers ---
  function loadPosts(callback) {
    if (!firebaseReady) {
      allPosts = FALLBACK_POSTS.slice();
      callback();
      return;
    }

    postsRef
      .once("value")
      .then(function (snapshot) {
        var data = snapshot.val();
        if (data) {
          allPosts = [];
          Object.keys(data).forEach(function (key) {
            var post = data[key];
            post._key = key;
            allPosts.push(post);
          });
        } else {
          allPosts = [];
        }
        callback();
      })
      .catch(function (err) {
        console.error("Firebase read error:", err);
        allPosts = FALLBACK_POSTS.slice();
        callback();
      });
  }

  function savePost(post, callback) {
    if (!firebaseReady) {
      alert("Database is not available. Please try again later.");
      return;
    }

    var newRef = postsRef.push();
    post._key = newRef.key;
    newRef
      .set(post)
      .then(function () {
        if (callback) callback();
      })
      .catch(function (err) {
        console.error("Firebase write error:", err);
        alert("Failed to save post. Please try again.");
      });
  }

  function updatePost(post, callback) {
    if (!firebaseReady || !post._key) return;

    postsRef
      .child(post._key)
      .set(post)
      .then(function () {
        if (callback) callback();
      })
      .catch(function (err) {
        console.error("Firebase update error:", err);
        alert("Failed to update post. Please try again.");
      });
  }

  function removePost(postKey, callback) {
    if (!firebaseReady || !postKey) return;

    postsRef
      .child(postKey)
      .remove()
      .then(function () {
        if (callback) callback();
      })
      .catch(function (err) {
        console.error("Firebase delete error:", err);
        alert("Failed to delete post. Please try again.");
      });
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
    postsContainer.innerHTML = "";

    if (allPosts.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Show newest first
    allPosts
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
          editBtn.setAttribute("data-post-key", post._key || "");
          editBtn.setAttribute("data-post-id", post.id);
          editBtn.addEventListener("click", function () {
            var postId = parseInt(this.getAttribute("data-post-id"), 10);
            openEditModal(postId);
          });
          actions.appendChild(editBtn);

          var delBtn = document.createElement("button");
          delBtn.className = "blog-delete-btn";
          delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
          delBtn.setAttribute("data-post-key", post._key || "");
          delBtn.addEventListener("click", function () {
            var postKey = this.getAttribute("data-post-key");
            if (confirm("Are you sure you want to delete this post?")) {
              removePost(postKey, function () {
                loadPosts(function () {
                  renderPosts();
                });
              });
            }
          });
          actions.appendChild(delBtn);
        }

        card.appendChild(actions);
        postsContainer.appendChild(card);
      });
  }

  // --- Admin toggle button ---
  adminToggleBtn.addEventListener("click", function () {
    if (isAdmin) {
      auth.signOut();
    } else {
      loginModal.style.display = "flex";
      loginError.style.display = "none";
      usernameInput.value = "";
      passwordInput.value = "";
      usernameInput.focus();
    }
  });

  // --- Login (Firebase Authentication) ---
  function attemptLogin() {
    if (!firebaseReady) {
      loginError.textContent = "Login is unavailable right now.";
      loginError.style.display = "block";
      return;
    }

    var email = usernameInput.value.trim();
    var pass = passwordInput.value;

    loginBtn.disabled = true;
    auth
      .signInWithEmailAndPassword(email, pass)
      .then(function () {
        loginBtn.disabled = false;
        loginModal.style.display = "none";
      })
      .catch(function () {
        loginBtn.disabled = false;
        loginError.textContent = "Invalid email or password.";
        loginError.style.display = "block";
      });
  }

  loginBtn.addEventListener("click", attemptLogin);

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

    savePost(newPost, function () {
      postTitleInput.value = "";
      postTextInput.value = "";
      postImageInput.value = "";
      imagePreviewContainer.style.display = "none";
      pendingImageData = null;

      loadPosts(function () {
        renderPosts();
      });
    });
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
    var post = null;
    for (var i = 0; i < allPosts.length; i++) {
      if (allPosts[i].id === postId) {
        post = allPosts[i];
        break;
      }
    }
    if (!post) return;

    editPostIdInput.value = post.id;
    editPostIdInput.setAttribute("data-post-key", post._key || "");
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
    var postKey = editPostIdInput.getAttribute("data-post-key");
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

    var post = null;
    for (var i = 0; i < allPosts.length; i++) {
      if (allPosts[i].id === postId) {
        post = allPosts[i];
        break;
      }
    }
    if (!post) return;

    post.title = newTitle;
    post.text = newText;

    if (editPendingImageData) {
      post.image = editPendingImageData;
    } else if (editImageRemoved) {
      post.image = null;
    }

    updatePost(post, function () {
      closeEditModal();
      loadPosts(function () {
        renderPosts();
      });
    });
  });

  // --- Initialize ---
  loadPosts(function () {
    renderPosts();
  });

  if (firebaseReady) {
    auth.onAuthStateChanged(function (user) {
      isAdmin = !!user;
      updateAdminUI();
      renderPosts();
    });
  } else {
    updateAdminUI();
  }
})();
