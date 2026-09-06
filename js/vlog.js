// ===========================
// YouTube Channel Videos (Vlog page)
// Uses YouTube Data API v3 to auto-fetch videos from @HimeshiThisara
// ===========================
(function () {
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
