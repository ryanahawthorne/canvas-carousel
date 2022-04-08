import { renderCards, resizedWindow, clearPortal, drawScaledCard, drawCanvasBorder } from './renderCards.js';
import {                     
    ANIMATION_DURATION,
    HOVER_TIMEOUT,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    PADDING,
    NUMBER_OF_ROWS,
    IMAGES_PER_ROW,
    TARGET_POSITION_X,
    TARGET_POSITION_Y,
    FRAME_RATE,
    SINGLE_MOVE_DISTANCE_X,
    SINGLE_MOVE_DISTANCE_Y,
    WIDTH,
    HEIGHT,
    USE_REQUEST_ANIMATION_FRAME,
    DEBUG,
} from './constants.js';


// TODO move to helper functions module
const easeOutQuint = (delta) => {
    return 1 - Math.pow(1 - delta, 5);
}

// BUG fast up and down causes glitch - prevDirection and a timer hack used until this is fixed properly
// TODO move API stuff to seperate module
// TODO move rest of cards drawing stuff out of main.js
// TODO Replace default image with a local asset rather than loading a random image before replacing it
// TODO move Y rendering calculations from draw into separate module
// TODO fetch multiple carousels from API and remove or rework NUMBER_OF_ROWS and IMAGES_PER_ROW to be dynamic rather than hard-coded
// TODO look at only fetching images for cards that are visible or soon to be visible
// TODO rendering of loaded images using drawScaledCard() does not consider animation position. This could cause a bug where a late loaded image appears in the wrong place during a single animation frame
// TODO show programme information and larger poster image when an item is selected for longer than HOVER_TIMEOUT
// TODO add linting and build step

