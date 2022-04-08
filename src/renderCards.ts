import {
    ANIMATION_DURATION,
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
    ASPECT_RATIO,
    IMAGE_SCALING_MAX,
    TARGET_POSITION_X,
    TARGET_POSITION_Y,
    SINGLE_MOVE_DISTANCE_X,
    ALPHA_ANIMATIONS,
    LEFT_ALPHA_LIMIT,
    WIDTH,
    HEIGHT,
    USE_PORTAL_SCALING,
} from './constants'
import { RowObjectType } from './types';

let portalWidth = WIDTH;
let portalHeight = HEIGHT;


// TODO move these to helper functions class
const applyTranslate = (positionIn: number, translateIn: number) => {
    return positionIn - translateIn;
};

const easeOutQuint = (delta: number) => {
    return 1 - Math.pow(1 - delta, 5);
}

const drawScaledFocusHighlight = (ctx: CanvasRenderingContext2D, highlightedXIn: number, highlightedYIn: number, imageScaling: number) => {
    const xOffset = ((IMAGE_WIDTH * imageScaling) - IMAGE_WIDTH) / 2;
    const yOffset = ((IMAGE_HEIGHT * imageScaling) - IMAGE_HEIGHT) / 2;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ccc";
    ctx.beginPath();
    ctx.rect(
        applyPortalScaling(highlightedXIn - xOffset), 
        applyPortalScaling(highlightedYIn - yOffset), 
        applyPortalScaling(IMAGE_WIDTH * imageScaling), 
        applyPortalScaling(IMAGE_HEIGHT * imageScaling)
    );
    ctx.stroke();
};


export const drawCanvasBorder = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "darkgreen";
    ctx.beginPath();
    ctx.rect(0, 0, portalWidth, portalWidth / ASPECT_RATIO);
    ctx.stroke();
}

export const clearPortal = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, portalWidth, portalHeight);
}

const shouldRender = (xLeft: number, xRight: number, yTop: number, yBottom: number) => {
    return (xLeft < WIDTH && xRight > 0 && yTop < HEIGHT && yBottom > 0);
};

const getAlpha = (xPos: number) => {
    if (!ALPHA_ANIMATIONS) {
        return 1;
    }
    if (xPos < TARGET_POSITION_X) {
        return getLeftAlpha(xPos);
    } else if (xPos > WIDTH - IMAGE_WIDTH) {
        return getRightAlpha(xPos);
    }
    return 1;
};

// fade images as they move off to the left
const getLeftAlpha = (xPos: number) => {
    return Math.max((xPos+IMAGE_WIDTH) / LEFT_ALPHA_LIMIT, 0.2);
};

// fade images out as they move off to the right
const getRightAlpha = (xPos: number) => {
    return Math.max(((WIDTH - xPos) / IMAGE_WIDTH), 0.2);
};

export const drawScaledCard = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, xPos: number, yPos: number) => {
    if (shouldRender(xPos, xPos + IMAGE_WIDTH, yPos, yPos + IMAGE_HEIGHT)) {
        const isHighlightedImage = ((xPos === TARGET_POSITION_X) && yPos === TARGET_POSITION_Y);
        const imageScaling = isHighlightedImage ? 1 + IMAGE_SCALING_MAX : 1
        const xOffset = ((IMAGE_WIDTH * imageScaling) - IMAGE_WIDTH) / 2; // offset by scaled amount so it scales from centre rather than top left corner
        const yOffset = ((IMAGE_HEIGHT * imageScaling) - IMAGE_HEIGHT) / 2;
        const alpha = getAlpha(xPos);
        ctx.globalAlpha = alpha;
        ctx.drawImage(
            image,
            applyPortalScaling(xPos - xOffset),
            applyPortalScaling(yPos - yOffset),
            applyPortalScaling(IMAGE_WIDTH * imageScaling),
            applyPortalScaling(IMAGE_HEIGHT * imageScaling),
        );
        if (isHighlightedImage) {
            // focus highlight will be partially concealed by card
            // TODO focus highlight should not be drawn over the card images - remove this when fixed
        ctx.globalAlpha = 1;
        drawScaledFocusHighlight(ctx, xPos, yPos, imageScaling);
        }
    }
}

export const drawScaledImage = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, xPos: number, yPos: number, width=IMAGE_WIDTH, height=IMAGE_HEIGHT) => {
    ctx.drawImage(
        image,
        applyPortalScaling(xPos),
        applyPortalScaling(yPos),
        applyPortalScaling(width),
        applyPortalScaling(height),
    )
}

