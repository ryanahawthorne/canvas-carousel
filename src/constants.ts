const WIDTH = 1280;
const HEIGHT = 720;
const ASPECT_RATIO = WIDTH / HEIGHT;
const ANIMATION_DURATION = 1250; // time in ms for animation to complet,
const HOVER_TIMEOUT = 2000;
const IMAGE_WIDTH = 200;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.5;
const PADDING = 35;
const NUMBER_OF_ROWS = 4;
const IMAGES_PER_ROW = 7;
const IMAGE_SCALING_MAX = 0.2; // how much larger than the non scaled images the highlighted image become,
const TARGET_POSITION_X = 200; // the position in px the carousel tries to move the highlighted card to
const TARGET_POSITION_Y = 200;
const FRAME_RATE = 40; // target redraw timer speed if using setTimeout and not requestAnimationFrame
const SINGLE_MOVE_DISTANCE_X = IMAGE_WIDTH + PADDING;
const SINGLE_MOVE_DISTANCE_Y = IMAGE_HEIGHT + PADDING;
const ALPHA_ANIMATIONS = true;
const LEFT_ALPHA_LIMIT = TARGET_POSITION_X + IMAGE_WIDTH; // the point at which alpha starts on cards off to the left
const USE_PORTAL_SCALING = true; // scales images to the size of the portal - will impact performance - perhaps some caching could improve this
const USE_REQUEST_ANIMATION_FRAME = true; // for slow devices we can use set timeout and set the FRAME_RATE to equal the ANIMATION_DURATION to effectively disable animations
const DEBUG = true;

export {
    WIDTH,
    HEIGHT,
    ASPECT_RATIO,
    ANIMATION_DURATION,
    HOVER_TIMEOUT,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    PADDING,
    NUMBER_OF_ROWS,
    IMAGES_PER_ROW,
    IMAGE_SCALING_MAX,
    TARGET_POSITION_X,
    TARGET_POSITION_Y,
    FRAME_RATE,
    SINGLE_MOVE_DISTANCE_X,
    SINGLE_MOVE_DISTANCE_Y,
    ALPHA_ANIMATIONS,
    LEFT_ALPHA_LIMIT,
    USE_PORTAL_SCALING,
    USE_REQUEST_ANIMATION_FRAME,
    DEBUG,
};