const canvas = document.getElementById('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

let highlightCurrentPositionX = TARGET_POSITION_X;
let highlightCurrentPositionY = TARGET_POSITION_Y;
// let frameRate = 40; // target redraw timer speed if using setTimeout and not requestAnimationFrame
let hoverTimer = null;
let scalingAnimationProgression = 0; // how far through the current animation are we - used to scale highlightged image
let animationStartTimeY = null; // will be date timer - dirty global
// find out most performant way to time this. Using dates or timers or performance.now?
let timeElapsed = null; // will be date timer
let selectedRow = 0; // row currently highlighted
let translateY = 0; // modifier for Y position of entire carousel. Note individual rows have their own translate value
let targetTranslateY = 0; // target position for Y animations when reaching final frame of animation.
let unfinishedMovementY = 0; // if a new y animation starts before other finishes. Use this to calculate how much further the second animation needs to go
let prevDirection = null; // TODO - HACK - this is a throttle on spamming up down as it causes a glitch somehow

// TODO Move this to helper functions. Is currently dupliated in renderCards.js
const applyTranslate = (positionIn, translateIn) => {
    return positionIn - translateIn;
};

const clearHoverTimer = () => {
    clearTimeout(hoverTimer);
};

// return true if any animation timers exist
const isAnimating = () => {
    let value = false;
    if (animationStartTimeY) {
        return true;
    }
    for (let row = 0; row < NUMBER_OF_ROWS; row++) {
        if (rowsData[row]?.animationStartTime) {
            value = true;
            break;
        }
    }
    return value;
}

const rowsData = [];
const validKeyCodes = [37, 38, 39, 40];

const onInteraction = (event) => {
    event.preventDefault();
    const { keyCode } = event;
    if (!validKeyCodes.includes(keyCode)) {
        console.log('invalid keycode');
        return;
    }
    const selectedRowObject = rowsData[selectedRow];

    clearHoverTimer();

    hoverTimer = window.setTimeout(() => {
    }, HOVER_TIMEOUT);

    switch (keyCode) {
        case 37: // left
            if (selectedRowObject.highlightedCard > 0) { // boundary check
                selectedRowObject.highlightedCard -= 1;
                selectedRowObject.animationStartTime = Date.now();
                selectedRowObject.animationDirection = 'left';
                selectedRowObject.unfinishedMovementX = selectedRowObject.unfinishedMovementX + selectedRowObject.targetTranslateX - selectedRowObject.translateX;
                selectedRowObject.targetTranslateX = (selectedRowObject.highlightedCard * SINGLE_MOVE_DISTANCE_X);
                draw();
            }
            break;

        case 38: // up
            if (selectedRow > 0) {
                if (prevDirection === 'down' && timeElapsed && timeElapsed < 175) {
                    return; // hack to fix a glitch when spamming up down. No idea what causes it.
                }
                selectedRow -= 1;
                animationStartTimeY = Date.now();
                unfinishedMovementY = unfinishedMovementY + targetTranslateY - translateY;
                targetTranslateY = selectedRow * SINGLE_MOVE_DISTANCE_Y;
                prevDirection = 'up';
                draw();
            }
            break;

        case 39: // right
            if (selectedRowObject.highlightedCard < selectedRowObject.images.length - 1) { // boundary check
                selectedRowObject.highlightedCard += 1;
                selectedRowObject.animationStartTime = Date.now();
                selectedRowObject.animationDirection = 'right';
                selectedRowObject.unfinishedMovementX = selectedRowObject.unfinishedMovementX + selectedRowObject.targetTranslateX - selectedRowObject.translateX;
                selectedRowObject.targetTranslateX = (selectedRowObject.highlightedCard * SINGLE_MOVE_DISTANCE_X);
                draw();
            }
            break;

        case 40: // down
            if (selectedRow < NUMBER_OF_ROWS - 1) {
                if (prevDirection === 'up' && timeElapsed && timeElapsed < 175) {
                    return; // hack to fix a glitch when spamming up down. No idea what causes it.
                }

                selectedRow += 1;
                animationStartTimeY = Date.now();
                unfinishedMovementY = unfinishedMovementY + targetTranslateY - translateY;
                targetTranslateY = selectedRow * SINGLE_MOVE_DISTANCE_Y;
                prevDirection = 'down';
                draw();
            }
            break;
    }
}

document.addEventListener('keydown', onInteraction);

const populateRowsData = (image) => {
    for (let rowNumber = 0; rowNumber < NUMBER_OF_ROWS; rowNumber++) {
        const images = [];
        for (let imageNumber = 0; imageNumber < IMAGES_PER_ROW; imageNumber++) {
            images.push({
                image,  // this is loaded elsewhere
                cardOriginalPositionX: imageNumber * (IMAGE_WIDTH + PADDING),
                cardOriginalPositionY: rowNumber * (IMAGE_HEIGHT + PADDING),
            })
        }
        rowsData.push({
            images,
            rowNumber,
            highlightedCard: 0,
            translateX: 0, // position offset from starting point
            animationStartTime: null,
            animationDirection: null,
            targetTranslateX: 0, // the end translateX position of the animation upon completion of animation
            easingPosition: 0, // how far through x animation row is. Used for calculating scaling of highlighted image
            unfinishedMovementX: 0, // if we interrupt an X movement we need to include this in the new animation start position
        });
    }
};

const loadImageArray = (urlInput) => {
    const defaultUrl = `https://api.themoviedb.org/3/tv/popular?api_key=1e55f581404139e4f64065b2415ffe53`;
    const url = urlInput ? urlInput : defaultUrl;
    return fetch(url, {
        method: 'GET'
    }).then(function (response) {
        if (response.ok) {
            return response.json()
        } else {
            return Promise.reject(response);
        }
    })
}

const loadImage = (urlIn) => {
    const defaultImage = `https://image.tmdb.org/t/p/w${IMAGE_WIDTH}/${urlIn}.jpg`;
    const url = urlIn ? urlIn : defaultImage;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`load ${url} fail`));
        img.src = url;
    });
};

