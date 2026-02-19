(function () {
  const GRID_SIZE = 8;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;
  const TRANSITION_DURATION = 0.6;
  const TRANSITION_EASE = "power2.inOut";

  let zoom = 1;
  let userZoomEnabled = false; // User zoom disabled; only system (scene) zoom
  let currentScene = -1;
  let currentZoomCenter = null;
  let sceneZoomTween = null;
  let autoTimer = null;
  let sceneClickHandler = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let isTransitioning = false; // Block clicks during transitions

  if (typeof Flip === "undefined") {
    console.warn("Engine: GSAP Flip plugin not loaded.");
  }
  if (typeof gsap !== "undefined") {
    gsap.defaults({ ease: TRANSITION_EASE });
  }

  // --- DOM setup ---

  const container = document.createElement("div");
  container.id = "grid-container";
  Object.assign(container.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });
  document.body.appendChild(container);

  const grid = document.createElement("div");
  grid.id = "grid";
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(" + GRID_SIZE + ", 12.5vw)",
    gridTemplateRows: "repeat(" + GRID_SIZE + ", 12.5vh)",
    width: "100vw",
    height: "100vh",
    transformOrigin: "center center",
    transform: "scale(" + zoom + ")",
  });
  container.appendChild(grid);

  const cells = [];

  for (var i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    var cell = document.createElement("div");
    cell.className = "cell";
    Object.assign(cell.style, {
      width: "12.5vw",
      height: "12.5vh",
      overflow: "hidden",
      position: "relative",
      border: "1px solid white",
      opacity: "0", // Start all cells hidden
    });
    grid.appendChild(cell);
    cells.push(cell);
  }

  // --- Image preloader cache ---
  var imageCache = {};

  function preloadImage(src) {
    if (!src || imageCache[src]) return Promise.resolve();
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        imageCache[src] = true;
        resolve();
      };
      img.onerror = function () {
        resolve(); // Don't block on failed loads
      };
      img.src = src;
    });
  }

  function preloadSceneImages(scene) {
    if (!scene || !Array.isArray(scene.blocks)) return Promise.resolve();
    var promises = scene.blocks
      .filter(function (b) { return b.image && b.visible !== false; })
      .map(function (b) { return preloadImage(b.image); });
    return Promise.all(promises);
  }

  // --- Custom cursor tooltip ---

  var tooltipActive = false;
  const tooltipEl = document.createElement("div");
  tooltipEl.id = "cursor-tooltip";
  Object.assign(tooltipEl.style, {
    position: "fixed",
    pointerEvents: "none",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    background: "rgba(0,0,0,0.8)",
    padding: "6px 12px",
    borderRadius: "6px",
    zIndex: "1000",
    whiteSpace: "nowrap",
    display: "none",
    opacity: "0",
  });
  document.body.appendChild(tooltipEl);

  document.addEventListener("mousemove", function (e) {
    if (!tooltipActive) return;
    tooltipEl.style.left = (e.clientX + 16) + "px";
    tooltipEl.style.top = (e.clientY + 16) + "px";
  });

  // --- Bottom text: two layers for crossfade ---

  const bottomTextWrap = document.createElement("div");
  bottomTextWrap.id = "bottom-text-wrap";
  Object.assign(bottomTextWrap.style, {
    position: "fixed",
    bottom: "8%",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: "999",
    width: "100%",
    maxWidth: "400px",
  });
  document.body.appendChild(bottomTextWrap);

  var bottomTextElA = document.createElement("div");
  var bottomTextElB = document.createElement("div");
  [bottomTextElA, bottomTextElB].forEach(function (el) {
    Object.assign(el.style, {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      color: "#fff",
      fontSize: "18px",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      opacity: "0",
      width: "100%",
    });
    bottomTextWrap.appendChild(el);
  });

  // --- Vignette overlay ---

  const vignetteEl = document.createElement("div");
  vignetteEl.id = "vignette";
  Object.assign(vignetteEl.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "500",
    background: "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.35) 100%)",
  });
  document.body.appendChild(vignetteEl);

  var bottomTextActive = 0;
  function getBottomTextEl() {
    return bottomTextActive === 0 ? bottomTextElA : bottomTextElB;
  }
  function getBottomTextInactive() {
    return bottomTextActive === 0 ? bottomTextElB : bottomTextElA;
  }

  // --- Zoom helpers ---

  function clampZoom(value) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  }

  function applyZoom() {
    grid.style.transform = "scale(" + zoom + ")";
  }

  // zoomCenter: grid coords (0–7). Convert to percentage of grid dimensions for transform-origin.
  function setZoomOrigin(center) {
    currentZoomCenter = center;
    if (center && typeof center.x === "number" && typeof center.y === "number") {
      var px = ((center.x + 0.5) / GRID_SIZE) * 100;
      var py = ((center.y + 0.5) / GRID_SIZE) * 100;
      grid.style.transformOrigin = px + "% " + py + "%";
    } else {
      grid.style.transformOrigin = "50% 50%";
    }
  }

  function killSceneZoomTween() {
    if (sceneZoomTween) {
      sceneZoomTween.kill();
      sceneZoomTween = null;
    }
  }

  // --- Desktop: scroll-wheel zoom (smooth; kills scene zoom so it doesn't interfere) ---

  document.addEventListener(
    "wheel",
    function (e) {
      if (!userZoomEnabled) return;
      killSceneZoomTween();
      e.preventDefault();
      var delta = -e.deltaY * 0.002;
      zoom = clampZoom(zoom + zoom * delta);
      applyZoom();
    },
    { passive: false }
  );

  // --- Mobile: pinch-to-zoom (smooth; kills scene zoom so it doesn't interfere) ---

  function getTouchDistance(touches) {
    var dx = touches[1].clientX - touches[0].clientX;
    var dy = touches[1].clientY - touches[0].clientY;
    return Math.hypot(dx, dy);
  }

  document.addEventListener("touchstart", function (e) {
    if (!userZoomEnabled) return;
    if (e.touches.length === 2) {
      killSceneZoomTween();
      e.preventDefault();
      pinchStartDistance = getTouchDistance(e.touches);
      pinchStartZoom = zoom;
    }
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (!userZoomEnabled) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      var currentDistance = getTouchDistance(e.touches);
      zoom = clampZoom(pinchStartZoom * (currentDistance / pinchStartDistance));
      applyZoom();
    }
  }, { passive: false });

  // --- Cell helpers ---

  function getCell(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return cells[row * GRID_SIZE + col];
  }

  function blockKey(block) {
    return block.x + "," + block.y;
  }

  function blocksMap(blocks) {
    var map = {};
    if (!Array.isArray(blocks)) return map;
    blocks.forEach(function (b) {
      map[blockKey(b)] = b;
    });
    return map;
  }

  // --- Block rendering ---

  function makePlaceholder(x, y) {
    var el = document.createElement("div");
    Object.assign(el.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#555",
      color: "#999",
      fontSize: "12px",
      fontFamily: "system-ui, sans-serif",
      border: "1px solid white",
      boxSizing: "border-box",
    });
    el.textContent = x + "," + y;
    return el;
  }

  function makeImageEl(src, x, y) {
    var img = document.createElement("img");
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    });
    img.onerror = function () {
      var parent = img.parentNode;
      if (parent) {
        parent.removeChild(img);
        parent.appendChild(makePlaceholder(x, y));
      }
    };
    img.src = src;
    return img;
  }

  // Set cell content without any animation — purely a DOM operation
  function setCellContent(cell, block) {
    var x = block.x;
    var y = block.y;
    var hasImage = !!block.image;
    var sepiaAmount = block.sepia === true ? 1 : (typeof block.sepia === "number" ? block.sepia : 0);

    // Kill any running GSAP on this cell to prevent conflicts
    gsap.killTweensOf(cell);

    cell.innerHTML = "";
    cell.style.filter = sepiaAmount > 0 ? "sepia(" + sepiaAmount + ")" : "";

    if (block.visible === false) {
      // Hidden block: keep invisible
      cell.style.opacity = "0";
      return;
    }

    if (hasImage) {
      cell.appendChild(makeImageEl(block.image, x, y));
    } else {
      cell.appendChild(makePlaceholder(x, y));
    }
  }

  // --- Scene state machine ---

  function teardownTransition() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    if (sceneClickHandler) {
      document.removeEventListener("click", sceneClickHandler);
      sceneClickHandler = null;
    }
  }

  function goToScene(n, opts) {
    var scenes = window.Scenes;
    if (!scenes || n < 0 || n >= scenes.length) return;

    opts = opts || {};
    var silent = opts.silent || opts.noAnimation;
    var duration = silent ? 0 : (opts.duration !== undefined ? opts.duration : TRANSITION_DURATION);

    teardownTransition();
    killSceneZoomTween();

    var prevSceneIndex = currentScene;
    var prevBlocks = prevSceneIndex >= 0 && scenes[prevSceneIndex] && Array.isArray(scenes[prevSceneIndex].blocks)
      ? scenes[prevSceneIndex].blocks
      : [];
    var nextScene = scenes[n];
    var nextBlocks = Array.isArray(nextScene.blocks) ? nextScene.blocks : [];

    currentScene = n;

    var prevMap = blocksMap(prevBlocks);
    var nextMap = blocksMap(nextBlocks);

    // Classify cells
    var persistentKeys = [];
    Object.keys(nextMap).forEach(function (k) {
      if (prevMap[k]) persistentKeys.push(k);
    });
    var appearingKeys = Object.keys(nextMap).filter(function (k) { return !prevMap[k]; });
    var disappearingKeys = Object.keys(prevMap).filter(function (k) { return !nextMap[k]; });

    // --- Preload images, then animate ---
    var doTransition = function () {
      isTransitioning = duration > 0;

      // Master timeline for the entire transition
      var tl = duration > 0 ? gsap.timeline({
        onComplete: function () {
          sceneZoomTween = null;
          isTransitioning = false;
        }
      }) : null;

      if (tl) sceneZoomTween = tl;

      // --- 1. Set zoom origin BEFORE animating ---
      setZoomOrigin(nextScene.zoomCenter || null);
      var targetZoom = typeof nextScene.zoom === "number" ? clampZoom(nextScene.zoom) : zoom;

      // --- 2. Fade out disappearing cells ---
      disappearingKeys.forEach(function (k) {
        var b = prevMap[k];
        var c = getCell(b.y, b.x);
        if (!c) return;
        if (duration > 0) {
          tl.to(c, {
            opacity: 0,
            duration: duration * 0.4,
            ease: TRANSITION_EASE,
            onComplete: function () {
              c.innerHTML = "";
              c.style.filter = "";
            },
          }, 0);
        } else {
          gsap.killTweensOf(c);
          c.innerHTML = "";
          c.style.opacity = "0";
          c.style.filter = "";
        }
      });

      // --- 3. Handle persistent cells (same grid position in both scenes) ---
      persistentKeys.forEach(function (k) {
        var prevBlock = prevMap[k];
        var nextBlock = nextMap[k];
        var c = getCell(nextBlock.y, nextBlock.x);
        if (!c) return;

        var contentChanged = prevBlock.image !== nextBlock.image ||
          prevBlock.visible !== nextBlock.visible ||
          prevBlock.sepia !== nextBlock.sepia;

        if (contentChanged) {
          if (duration > 0) {
            // Crossfade: fade out old, swap content, fade in new
            tl.to(c, {
              opacity: 0,
              duration: duration * 0.3,
              ease: TRANSITION_EASE,
              onComplete: function () {
                setCellContent(c, nextBlock);
              },
            }, 0);
            tl.to(c, {
              opacity: nextBlock.visible === false ? 0 : 1,
              duration: duration * 0.3,
              ease: TRANSITION_EASE,
            }, duration * 0.35);
          } else {
            setCellContent(c, nextBlock);
            c.style.opacity = nextBlock.visible === false ? "0" : "1";
          }
        } else {
          // No content change — just ensure correct opacity
          if (nextBlock.visible === false) {
            if (duration > 0) {
              tl.to(c, { opacity: 0, duration: duration * 0.3, ease: TRANSITION_EASE }, 0);
            } else {
              c.style.opacity = "0";
            }
          }
          // Otherwise leave it as-is (already visible)
        }
      });

      // --- 4. Appearing cells: set content while invisible, then fade in ---
      appearingKeys.forEach(function (k) {
        var b = nextMap[k];
        var c = getCell(b.y, b.x);
        if (!c) return;

        gsap.killTweensOf(c);
        c.style.opacity = "0"; // Ensure invisible before setting content
        setCellContent(c, b);

        if (b.visible === false) {
          // Stays hidden
          return;
        }

        if (duration > 0) {
          // Slight delay so disappearing cells clear first
          tl.to(c, {
            opacity: 1,
            duration: duration * 0.5,
            ease: TRANSITION_EASE,
          }, duration * 0.2);
        } else {
          c.style.opacity = "1";
        }
      });

      // --- 5. Cells not in either scene: ensure hidden (no flash) ---
      for (var row = 0; row < GRID_SIZE; row++) {
        for (var col = 0; col < GRID_SIZE; col++) {
          var key = col + "," + row;
          if (nextMap[key] || prevMap[key]) continue;
          var c = getCell(row, col);
          if (c) {
            gsap.killTweensOf(c);
            c.innerHTML = "";
            c.style.opacity = "0";
            c.style.filter = "";
          }
        }
      }

      // --- 6. Animate zoom ---
      if (duration > 0) {
        var zoomProxy = { s: zoom };
        tl.to(zoomProxy, {
          s: targetZoom,
          duration: duration,
          ease: TRANSITION_EASE,
          onUpdate: function () {
            zoom = zoomProxy.s;
            applyZoom();
          },
        }, 0);
      } else {
        zoom = targetZoom;
        applyZoom();
      }

      // --- 7. Bottom text crossfade ---
      if (duration > 0) {
        if (nextScene.bottomText) {
          var outEl = getBottomTextEl();
          var inEl = getBottomTextInactive();
          inEl.textContent = nextScene.bottomText;
          inEl.style.opacity = "0";
          tl.to(outEl, { opacity: 0, duration: duration * 0.4, ease: TRANSITION_EASE }, 0);
          tl.to(inEl, { opacity: 1, duration: duration * 0.4, ease: TRANSITION_EASE }, duration * 0.25);
          bottomTextActive = 1 - bottomTextActive;
        } else {
          tl.to(getBottomTextEl(), { opacity: 0, duration: duration * 0.3, ease: TRANSITION_EASE }, 0);
        }
      } else {
        if (nextScene.bottomText) {
          var el = getBottomTextEl();
          el.textContent = nextScene.bottomText;
          el.style.opacity = "1";
          getBottomTextInactive().style.opacity = "0";
        } else {
          getBottomTextEl().style.opacity = "0";
        }
      }

      // --- Non-animated UI ---
      userZoomEnabled = !!nextScene.userZoomEnabled;
      document.body.style.cursor = nextScene.cursor || "default";

      // Tooltip
      if (nextScene.tooltipVisible && nextScene.cursorTooltip != null && nextScene.cursorTooltip !== "") {
        tooltipActive = true;
        tooltipEl.textContent = nextScene.cursorTooltip;
        tooltipEl.style.display = "block";
        gsap.to(tooltipEl, { opacity: 1, duration: 0.3, ease: TRANSITION_EASE });
      } else {
        tooltipActive = false;
        gsap.to(tooltipEl, {
          opacity: 0, duration: 0.2, ease: TRANSITION_EASE, onComplete: function () {
            tooltipEl.style.display = "none";
          }
        });
      }

      // --- Transition: auto or click ---
      if (nextScene.transition === "auto" && typeof nextScene.autoDuration === "number") {
        autoTimer = setTimeout(function () {
          goToScene(currentScene + 1);
        }, nextScene.autoDuration);
      } else if (nextScene.transition === "click") {
        sceneClickHandler = function () {
          if (isTransitioning) return; // Block clicks during animation
          document.removeEventListener("click", sceneClickHandler);
          sceneClickHandler = null;
          goToScene(currentScene + 1);
        };
        document.addEventListener("click", sceneClickHandler);
      }

      if (isDev && window.EngineRefreshDevSelect) window.EngineRefreshDevSelect();
    };

    // Preload images for the next scene before transitioning
    if (duration > 0) {
      preloadSceneImages(nextScene).then(doTransition);
    } else {
      doTransition();
    }
  }

  // --- Dev mode overlay (?dev) ---

  var isDev = typeof location !== "undefined" && location.search.indexOf("dev") !== -1;

  if (isDev) {
    var devPanel = document.createElement("div");
    devPanel.id = "dev-overlay";
    Object.assign(devPanel.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: "10000",
      background: "rgba(0,0,0,0.85)",
      color: "#eee",
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      padding: "12px",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      minWidth: "200px",
    });

    var devLabel = document.createElement("label");
    devLabel.textContent = "Scene";
    devLabel.style.display = "flex";
    devLabel.style.alignItems = "center";
    devLabel.style.gap = "8px";

    var devSelect = document.createElement("select");
    Object.assign(devSelect.style, {
      flex: "1",
      padding: "4px 8px",
      background: "#333",
      color: "#fff",
      border: "1px solid #555",
      borderRadius: "4px",
    });

    var devPrev = document.createElement("button");
    devPrev.textContent = "\u2190";
    var devNext = document.createElement("button");
    devNext.textContent = "\u2192";
    [devPrev, devNext].forEach(function (btn) {
      Object.assign(btn.style, {
        padding: "6px 12px",
        background: "#444",
        color: "#fff",
        border: "1px solid #555",
        borderRadius: "4px",
        cursor: "pointer",
      });
    });

    var devRow = document.createElement("div");
    devRow.style.display = "flex";
    devRow.style.gap = "8px";
    devRow.appendChild(devPrev);
    devRow.appendChild(devNext);

    function refreshDevSelect() {
      devSelect.innerHTML = "";
      var scenes = window.Scenes;
      if (!scenes) return;
      scenes.forEach(function (s, i) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = (s.id != null ? s.id : "Scene " + i);
        if (i === currentScene) opt.selected = true;
        devSelect.appendChild(opt);
      });
    }

    devSelect.addEventListener("change", function () {
      var target = parseInt(devSelect.value, 10);
      if (target === currentScene) return;
      if (target > 0) {
        goToScene(target - 1, { silent: true });
      }
      goToScene(target);
      refreshDevSelect();
    });

    devPrev.addEventListener("click", function (e) {
      e.stopPropagation();
      if (currentScene <= 0) return;
      var target = currentScene - 1;
      if (target > 0) {
        goToScene(target - 1, { silent: true });
      }
      goToScene(target);
      refreshDevSelect();
    });

    devNext.addEventListener("click", function (e) {
      e.stopPropagation();
      var scenes = window.Scenes;
      if (!scenes || currentScene >= scenes.length - 1) return;
      var target = currentScene + 1;
      goToScene(currentScene, { silent: true });
      goToScene(target);
      refreshDevSelect();
    });

    devLabel.appendChild(devSelect);
    devPanel.appendChild(devLabel);
    devPanel.appendChild(devRow);
    document.body.appendChild(devPanel);

    window.EngineRefreshDevSelect = refreshDevSelect;
  }

  // --- Public API ---

  window.Engine = {
    GRID_SIZE: GRID_SIZE,
    grid: grid,
    cells: cells,

    goToScene: goToScene,

    start: function () {
      // Preload first scene images before starting
      var scenes = window.Scenes;
      if (scenes && scenes.length > 0) {
        preloadSceneImages(scenes[0]).then(function () {
          goToScene(0);
          if (isDev && window.EngineRefreshDevSelect) window.EngineRefreshDevSelect();
        });
      }
    },

    getCurrentScene: function () {
      return currentScene;
    },

    setCellImage: function (row, col, src) {
      var c = getCell(row, col);
      if (!c) return;
      var img = c.querySelector("img");
      if (!img) {
        img = document.createElement("img");
        Object.assign(img.style, {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        });
        c.appendChild(img);
      }
      img.src = src;
      c.style.opacity = "1";
    },

    clearCell: function (row, col) {
      var c = getCell(row, col);
      if (!c) return;
      c.innerHTML = "";
    },

    showCell: function (row, col) {
      var c = getCell(row, col);
      if (c) c.style.opacity = "1";
    },

    hideCell: function (row, col) {
      var c = getCell(row, col);
      if (c) c.style.opacity = "0";
    },

    getZoom: function () {
      return zoom;
    },

    setZoom: function (value) {
      zoom = clampZoom(value);
      applyZoom();
    },
  };
})();