// scales a value based upon the differenes in the default vs current width (assumes consistent aspect ratio)
export const applyPortalScaling = (value: number) => {
    if (USE_PORTAL_SCALING) { 
        return (portalWidth / WIDTH) * value;
    }
    return value;
  
}

export const resizedWindow = (widthIn: number, heightIn: number) => {
    portalHeight = heightIn;
    portalWidth = widthIn;
};

// all all the cards and highlighted cards outline
export const renderCards = (ctx: CanvasRenderingContext2D, rowsData: Array<RowObjectType>, selectedRow: number, unfinishedMovementY: number, translateY: number, animationStartTimeY: number, scalingAnimationProgression: number) => {
    let drawSelectedCardLast = () => {};

    for (let row = 0; row < rowsData.length; row++) {
        const rowObject = rowsData[row];
        let { unfinishedMovementX, animationStartTime } = rowObject;
        if (animationStartTime) {
            const timeNow = Date.now();
            const timeElapsedX = timeNow - animationStartTime;
            const animationPosition = Math.min(timeElapsedX / ANIMATION_DURATION, 1); // how far through the animation we are from 0 (start) to 1 (end)
            const easingPosition = easeOutQuint(animationPosition); // apply easing which modifies the animation position based upon easing equasion
            rowObject.easingPosition = easingPosition; // used for scaling highlighted image
            if (rowObject.animationDirection === 'right') { // if right
                rowObject.translateX = (rowObject.targetTranslateX - SINGLE_MOVE_DISTANCE_X) + ((SINGLE_MOVE_DISTANCE_X + unfinishedMovementX) * easingPosition);
            } else if (rowObject.animationDirection === 'left') { // if going left
                rowObject.translateX = ((rowObject.targetTranslateX + SINGLE_MOVE_DISTANCE_X)) - ((SINGLE_MOVE_DISTANCE_X - unfinishedMovementX) * easingPosition);
            }
            if (animationPosition >= 1) { // animation ending
                rowObject.animationStartTime = null;
            }
        }
        for (let card = 0; card < rowsData[row].images.length; card++) {
            const cardObject = rowObject.images[card]; // TODO rename this to card and integer to cardNumber
            const { image, cardOriginalPositionX, cardOriginalPositionY } = cardObject;
            const xPos = applyTranslate(cardOriginalPositionX + unfinishedMovementX + TARGET_POSITION_X, rowObject.translateX); // translateX affects only current row
            const yPos = applyTranslate(cardOriginalPositionY + TARGET_POSITION_Y + unfinishedMovementY, translateY); // translateY affects all rows

            const { highlightedCard } = rowObject;
            // do something different if we are about to draw the highlighted card
            if (row === selectedRow && card == highlightedCard) {
                let scalingProgression = 0;
                const { easingPosition } = rowsData[row];
                if (easingPosition) { // if we are animating on x axis then use local easing position for scaling animation progression
                    scalingProgression = easingPosition;
                } else if (animationStartTimeY) { // if we are animating on y axis then use y animation easing position instead
                    scalingProgression = scalingAnimationProgression;
                } else {
                    scalingProgression = 1; // otherwise we are at rest, so ensure focused item end of animation sized ie 1
                }
                const imageScaling = (scalingProgression * IMAGE_SCALING_MAX) +1;
                const xOffset = ((IMAGE_WIDTH * imageScaling) - IMAGE_WIDTH) / 2; // offset by scaled amount so it scales from centre rather than top left corner
                const yOffset = ((IMAGE_HEIGHT * imageScaling) - IMAGE_HEIGHT) / 2;
                drawSelectedCardLast = () => { // set this as a callback so the highlighted card is drawn last to prevent it clipping behind other cards
                    const alpha = getAlpha(xPos);
                    ctx.globalAlpha = alpha;
                    drawScaledImage(ctx, image, xPos - xOffset, yPos - yOffset, IMAGE_WIDTH * imageScaling, IMAGE_HEIGHT * imageScaling);
                    // ctx.drawImage(image, xPos - xOffset, yPos - yOffset, IMAGE_WIDTH * imageScaling, IMAGE_HEIGHT * imageScaling);
                    ctx.globalAlpha = 1;
                    drawScaledFocusHighlight(ctx, xPos, yPos, imageScaling);
                }
            } else {
                if (shouldRender(xPos, xPos + IMAGE_WIDTH, yPos, yPos + IMAGE_HEIGHT)) {
                    const alpha = getAlpha(xPos);
                    ctx.globalAlpha = alpha;
                    drawScaledImage(ctx, image, xPos, yPos);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    drawSelectedCardLast();
};