// once an image has loaded it's image, redraw it with the correct image rather than the default
const loadImages = () => {
    loadImageArray().then(function (data) {
        data.results.forEach((image, index) => {
            const rowNum = Math.floor(index / IMAGES_PER_ROW);
            const imageNum = index - (rowNum * IMAGES_PER_ROW);
            const fullImageUrl = `https://image.tmdb.org/t/p/w${IMAGE_WIDTH}${image.poster_path}`;
            // backdrop_path can be used for the background images on focus
            loadImage(fullImageUrl).then(image => { // TODO callback to render image after loading is very basic and should instead draw the image based on it's real location in case things load in late
                // update the data
                rowsData[rowNum].images[imageNum].image = image;
                const { translateX } = rowsData[rowNum];
                const { cardOriginalPositionX, cardOriginalPositionY } = rowsData[rowNum].images[imageNum];
                // but also redraw the image just now with loaded image
                const xPos = applyTranslate(cardOriginalPositionX + TARGET_POSITION_X, translateX);
                const yPos = applyTranslate(cardOriginalPositionY + TARGET_POSITION_Y, translateY);
                drawScaledCard(ctx, image, xPos, yPos);
            });
        })
    })
}

loadImage(`https://image.tmdb.org/t/p/w${IMAGE_WIDTH}/pSh8MyYu5CmfyWEHzv8FEARH2zq.jpg`).then(img => {
    populateRowsData(img);
    loadImages(); // TODO redrawing every canvas whenever an image loads is dreadful. Fix this!
    draw();
});

// translate value changes position of everything on page on Y axis
const updateYPosition = (easing) => {
    if (highlightCurrentPositionY > TARGET_POSITION_Y) { // down
        translateY = (targetTranslateY - SINGLE_MOVE_DISTANCE_Y) + ((SINGLE_MOVE_DISTANCE_Y + unfinishedMovementY) * easing);
    }
    if (highlightCurrentPositionY < TARGET_POSITION_Y) { // up
        translateY = (targetTranslateY + SINGLE_MOVE_DISTANCE_Y) - ((SINGLE_MOVE_DISTANCE_Y - unfinishedMovementY) * easing);
    }
}

//  main render function (recursive based upon animationStartTimeY)
const draw = () => {
    // Clear canvas every time when function is called 
    // TODO optimisation - only clear the rows that are animating?
    clearPortal(ctx);


    // y position of highlighted card
    highlightCurrentPositionY = Math.round(applyTranslate((selectedRow * SINGLE_MOVE_DISTANCE_Y) + TARGET_POSITION_Y + unfinishedMovementY, translateY));

    // handle y part of animation - TODO get rid of the horrible use of globals for y animation and move this to another file
    if (animationStartTimeY) { // TODO does this approach miss out the last frame of the animation
        const timeNow = Date.now();
        timeElapsed = timeNow - animationStartTimeY;
        // how far the animation is through from start to finish (between 0 and 1)
        let animationPosition = timeElapsed / ANIMATION_DURATION;
        // ***** Y ANIMATION ENDING  ******  
        if (timeElapsed > ANIMATION_DURATION || animationPosition > 1) {
            animationPosition = 1; // ensure final number 1 rather than nearly 1
            animationStartTimeY = null;
            scalingAnimationProgression = 1;
            updateYPosition(1);
            timeElapsed = null;
        } else {
            // ***** UPDATE POSITION ANIMATION ******
            // animation Position is a linear position between 0 and 1 based upon time between 0 and end of the animation duration.
            // easing algorithm modifies this value to create a curve rather than a straight line
            const easingPosition = easeOutQuint(animationPosition);
            scalingAnimationProgression = easingPosition;
            updateYPosition(easingPosition);
        }
    }
    renderCards(ctx, rowsData, selectedRow, unfinishedMovementY, translateY, animationStartTimeY, scalingAnimationProgression);

    // shows the outline of the visible page on a device with a locked aspect ratio
    if (DEBUG) {
        drawCanvasBorder(ctx);
    }
    
    if (isAnimating()) {

        if (USE_REQUEST_ANIMATION_FRAME) {
            // TODO check if multiple animations are calling draw which recursively calls itself, potentially creating concurrent loops
            //  look at passing an ID to draw function to remedy this if it's a problem
            window.requestAnimationFrame(draw);
        } else {
            window.setTimeout(() => {
                draw();
            }, FRAME_RATE);
        }
    }
}

const onResizeWindow = () => {
    resizedWindow(window.innerWidth, window.innerHeight)
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    if (!animationStartTimeY) {
        animationStartTimeY = 100;
        draw();
    }
};

window.onresize = onResizeWindow;
onResizeWindow();

