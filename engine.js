(function () {
  const GRID_SIZE = 3;
  const CELL_SIZE = "min(100vw/3, 100vh/3)";
  const TRANSITION_DURATION = 0.6;
  const TRANSITION_EASE = "power2.inOut";

  let currentScene = -1;
  let autoTimer = null;
  let sceneClickHandler = null;
  let cellClickHandlers = [];
  let isTransitioning = false;

  if (typeof gsap !== "undefined") {
    gsap.defaults({ ease: TRANSITION_EASE });
  }

  // --- DOM setup ---

  const gridClipWrapper = document.createElement("div");
  gridClipWrapper.id = "grid-clip-wrapper";
  Object.assign(gridClipWrapper.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  });
  document.body.appendChild(gridClipWrapper);

  const container = document.createElement("div");
  container.id = "grid-container";
  Object.assign(container.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });
  gridClipWrapper.appendChild(container);

  const grid = document.createElement("div");
  grid.id = "grid";
  Object.assign(grid.style, {
    display: "grid",
    gridTemplateColumns: "repeat(" + GRID_SIZE + ", " + CELL_SIZE + ")",
    gridTemplateRows: "repeat(" + GRID_SIZE + ", " + CELL_SIZE + ")",
    width: "fit-content",
    height: "fit-content",
  });
  container.appendChild(grid);

  const cells = [];

  for (var i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    var row = Math.floor(i / GRID_SIZE);
    var col = i % GRID_SIZE;
    var cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.row = row;
    cell.dataset.col = col;
    Object.assign(cell.style, {
      width: CELL_SIZE,
      height: CELL_SIZE,
      overflow: "hidden",
      position: "relative",
      border: "1px solid white",
      opacity: "0",
    });
    cell.addEventListener("mouseenter", function (e) {
      var r = parseInt(this.dataset.row, 10);
      var col = parseInt(this.dataset.col, 10);
      var block = getBlockAt(r, col);
      if (!block) return;
      var scene = window.Scenes && window.Scenes[currentScene];
      if (block.hoverCursor) {
        document.body.style.cursor = block.hoverCursor;
      }
      if (block.hoverTooltip != null && block.hoverTooltip !== "") {
        scheduleOrShowTooltip(block.hoverTooltip, e.clientX, e.clientY);
      }
    });
    cell.addEventListener("mouseleave", function () {
      var scene = window.Scenes && window.Scenes[currentScene];
      if (!scene) return;
      document.body.style.cursor = scene.cursor || "default";
      clearTooltipDelay();
      if (scene.tooltipVisible && scene.cursorTooltip != null && scene.cursorTooltip !== "") {
        scheduleOrShowTooltip(scene.cursorTooltip, lastMouseX, lastMouseY);
      } else {
        tooltipActive = false;
        tooltipEl.style.display = "none";
        tooltipEl.style.opacity = "0";
      }
    });
    grid.appendChild(cell);
    cells.push(cell);
  }

  // --- Breakout grid overlay (for scenes that show all images outside 3x3) ---
  const breakoutOverlay = document.createElement("div");
  breakoutOverlay.id = "breakout-overlay";
  Object.assign(breakoutOverlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    display: "none",
    zIndex: "100",
    background: "#000",
  });
  document.body.appendChild(breakoutOverlay);

  const breakoutGridEl = document.createElement("div");
  breakoutGridEl.id = "breakout-grid";
  Object.assign(breakoutGridEl.style, {
    display: "grid",
    width: "100vw",
    height: "100vh",
    gap: "0",
    padding: "0",
    boxSizing: "border-box",
  });
  breakoutOverlay.appendChild(breakoutGridEl);

  var breakoutClickHandler = null;

  function showBreakoutGrid(scene) {
    var images = scene.breakoutImages || [];
    var centerImage = scene.breakoutCenterImage || "";
    if (images.length === 0 && !centerImage) return;

    var list = [];
    if (images.length > 0) {
      list = images.slice();
    }
    if (centerImage && list.indexOf(centerImage) === -1) {
      list.push(centerImage);
    }
    if (list.length === 0) return;

    var centerIndex = Math.floor(list.length / 2);
    var idx = list.indexOf(centerImage);
    if (idx !== -1 && idx !== centerIndex) {
      list.splice(idx, 1);
      list.splice(centerIndex, 0, centerImage);
    }

    var cols = 6;
    var rows = Math.ceil(list.length / cols);
    if (rows * cols > list.length) {
      cols = 2;
      rows = Math.ceil(list.length / cols);
    }
    breakoutGridEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    breakoutGridEl.style.gridTemplateRows = "repeat(" + rows + ", 1fr)";
    breakoutGridEl.innerHTML = "";

    list.forEach(function (src, i) {
      var cell = document.createElement("div");
      Object.assign(cell.style, {
        width: "100%",
        height: "100%",
        minWidth: "0",
        minHeight: "0",
        overflow: "hidden",
        position: "relative",
        border: "1px solid rgba(255,255,255,0.2)",
        boxSizing: "border-box",
      });
      var img = document.createElement("img");
      Object.assign(img.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      });
      img.src = src;
      cell.appendChild(img);
      var isCenter = (src === centerImage);
      if (isCenter) {
        cell.style.cursor = (scene.cursor || "zoom-in");
        cell.dataset.clickable = "true";
      }
      breakoutGridEl.appendChild(cell);
    });

    gridClipWrapper.style.visibility = "hidden";
    breakoutOverlay.style.display = "block";

    if (centerImage && breakoutClickHandler === null) {
      breakoutClickHandler = function (e) {
        var cell = e.target.closest("[data-clickable=true]");
        if (!cell || isTransitioning) return;
        e.stopPropagation();
        teardownBreakout();
        goToScene(currentScene + 1);
      };
      breakoutOverlay.addEventListener("click", breakoutClickHandler);
    }
  }

  function teardownBreakout() {
    breakoutOverlay.style.display = "none";
    breakoutGridEl.innerHTML = "";
    gridClipWrapper.style.visibility = "";
    if (breakoutClickHandler) {
      breakoutOverlay.removeEventListener("click", breakoutClickHandler);
      breakoutClickHandler = null;
    }
  }

  function hideBreakoutIfActive() {
    if (breakoutOverlay.style.display === "block") {
      teardownBreakout();
    }
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
        resolve();
      };
      img.src = src;
    });
  }

  function preloadSceneImages(scene) {
    if (!scene) return Promise.resolve();
    var promises = [];
    if (Array.isArray(scene.blocks)) {
      scene.blocks
        .filter(function (b) { return b.image && b.visible !== false; })
        .forEach(function (b) { promises.push(preloadImage(b.image)); });
    }
    if (scene.breakoutGrid && Array.isArray(scene.breakoutImages)) {
      scene.breakoutImages.forEach(function (src) { promises.push(preloadImage(src)); });
    }
    if (scene.breakoutGrid && scene.breakoutCenterImage) {
      promises.push(preloadImage(scene.breakoutCenterImage));
    }
    return Promise.all(promises);
  }

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
    maxWidth: "600px",
  });
  document.body.appendChild(bottomTextWrap);

  var bottomTextElA = document.createElement("div");
  var bottomTextElB = document.createElement("div");
  [bottomTextElA, bottomTextElB].forEach(function (el) {
    Object.assign(el.style, {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      color: "#ffd700",
      fontWeight: "400",
      fontSize: "18px",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
      opacity: "0",
      width: "100%",
      textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000",
    });
    bottomTextWrap.appendChild(el);
  });

  var bottomTextActive = 0;

  // --- Cursor tooltip ---

  var tooltipActive = false;
  var tooltipDelayTimer = null;
  var lastMouseX = -1;
  var lastMouseY = -1;
  var tooltipDelayMs = 1000;

  function clearTooltipDelay() {
    if (tooltipDelayTimer) {
      clearTimeout(tooltipDelayTimer);
      tooltipDelayTimer = null;
    }
  }

  function scheduleOrShowTooltip(text, x, y) {
    var scene = window.Scenes && window.Scenes[currentScene];
    if (!scene || !text) return;
    clearTooltipDelay();
    if (scene.tooltipDelay) {
      tooltipDelayTimer = setTimeout(function () {
        tooltipDelayTimer = null;
        tooltipActive = true;
        tooltipEl.textContent = text;
        tooltipEl.style.display = "block";
        tooltipEl.style.opacity = "1";
        tooltipEl.style.left = (x + 16) + "px";
        tooltipEl.style.top = (y + 16) + "px";
      }, tooltipDelayMs);
    } else {
      tooltipActive = true;
      tooltipEl.textContent = text;
      tooltipEl.style.display = "block";
      tooltipEl.style.opacity = "1";
      tooltipEl.style.left = (x + 16) + "px";
      tooltipEl.style.top = (y + 16) + "px";
    }
  }
  const tooltipEl = document.createElement("div");
  tooltipEl.id = "cursor-tooltip";
  Object.assign(tooltipEl.style, {
    position: "fixed",
    pointerEvents: "none",
    color: "white",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    background: "rgba(0,0,0,0.8)",
    padding: "6px 12px",
    borderRadius: "0px",
    zIndex: "1000",
    maxWidth: "250px",
    whiteSpace: "normal",
    display: "none",
    opacity: "0",
  });
  document.body.appendChild(tooltipEl);

  document.addEventListener("mousemove", function (e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (!tooltipActive) return;
    tooltipEl.style.left = (e.clientX + 16) + "px";
    tooltipEl.style.top = (e.clientY + 16) + "px";
  });

  function applyHoverUnderCursor() {
    if (lastMouseX < 0 && lastMouseY < 0) return;
    if (breakoutOverlay.style.display === "block") return;
    var scene = window.Scenes && window.Scenes[currentScene];
    if (!scene) return;
    var sceneCursor = scene.cursor || "default";
    var el = document.elementFromPoint(lastMouseX, lastMouseY);
    var cell = el && el.closest && el.closest(".cell");
    if (cell && !cell.closest("#breakout-overlay")) {
      var r = parseInt(cell.dataset.row, 10);
      var c = parseInt(cell.dataset.col, 10);
      var block = getBlockAt(r, c);
      if (block && (block.hoverCursor || (block.hoverTooltip != null && block.hoverTooltip !== ""))) {
        if (block.hoverCursor) {
          document.body.style.cursor = block.hoverCursor;
        }
        if (block.hoverTooltip != null && block.hoverTooltip !== "") {
          scheduleOrShowTooltip(block.hoverTooltip, lastMouseX, lastMouseY);
        }
        return;
      }
    }
    document.body.style.cursor = sceneCursor;
    if (scene.tooltipVisible && scene.cursorTooltip != null && scene.cursorTooltip !== "") {
      scheduleOrShowTooltip(scene.cursorTooltip, lastMouseX, lastMouseY);
    } else {
      clearTooltipDelay();
      tooltipActive = false;
      tooltipEl.style.display = "none";
      tooltipEl.style.opacity = "0";
    }
  }

  function getBottomTextEl() {
    return bottomTextActive === 0 ? bottomTextElA : bottomTextElB;
  }
  function getBottomTextInactive() {
    return bottomTextActive === 0 ? bottomTextElB : bottomTextElA;
  }

  // --- Cell helpers ---

  function getBlockAt(row, col) {
    var scene = window.Scenes && window.Scenes[currentScene];
    if (!scene || !Array.isArray(scene.blocks)) return null;
    for (var i = 0; i < scene.blocks.length; i++) {
      var b = scene.blocks[i];
      if (b.x === col && b.y === row) return b;
    }
    return null;
  }

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

  function makeImageEl(src, x, y, fit) {
    var img = document.createElement("img");
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      objectFit: (fit === "contain" ? "contain" : "cover"),
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

  function setCellContent(cell, block, scene) {
    var x = block.x;
    var y = block.y;
    var hasImage = !!block.image;
    var sepiaAmount = block.sepia === true ? 1 : (typeof block.sepia === "number" ? block.sepia : 0);

    gsap.killTweensOf(cell);

    cell.innerHTML = "";
    cell.style.filter = sepiaAmount > 0 ? "sepia(" + sepiaAmount + ")" : "";

    if (block.visible === false) {
      cell.style.opacity = "0";
      return;
    }

    if (hasImage) {
      var fit = (block.imageFit || (scene && scene.imageFit) || "cover");
      cell.appendChild(makeImageEl(block.image, x, y, fit));
    } else {
      cell.appendChild(makePlaceholder(x, y));
    }
  }

  // --- Scene state machine ---

  function teardownTransition() {
    clearTooltipDelay();
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    if (sceneClickHandler) {
      document.removeEventListener("click", sceneClickHandler);
      sceneClickHandler = null;
    }
    cellClickHandlers.forEach(function (entry) {
      entry.cell.removeEventListener("click", entry.handler);
    });
    cellClickHandlers = [];
  }

  function goToScene(n, opts) {
    var scenes = window.Scenes;
    if (!scenes || n < 0 || n >= scenes.length) return;

    opts = opts || {};
    var silent = opts.silent || opts.noAnimation;
    var duration = silent ? 0 : (opts.duration !== undefined ? opts.duration : TRANSITION_DURATION);

    teardownTransition();

    var prevSceneIndex = currentScene;
    var prevScene = prevSceneIndex >= 0 && scenes[prevSceneIndex] ? scenes[prevSceneIndex] : null;
    var prevBlocks = prevSceneIndex >= 0 && scenes[prevSceneIndex] && Array.isArray(scenes[prevSceneIndex].blocks)
      ? scenes[prevSceneIndex].blocks
      : [];
    var nextScene = scenes[n];
    var nextBlocks = Array.isArray(nextScene.blocks) ? nextScene.blocks : [];

    currentScene = n;

    var prevMap = blocksMap(prevBlocks);
    var nextMap = blocksMap(nextBlocks);

    var persistentKeys = [];
    Object.keys(nextMap).forEach(function (k) {
      if (prevMap[k]) persistentKeys.push(k);
    });
    var appearingKeys = Object.keys(nextMap).filter(function (k) { return !prevMap[k]; });
    var disappearingKeys = Object.keys(prevMap).filter(function (k) { return !nextMap[k]; });

    var doTransition = function () {
      isTransitioning = duration > 0;

      // Restore cell borders (in case we hid them for slide transitions)
      cells.forEach(function (cell) {
        cell.style.border = "0px solid transparent";
      });

      if (!nextScene.breakoutGrid) {
        teardownBreakout();
      }

      var tl = duration > 0 ? gsap.timeline({
        onComplete: function () {
          isTransitioning = false;
          if (nextScene.breakoutGrid) {
            showBreakoutGrid(nextScene);
          } else {
            applyHoverUnderCursor();
          }
        }
      }) : null;

      if (nextScene.breakoutGrid) {
        gridClipWrapper.style.visibility = "hidden";
        if (duration === 0) {
          showBreakoutGrid(nextScene);
          isTransitioning = false;
        }
      }

      // --- 1. Fade out disappearing cells (skip when entering breakout) ---
      if (!nextScene.breakoutGrid) {
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

      // --- 2. Handle persistent cells ---
      persistentKeys.forEach(function (k) {
        var prevBlock = prevMap[k];
        var nextBlock = nextMap[k];
        var c = getCell(nextBlock.y, nextBlock.x);
        if (!c) return;

        var contentChanged = prevBlock.image !== nextBlock.image ||
          prevBlock.visible !== nextBlock.visible ||
          prevBlock.sepia !== nextBlock.sepia;

        if (contentChanged) {
          var useSlide = nextScene.transitionStyle === "slide" && duration > 0 && prevBlock.image && nextBlock.image;
          if (useSlide) {
            var slideDuration = typeof nextScene.slideDuration === "number" ? nextScene.slideDuration : duration * 1.5;
            var fit = (nextBlock.imageFit || (nextScene && nextScene.imageFit) || "cover");
            var slideOverlay = document.createElement("div");
            Object.assign(slideOverlay.style, {
              position: "fixed",
              top: "0",
              left: "0",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              zIndex: "50",
              pointerEvents: "none",
            });
            var slideTrack = document.createElement("div");
            Object.assign(slideTrack.style, {
              display: "flex",
              width: "200vw",
              height: "100%",
              willChange: "transform",
            });
            function makeSlidePanel(src) {
              var panel = document.createElement("div");
              Object.assign(panel.style, {
                width: "100vw",
                height: "100%",
                flexShrink: 0,
                overflow: "hidden",
              });
              var img = makeImageEl(src, nextBlock.x, nextBlock.y, fit);
              img.style.width = "100%";
              img.style.height = "100%";
              img.style.objectFit = fit === "contain" ? "contain" : "cover";
              panel.appendChild(img);
              return panel;
            }
            slideTrack.appendChild(makeSlidePanel(prevBlock.image));
            slideTrack.appendChild(makeSlidePanel(nextBlock.image));
            slideOverlay.appendChild(slideTrack);
            document.body.appendChild(slideOverlay);
            var slideTween = gsap.fromTo(slideTrack,
              { x: 0 },
              {
                x: "-100vw",
                duration: slideDuration,
                ease: TRANSITION_EASE,
                onComplete: function () {
                  setCellContent(c, nextBlock, nextScene);
                  c.style.opacity = nextBlock.visible === false ? "0" : "1";
                  c.style.border = "none";
                  if (slideOverlay.parentNode) slideOverlay.parentNode.removeChild(slideOverlay);
                },
              }
            );
            tl.add(slideTween, 0);
          } else if (duration > 0) {
            tl.to(c, {
              opacity: 0,
              duration: duration * 0.3,
              ease: TRANSITION_EASE,
              onComplete: function () {
                setCellContent(c, nextBlock, nextScene);
                var img = c.querySelector("img");
                var doFadeIn = function () {
                  gsap.to(c, {
                    opacity: nextBlock.visible === false ? 0 : 1,
                    duration: duration * 0.3,
                    ease: TRANSITION_EASE,
                  });
                };
                if (img && typeof img.decode === "function") {
                  img.decode().then(doFadeIn).catch(doFadeIn);
                } else {
                  doFadeIn();
                }
              },
            }, 0);
          } else {
            setCellContent(c, nextBlock, nextScene);
            c.style.opacity = nextBlock.visible === false ? "0" : "1";
          }
        } else {
          if (nextBlock.visible === false) {
            if (duration > 0) {
              tl.to(c, { opacity: 0, duration: duration * 0.3, ease: TRANSITION_EASE }, 0);
            } else {
              c.style.opacity = "0";
            }
          }
        }
      });

      // --- 3. Appearing cells ---
      appearingKeys.forEach(function (k) {
        var b = nextMap[k];
        var c = getCell(b.y, b.x);
        if (!c) return;

        gsap.killTweensOf(c);
        c.style.opacity = "0";
        setCellContent(c, b, nextScene);

        if (b.visible === false) return;

        if (duration > 0) {
          tl.to(c, {
            opacity: 1,
            duration: duration * 0.5,
            ease: TRANSITION_EASE,
          }, duration * 0.2);
        } else {
          c.style.opacity = "1";
        }
      });

      // --- 4. Cells not in either scene: ensure hidden ---
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

      // --- 5. Zoom ---
      var zoom = typeof nextScene.zoom === "number" ? nextScene.zoom : 1;
      var zc = nextScene.zoomCenter;
      var ox = (zc && typeof zc.x === "number") ? ((zc.x + 0.5) / 3 * 100) : 50;
      var oy = (zc && typeof zc.y === "number") ? ((zc.y + 0.5) / 3 * 100) : 50;
      grid.style.transformOrigin = ox + "% " + oy + "%";
      grid.style.transform = "scale(" + zoom + ")";
      if (zoom > 1) {
        var cellW = "calc(100vw / " + zoom + ")";
        var cellH = "calc(100vh / " + zoom + ")";
        grid.style.gridTemplateColumns = "repeat(" + GRID_SIZE + ", " + cellW + ")";
        grid.style.gridTemplateRows = "repeat(" + GRID_SIZE + ", " + cellH + ")";
        cells.forEach(function (cell) {
          cell.style.width = cellW;
          cell.style.height = cellH;
        });
      } else {
        grid.style.gridTemplateColumns = "repeat(" + GRID_SIZE + ", " + CELL_SIZE + ")";
        grid.style.gridTemplateRows = "repeat(" + GRID_SIZE + ", " + CELL_SIZE + ")";
        cells.forEach(function (cell) {
          cell.style.width = CELL_SIZE;
          cell.style.height = CELL_SIZE;
        });
      }
      }

      // --- 6. Cursor and tooltip ---
      document.body.style.cursor = nextScene.cursor || "default";
      if (nextScene.tooltipVisible && nextScene.cursorTooltip != null && nextScene.cursorTooltip !== "") {
        tooltipActive = true;
        tooltipEl.textContent = nextScene.cursorTooltip;
        tooltipEl.style.display = "block";
        if (typeof gsap !== "undefined") {
          gsap.to(tooltipEl, { opacity: 1, duration: 0.2, ease: TRANSITION_EASE });
        } else {
          tooltipEl.style.opacity = "1";
        }
      } else {
        tooltipActive = false;
        if (typeof gsap !== "undefined") {
          gsap.to(tooltipEl, {
            opacity: 0,
            duration: 0.2,
            ease: TRANSITION_EASE,
            onComplete: function () {
              tooltipEl.style.display = "none";
            },
          });
        } else {
          tooltipEl.style.display = "none";
          tooltipEl.style.opacity = "0";
        }
      }
      applyHoverUnderCursor();

      // --- 7. Bottom text crossfade ---
      var prevText = prevScene && prevScene.bottomText ? prevScene.bottomText : "";
      var nextText = nextScene.bottomText ? nextScene.bottomText : "";
      var textUnchanged = prevText === nextText && nextText !== "";
      var bottomTextDelay = !!(nextScene.bottomText && nextScene.delay);
      var bottomTextDelayMs = 1000;

      if (duration > 0) {
        if (nextScene.bottomText) {
          if (textUnchanged) {
            // Same text: keep visible, no animation
            var el = getBottomTextEl();
            el.textContent = nextText;
            el.style.opacity = "1";
            getBottomTextInactive().style.opacity = "0";
          } else {
            var outEl = getBottomTextEl();
            var inEl = getBottomTextInactive();
            inEl.textContent = nextText;
            inEl.style.opacity = "0";
            tl.to(outEl, { opacity: 0, duration: duration * 0.4, ease: TRANSITION_EASE }, 0);
            if (bottomTextDelay) {
              setTimeout(function () {
                if (typeof gsap !== "undefined") {
                  gsap.to(inEl, { opacity: 1, duration: 0.4, ease: TRANSITION_EASE });
                } else {
                  inEl.style.opacity = "1";
                }
              }, bottomTextDelayMs);
            } else {
              tl.to(inEl, { opacity: 1, duration: duration * 0.4, ease: TRANSITION_EASE }, duration * 0.25);
            }
            bottomTextActive = 1 - bottomTextActive;
          }
        } else {
          tl.to(getBottomTextEl(), { opacity: 0, duration: duration * 0.3, ease: TRANSITION_EASE }, 0);
        }
      } else {
        if (nextScene.bottomText) {
          var el = getBottomTextEl();
          el.textContent = nextText;
          getBottomTextInactive().style.opacity = "0";
          if (bottomTextDelay) {
            el.style.opacity = "0";
            setTimeout(function () {
              if (typeof gsap !== "undefined") {
                gsap.to(el, { opacity: 1, duration: 0.4, ease: TRANSITION_EASE });
              } else {
                el.style.opacity = "1";
              }
            }, bottomTextDelayMs);
          } else {
            el.style.opacity = "1";
          }
        } else {
          getBottomTextEl().style.opacity = "0";
        }
      }

      // --- 8. Click or auto advance ---
      if (nextScene.transition === "auto" && typeof nextScene.autoDuration === "number") {
        var autoDelay = bottomTextDelay ? bottomTextDelayMs + nextScene.autoDuration : nextScene.autoDuration;
        autoTimer = setTimeout(function () {
          goToScene(currentScene + 1);
        }, autoDelay);
      } else if (nextScene.transition === "click") {
        var clickableBlocks = (nextScene.blocks || []).filter(function (b) { return b.clickable === true; });
        if (clickableBlocks.length > 0) {
          clickableBlocks.forEach(function (block) {
            var c = getCell(block.y, block.x);
            if (!c) return;
            var handler = function (e) {
              e.stopPropagation();
              if (isTransitioning) return;
              cellClickHandlers.forEach(function (entry) {
                entry.cell.removeEventListener("click", entry.handler);
              });
              cellClickHandlers = [];
              goToScene(currentScene + 1);
            };
            c.addEventListener("click", handler);
            cellClickHandlers.push({ cell: c, handler: handler });
          });
        } else {
          sceneClickHandler = function () {
            if (isTransitioning) return;
            document.removeEventListener("click", sceneClickHandler);
            sceneClickHandler = null;
            goToScene(currentScene + 1);
          };
          document.addEventListener("click", sceneClickHandler);
        }
      }

      if (isDev && window.EngineRefreshDevSelect) window.EngineRefreshDevSelect();
    };

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
  };
})();
