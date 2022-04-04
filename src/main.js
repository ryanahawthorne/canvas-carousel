
    const easeOutQuint = (delta) => {
    return 1 - Math.pow(1 - delta, 5);
};

    // BUGS
    // initial image drawing ignores scaling and modified position
    // Y axis focus item scaling doesn't work correctly after scrolling about for a bit

    // TODO ALL X,Y values should ideally be percentages so it will scale. These percentages should then be scaled against the aspect ratio.
    // Doing this will mean the positions will be absolute on any resolution / aspect ratio

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const hoverTimeout = 2000;
    let hoverTimer = null;

    const animationDuration = 1250; // time in ms for animation to complete
    const imageWidth = 200;
    const imageHeight = imageWidth * 1.5;
    const padding = 35;
    const numberOfRows = 3;
    const imagesPerRow = 7;
    const total = imagesPerRow * numberOfRows;
    const scaledImageSizeIncrease = 0.2; // how much larger than the non scaled images the highlighted image becomes
    const showAlpha = true; // enables / disables alpha on rendering - performance
    // let frameRate = 40; // target redraw timer speed if using setTimeout and not requestAnimationFrame
    let scalingAnimationProgression = 0; // how far through the current animation are we - used to scale highlightged image
    let animationStartTimeY = null; // will be date timer - dirty global
    // find out most performant way to time this. Using dates or timers or performance.now?
    let timeElapsed = null; // will be date timer

    let selectedCardTargetPositionX = 200; // the position the carousel tries to put the highlighted card at
    let selectedCardTargetPositionY = 200;
    // position of the selected cards outline
    let highlightCurrentPositionX = selectedCardTargetPositionX;
    let highlightCurrentPositionY = selectedCardTargetPositionY;

    let selectedRow = 0;
    let singleMoveDistanceX = imageWidth + padding;
    let singleMoveDistanceY = imageHeight + padding;
    let translateY = 0; // modifier for Y position of entire carousel. Note individual rows have their own translate value
    let targetTranslateY = 0; // target position for Y animations when reaching final frame of animation.
    let unfinishedMovementY = 0; // if a new y animation starts before other finishes. Use this to calculate how much further the second animation needs to go
    let prevDirection = null; // TODO - HACK - this is a throttle on spamming up down as it causes a glitch somehow

    const leftAlphaLimit = selectedCardTargetPositionX + imageWidth;
    const applyTranslate = (positionIn, translateIn) => {
    return positionIn - translateIn;
};

    const clearHoverTimer = () => {
    clearTimeout(hoverTimer);
};

    // tests if image is off screen and avoids rendering if true
    const shouldRender = (xLeft, xRight, yTop, yBottom) => {
    return xLeft < canvasWidth && xRight > 0 && yTop < canvasHeight && yBottom > 0;
};

    const getAlpha = (xPos) => {
    if (!showAlpha) {
    return 1;
}
    if (xPos < selectedCardTargetPositionX) {
    return getLeftAlpha(xPos);
} else if (xPos > canvasWidth - imageWidth) {
    return getRightAlpha(xPos);
}
    return 1;
};

    // fade images as they move off to the left
    const getLeftAlpha = (xPos) => {
    return Math.max((xPos + imageWidth) / leftAlphaLimit, 0.2);
};
    // fade images out as they move off to the right
    const getRightAlpha = (xPos) => {
    return Math.max((canvasWidth - xPos) / imageWidth, 0.2);
};

    // return true if any animation timers exist
    const isAnimating = () => {
    let value = false;
    if (animationStartTimeY) {
    return true;
}
    for (let row = 0; row < numberOfRows; row++) {
    if (rowsData[row].animationStartTime) {
    value = true;
    break;
}
}
    return value;
};

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
    console.log('begin hover animation');
}, hoverTimeout);

    switch (keyCode) {
    case 37: // left
    if (selectedRowObject.highlightedCard > 0) {
    // boundary check
    selectedRowObject.highlightedCard -= 1;
    selectedRowObject.animationStartTime = Date.now();
    selectedRowObject.animationDirection = 'left';
    selectedRowObject.unfinishedMovementX =
    selectedRowObject.unfinishedMovementX +
    selectedRowObject.targetTranslateX -
    selectedRowObject.translateX;
    selectedRowObject.targetTranslateX =
    selectedRowObject.highlightedCard * singleMoveDistanceX;
    draw();
}
    break;

    case 38: // up
    if (selectedRow > 0) {
    if (prevDirection === 'down' && timeElapsed < 175) {
    return; // hack to fix a glitch when spamming up down. No idea what causes it.
}
    selectedRow -= 1;
    animationStartTimeY = Date.now();
    unfinishedMovementY = unfinishedMovementY + targetTranslateY - translateY;
    targetTranslateY = selectedRow * singleMoveDistanceY;
    prevDirection = 'up';
    draw();
}
    break;

    case 39: // right
    if (selectedRowObject.highlightedCard < selectedRowObject.images.length - 1) {
    // boundary check
    selectedRowObject.highlightedCard += 1;
    selectedRowObject.animationStartTime = Date.now();
    selectedRowObject.animationDirection = 'right';
    selectedRowObject.unfinishedMovementX =
    selectedRowObject.unfinishedMovementX +
    selectedRowObject.targetTranslateX -
    selectedRowObject.translateX;
    selectedRowObject.targetTranslateX =
    selectedRowObject.highlightedCard * singleMoveDistanceX;
    draw();
}
    break;

    case 40: // down
    if (selectedRow < numberOfRows - 1) {
    if (prevDirection === 'up' && timeElapsed < 175) {
    return; // hack to fix a glitch when spamming up down. No idea what causes it.
}

    selectedRow += 1;
    animationStartTimeY = Date.now();
    unfinishedMovementY = unfinishedMovementY + targetTranslateY - translateY;
    targetTranslateY = selectedRow * singleMoveDistanceY;
    prevDirection = 'down';
    draw();
}
    break;
}
};

    document.addEventListener('keydown', onInteraction);

    const populateRowsData = (image) => {
    for (let rowNumber = 0; rowNumber < numberOfRows; rowNumber++) {
    const images = [];
    for (let imageNumber = 0; imageNumber < imagesPerRow; imageNumber++) {
    images.push({
    image, // this is loaded elsewhere
    cardOriginalPositionX: imageNumber * (imageWidth + padding),
    cardOriginalPositionY: rowNumber * (imageHeight + padding),
});
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
    method: 'GET',
}).then(function (response) {
    if (response.ok) {
    return response.json();
} else {
    return Promise.reject(response);
}
});
};

    const loadImage = (urlIn) => {
    const defaultImage = `https://image.tmdb.org/t/p/w${imageWidth}/${urlIn}.jpg`;
    const url = urlIn ? urlIn : defaultImage;
    return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load ${url} fail`));
    img.src = url;
});
};

    // once an image has loaded it's image, redraw it with the correct image rather than the default
    const updateImages = () => {
    loadImageArray().then(function (data) {
        data.results.forEach((image, index) => {
            const rowNum = Math.floor(index / imagesPerRow);
            const imageNum = index - rowNum * imagesPerRow;
            const fullImageUrl = `https://image.tmdb.org/t/p/w${imageWidth}${image.poster_path}`;
            // backdrop_path can be used for the background images on focus
            loadImage(fullImageUrl).then((image) => {
                // TODO callback to render image after loading is very basic and should instead draw the image based on it's real location in case things load in late
                // update the data
                rowsData[rowNum].images[imageNum].image = image;
                const { translateX } = rowsData[rowNum];
                const { cardOriginalPositionX, cardOriginalPositionY } =
                    rowsData[rowNum].images[imageNum];

                // but also draw the image just now
                const xPos = applyTranslate(
                    cardOriginalPositionX + selectedCardTargetPositionX,
                    translateX,
                );
                const yPos = applyTranslate(
                    cardOriginalPositionY + selectedCardTargetPositionY,
                    translateY,
                );
                // TODO this bit forgets image scaling

                // TODO remove this HACK - as this is not currently calculating image scaling - skip drawing first image
                if (xPos === selectedCardTargetPositionX && yPos === selectedCardTargetPositionY) {
                    return;
                }
                if (shouldRender(xPos, xPos + imageWidth, yPos, yPos + imageHeight)) {
                    ctx.drawImage(image, xPos, yPos, imageWidth, imageHeight);
                }
            });
        });
    });
};

    // dall all the cards and highlighted cards outline
    const renderCards = () => {
    let drawSelectedCardLast = null;

    for (let row = 0; row < rowsData.length; row++) {
    const rowObject = rowsData[row];
    const { unfinishedMovementX } = rowObject;
    if (rowObject.animationStartTime) {
    const timeNow = Date.now();
    const timeElapsedX = timeNow - rowObject.animationStartTime;
    const animationPosition = Math.min(timeElapsedX / animationDuration, 1); // how far through the animation we are from 0 (start) to 1 (end)
    const easingPosition = easeOutQuint(animationPosition); // apply easing which modifies the animation position based upon easing equasion
    rowObject.easingPosition = easingPosition; // used for scaling highlighted image
    if (rowObject.animationDirection === 'right') {
    // if right
    rowObject.translateX =
    rowObject.targetTranslateX -
    singleMoveDistanceX +
    (singleMoveDistanceX + unfinishedMovementX) * easingPosition;
} else if (rowObject.animationDirection === 'left') {
    // if going left
    rowObject.translateX =
    rowObject.targetTranslateX +
    singleMoveDistanceX -
    (singleMoveDistanceX - unfinishedMovementX) * easingPosition;
}
    if (animationPosition >= 1) {
    // animation ending
    rowObject.animationStartTime = null;
}
}
    for (let card = 0; card < rowsData[row].images.length; card++) {
    const cardObject = rowObject.images[card]; // TODO rename this to card and integer to cardNumber
    const { image, cardOriginalPositionX, cardOriginalPositionY } = cardObject;
    const xPos = applyTranslate(
    cardOriginalPositionX + unfinishedMovementX + selectedCardTargetPositionX,
    rowObject.translateX,
    ); // translateX affects only current row
    const yPos = applyTranslate(
    cardOriginalPositionY + selectedCardTargetPositionY + unfinishedMovementY,
    translateY,
    ); // translateY affects all rows

    const { highlightedCard } = rowObject;
    // do something different if we are about to draw the highlighted card
    if (row === selectedRow && card == highlightedCard) {
    let scalingProgression = 0;
    const { easingPosition } = rowsData[row];
    if (easingPosition) {
    // if we are animating on x axis then use local easing position for scaling animation progression
    scalingProgression = easingPosition;
} else if (animationStartTimeY) {
    // if we are animating on y axis then use y animation easing position instead
    scalingProgression = scalingAnimationProgression;
} else {
    scalingProgression = 1; // otherwise we are at rest, so ensure focused item end of animation sized ie 1
}
    const imageScaling = scalingProgression * scaledImageSizeIncrease + 1;
    const xOffset = (imageWidth * imageScaling - imageWidth) / 2; // offset by scaled amount so it scales from centre rather than top left corner
    const yOffset = (imageHeight * imageScaling - imageHeight) / 2;
    drawSelectedCardLast = () => {
    // set this as a callback so the highlighted card is drawn last to prevent it clipping behind other cards
    const alpha = getAlpha(xPos);
    ctx.globalAlpha = alpha;
    ctx.drawImage(
    image,
    xPos - xOffset,
    yPos - yOffset,
    imageWidth * imageScaling,
    imageHeight * imageScaling,
    );
    ctx.globalAlpha = 1;
    drawFocusHighlight(xPos, yPos, imageScaling);
};
} else {
    if (shouldRender(xPos, xPos + imageWidth, yPos, yPos + imageHeight)) {
    // const alpha = getLeftAlpha(xPos)
    const alpha = getAlpha(xPos);
    ctx.globalAlpha = alpha;
    // console.log('alpha is ', alpha);
    ctx.drawImage(image, xPos, yPos, imageWidth, imageHeight);
    ctx.globalAlpha = 1;
}
}
}
}
    drawSelectedCardLast();
};

    // draw selection rectangle around highlighted
    const drawFocusHighlight = (highlightedXIn, highlightedYIn, imageScaling) => {
    const xOffset = (imageWidth * imageScaling - imageWidth) / 2;
    const yOffset = (imageHeight * imageScaling - imageHeight) / 2;
    ctx.lineWidth = '5';
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.rect(
    highlightedXIn - xOffset,
    highlightedYIn - yOffset,
    imageWidth * imageScaling,
    imageHeight * imageScaling,
    );
    ctx.stroke();
};

    loadImage(`https://image.tmdb.org/t/p/w${imageWidth}/pSh8MyYu5CmfyWEHzv8FEARH2zq.jpg`).then(
    (img) => {
    populateRowsData(img);
    updateImages(); // TODO redrawing every canvas whenever an image loads is dreadful. Fix this!
    draw();
},
    );

    // translate value changes position of everything on page on Y axis
    const updateYPosition = (easing) => {
    if (highlightCurrentPositionY > selectedCardTargetPositionY) {
    // down
    translateY =
    targetTranslateY -
    singleMoveDistanceY +
    (singleMoveDistanceY + unfinishedMovementY) * easing;
}
    if (highlightCurrentPositionY < selectedCardTargetPositionY) {
    // up
    translateY =
    targetTranslateY +
    singleMoveDistanceY -
    (singleMoveDistanceY - unfinishedMovementY) * easing;
}
};

    //  main render function (recursive based upon animationStartTimeY)
    const draw = () => {
    // Clear canvas every time when function is called
    // TODO optimisation - only clear the rows that are animating?
    ctx.clearRect(0, 0, 1920, 1080);

    const { translateX } = rowsData[selectedRow];
    const { highlightedCard } = rowsData[selectedRow];
    // y position of highlighted card
    highlightCurrentPositionY = Math.round(
    applyTranslate(
    selectedRow * singleMoveDistanceY + selectedCardTargetPositionY + unfinishedMovementY,
    translateY,
    ),
    );
    // draw carousel images

    // handle y part of animation - TODO get rid of the horrible use of globals for y animation
    if (animationStartTimeY) {
    // TODO does this approach miss out the last frame of the animation
    const timeNow = Date.now();
    timeElapsed = timeNow - animationStartTimeY;
    // how far the animation is through from start to finish (between 0 and 1)
    let animationPosition = timeElapsed / animationDuration;
    // ***** Y ANIMATION ENDING  ******
    if (timeElapsed > animationDuration || animationPosition > 1) {
    animationPosition = 1; // ensure final number 1 rather than nearly 1
    animationStartTimeY = null;
    scalingAnimationProgression = 1;
    updateYPosition(1);
} else {
    // ***** UPDATE POSITION ANIMATION ******
    // animation Position is a linear position between 0 and 1 based upon time between 0 and end of the animation duration.
    // easing algorithm modifies this value to create a curve rather than a straight line
    const easingPosition = easeOutQuint(animationPosition);
    scalingAnimationProgression = easingPosition;
    updateYPosition(easingPosition);
}
}
    renderCards();

    if (isAnimating()) {
    // TODO check if multiple animations create problematic concurrent loops
    window.requestAnimationFrame(draw);

    // window.setTimeout(() => {
    //     draw();
    // }, frameRate);
}
};
