// import { getDefaultImage } from "./renderCards";
import { TARGET_POSITION_X, TARGET_POSITION_Y, IMAGE_WIDTH } from "./constants.js";

const rows = []
const authKey = 'c0140031611f36da79a4001affaad896';
let genres = [];
const rowsData = [];
// TODO these two funtions should be kept in a helpers class
import { drawScaledCard, applyTranslate } from "./renderCards.js";

// grabs the list of available genres from the movie db
const fetchGenres = () => {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${authKey}&language=en-UK`;
  return fetch(url, {
    method: 'GET'
  }).then(function (response) {
    if (response.ok) {
      return response.json()
    } else {
      return Promise.reject(response);
    }
  })
};

// Grabs a genre from the movie db using a genreID. This contains the top 20 movies in that genre.
const fetchGenreRow = (genreId) => {
  const url = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=10&api_key=${authKey}`;
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

// randomly splices a genre out of the list of genres
const getRandomGenre = () => {
  return genres.splice(Math.floor(Math.random()*genres.length), 1)[0];
};

// creates an image element from a supplied url
export const loadImage = (urlIn) => {
    const url = urlIn ? urlIn : getDefaultImage();
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`load ${url} fail`));
        img.src = url;
    });
};

// generates the rows data by random grabbing lists of popular titles from the list of genres supplied by the movie db
export const getRowsData = (getDefaultImage, IMAGE_WIDTH, IMAGE_HEIGHT, PADDING ) => {
  const defaultImage = getDefaultImage();
  return new Promise((resolve, reject) => {
    fetchGenres().then((res) => {
      genres = res.genres;
      const intialRows = [];
      const theRowsData = [];
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      let rowCounter = 0;
      intialRows.forEach((rowIn, index) => {
        fetchGenreRow(rowIn.id).then((res) => {
          const cards = res.results.map((card, cardIndex) => {
            const { original_title, overview, backdrop_path, poster_path, release_date } = card;
            return {
              image: defaultImage,
              cardOriginalPositionX: cardIndex * (IMAGE_WIDTH + PADDING),
              cardOriginalPositionY: rowCounter * (IMAGE_HEIGHT + PADDING),
              original_title,
              overview,
              backdrop_path,
              poster_path,
              release_date,
            }
          });
          const row = {
            cards,
            rowNumber: rowCounter,
            highlightedCard: 0,
            translateX: 0, // position offset from starting point
            animationStartTime: null,
            animationDirection: null,
            targetTranslateX: 0, // the end translateX position of the animation upon completion of animation
            easingPosition: 0, // how far through x animation row is. Used for calculating scaling of highlighted image
            unfinishedMovementX: 0, // if we interrupt an X movement we need to include this in the new animation start position
          }
          rowCounter +=1 ;
          theRowsData.push(row);
          if (theRowsData.length === intialRows.length) {
            resolve(theRowsData);
          }
        })
      })
    });
  })
};


// loads and re-renders images
export const loadAndRenderImages = (rowsData, ctx, translateY ) => {
  rowsData.forEach((row, rowNum) => {
    row.cards.forEach((image, imageNum) => {
      const fullImageUrl = `https://image.tmdb.org/t/p/w${IMAGE_WIDTH}${image.poster_path}`;
      // backdrop_path can be used for the background images on focus
      loadImage(fullImageUrl).then(image => { // TODO callback to render image after loading is very basic and should instead draw the image based on it's real location in case things load in late
        // update the data
        rowsData[rowNum].cards[imageNum].image = image;
        const { translateX } = rowsData[rowNum];
        const { cardOriginalPositionX, cardOriginalPositionY } = rowsData[rowNum].cards[imageNum];
        // but also redraw the image just now with loaded image
        const xPos = applyTranslate(cardOriginalPositionX + TARGET_POSITION_X, translateX);
        const yPos = applyTranslate(cardOriginalPositionY + TARGET_POSITION_Y, translateY);
        // TODO this shouldn't need to be drawn here.
        drawScaledCard(ctx, image, xPos, yPos);
      });
    })
  })
  return rowsData;
}