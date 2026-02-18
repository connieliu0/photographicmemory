// Placeholder image base (replace with real assets later)
const PLACEHOLDER = "https://placehold.co/400x400/333/666?text=";

window.Scenes = [
  // --- In the recesses of my memory I relive certain scenes ---
  {
    id: "intro",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "In the recesses of my memory I relive certain scenes",
    blocks: [],
  },

  // --- An image appears in my mind / [image appears in the center] ---
  {
    id: "image-appears",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "An image appears in my mind",
    blocks: [
      { x: 3, y: 3, visible: true, image: "img1.jpeg", sepia: false },
    ],
  },

  // --- Do you remember what laid behind that curtain? / [image zooms into the tree] ---
  {
    id: "zoom-into-tree",
    transition: "click",
    autoDuration: null,
    zoom: 2.5,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: false,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Do you remember what laid behind that curtain?",
    blocks: [
      { x: 3, y: 3, visible: true, image: "img2.jpeg", sepia: false },
    ],
  },

  // --- What do you remember from that moment? / [image changes] ---
  {
    id: "image-changes",
    transition: "click",
    autoDuration: null,
    zoom: 2.5,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "What do you remember from that moment?",
    blocks: [
      { x: 3, y: 3, visible: true, image: "img3.jpeg", sepia: false },
    ],
  },

  // --- [slightly different image when you zoom out but with the same tree] ---
  {
    id: "zoom-out-different",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "",
    blocks: [
      { x: 3, y: 3, visible: true, image: "img4.JPG", sepia: false },
    ],
  },

  // --- I relive as if I can go back in time and change the outcome / [similar picture repeats 2-3 times] ---
  {
    id: "similar-picture-repeat",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "I relive as if I can go back in time and change the outcome",
    blocks: [
      { x: 2, y: 3, visible: true, image: "img4.JPG", sepia: false },
      { x: 3, y: 3, visible: true, image: "img5.jpeg", sepia: false },
      { x: 4, y: 3, visible: true, image: "img6.JPG", sepia: false },
    ],
  },

  // --- Do you remember the time of day it was? / [reveal several similar images of golden hour] ---
  {
    id: "golden-hour",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Do you remember the time of day it was?",
    blocks: [
      { x: 2, y: 2, visible: true, image: PLACEHOLDER + "golden-1", sepia: false },
      { x: 3, y: 2, visible: true, image: PLACEHOLDER + "golden-2", sepia: false },
      { x: 4, y: 2, visible: true, image: PLACEHOLDER + "golden-3", sepia: false },
      { x: 2, y: 3, visible: true, image: PLACEHOLDER + "golden-4", sepia: false },
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "golden-5", sepia: false },
      { x: 4, y: 3, visible: true, image: PLACEHOLDER + "golden-6", sepia: false },
    ],
  },

  // --- What did you say exactly? / [picture of you is spotlighted] ---
  {
    id: "spotlight-you",
    transition: "click",
    autoDuration: null,
    zoom: 2.2,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: false,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "What did you say exactly?",
    blocks: [
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "you", sepia: false },
    ],
  },

  // --- What did I say? / [picture of me is spotlighted] ---
  {
    id: "spotlight-me",
    transition: "click",
    autoDuration: null,
    zoom: 2.2,
    zoomCenter: { x: 4, y: 4 },
    userZoomEnabled: false,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "What did I say?",
    blocks: [
      { x: 4, y: 4, visible: true, image: PLACEHOLDER + "me", sepia: false },
    ],
  },

  // --- Do you remember what happens next? / [images become sepia toned] ---
  {
    id: "sepia-toned",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Do you remember what happens next?",
    blocks: [
      { x: 2, y: 2, visible: true, image: PLACEHOLDER + "sepia-1", sepia: true },
      { x: 3, y: 2, visible: true, image: PLACEHOLDER + "sepia-2", sepia: true },
      { x: 4, y: 2, visible: true, image: PLACEHOLDER + "sepia-3", sepia: true },
      { x: 2, y: 3, visible: true, image: PLACEHOLDER + "sepia-4", sepia: true },
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "sepia-5", sepia: true },
      { x: 4, y: 3, visible: true, image: PLACEHOLDER + "sepia-6", sepia: true },
      { x: 2, y: 4, visible: true, image: PLACEHOLDER + "sepia-7", sepia: true },
      { x: 3, y: 4, visible: true, image: PLACEHOLDER + "sepia-8", sepia: true },
      { x: 4, y: 4, visible: true, image: PLACEHOLDER + "sepia-9", sepia: true },
    ],
  },

  // --- [transition to only showing the center one] ---
  {
    id: "center-only-sepia",
    transition: "click",
    autoDuration: null,
    zoom: 1.5,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "",
    blocks: [
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "center", sepia: true },
    ],
  },

  // --- They say that once you remember fully you can travel back in time ---
  {
    id: "remember-fully",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "They say that once you remember fully you can travel back in time",
    blocks: [
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "center", sepia: true },
    ],
  },

  // --- Photos are supposed to help with that / [flips through similar photos again] ---
  {
    id: "flip-through-photos",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Photos are supposed to help with that",
    blocks: [
      { x: 2, y: 2, visible: true, image: PLACEHOLDER + "photo-1", sepia: false },
      { x: 3, y: 2, visible: true, image: PLACEHOLDER + "photo-2", sepia: false },
      { x: 4, y: 2, visible: true, image: PLACEHOLDER + "photo-3", sepia: false },
      { x: 2, y: 3, visible: true, image: PLACEHOLDER + "photo-4", sepia: false },
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "photo-5", sepia: false },
      { x: 4, y: 3, visible: true, image: PLACEHOLDER + "photo-6", sepia: false },
      { x: 2, y: 4, visible: true, image: PLACEHOLDER + "photo-7", sepia: false },
      { x: 3, y: 4, visible: true, image: PLACEHOLDER + "photo-8", sepia: false },
      { x: 4, y: 4, visible: true, image: PLACEHOLDER + "photo-9", sepia: false },
    ],
  },

  // --- But not completely. / [stops at an image] ---
  {
    id: "stops-at-image",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "But not completely.",
    blocks: [
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "stop", sepia: false },
    ],
  },

  // --- Sometimes the gaps have become too long / [zoom out, hide the image between] ---
  {
    id: "gaps-hide-between",
    transition: "click",
    autoDuration: null,
    zoom: 0.8,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Sometimes the gaps have become too long",
    blocks: [
      { x: 1, y: 3, visible: true, image: PLACEHOLDER + "gap-1", sepia: false },
      { x: 2, y: 3, visible: true, image: PLACEHOLDER + "gap-2", sepia: false },
      { x: 3, y: 3, visible: false, image: PLACEHOLDER + "gap-3", sepia: false },
      { x: 4, y: 3, visible: true, image: PLACEHOLDER + "gap-4", sepia: false },
      { x: 5, y: 3, visible: true, image: PLACEHOLDER + "gap-5", sepia: false },
    ],
  },

  // --- Or there isn't a connection to the present anymore / [disappear more images in the middle] ---
  {
    id: "no-connection",
    transition: "click",
    autoDuration: null,
    zoom: 0.8,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Or there isn't a connection to the present anymore",
    blocks: [
      { x: 1, y: 3, visible: true, image: PLACEHOLDER + "conn-1", sepia: false },
      { x: 2, y: 3, visible: false, image: PLACEHOLDER + "conn-2", sepia: false },
      { x: 3, y: 3, visible: false, image: PLACEHOLDER + "conn-3", sepia: false },
      { x: 4, y: 3, visible: false, image: PLACEHOLDER + "conn-4", sepia: false },
      { x: 5, y: 3, visible: true, image: PLACEHOLDER + "conn-5", sepia: false },
    ],
  },

  // --- The mind misremembers, distorts, only remembers certain parts strongly ---
  {
    id: "mind-misremembers",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "The mind misremembers, distorts, only remembers certain parts strongly",
    blocks: [
      { x: 1, y: 3, visible: true, image: PLACEHOLDER + "conn-1", sepia: false },
      { x: 5, y: 3, visible: true, image: PLACEHOLDER + "conn-5", sepia: false },
    ],
  },

  // --- You're still there aren't you? ---
  {
    id: "still-there",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "You're still there aren't you?",
    blocks: [],
  },

  // --- Shouldn't you have learned by now? ---
  {
    id: "learned-by-now",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "Shouldn't you have learned by now?",
    blocks: [],
  },

  // --- You're always looking back for an answer to your questions ---
  {
    id: "looking-back",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "You're always looking back for an answer to your questions",
    blocks: [],
  },

  // --- But everything changes ---
  {
    id: "everything-changes",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "But everything changes",
    blocks: [],
  },

  // --- And nothing changes ---
  {
    id: "nothing-changes",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "And nothing changes",
    blocks: [],
  },

  // --- Don't you see it now? / [The user looks to the side] ---
  {
    id: "see-it-now",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: "Look to the side",
    tooltipVisible: true,
    bottomText: "Don't you see it now?",
    blocks: [],
  },

  // --- [Pans to a video of trees rustling or something that denotes more real life] ---
  {
    id: "pans-to-video",
    transition: "click",
    autoDuration: null,
    zoom: 1.2,
    zoomCenter: { x: 3, y: 3 },
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "",
    blocks: [
      { x: 3, y: 3, visible: true, image: PLACEHOLDER + "trees-video", sepia: false },
    ],
  },

  // --- I get it. ---
  {
    id: "i-get-it",
    transition: "click",
    autoDuration: null,
    zoom: 1,
    zoomCenter: null,
    userZoomEnabled: true,
    cursor: "default",
    cursorTooltip: null,
    tooltipVisible: false,
    bottomText: "I get it.",
    blocks: [],
  },
];

Engine.start();
