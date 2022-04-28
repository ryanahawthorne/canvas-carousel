import { TARGET_POSITION_X, TARGET_POSITION_Y, IMAGE_WIDTH } from "./constants";
import { PopularResponseType, RowImageType, RowObjectType } from './types';

const authKey = 'c0140031611f36da79a4001affaad896';
let genres: Array<RowObjectType> = [];
// TODO these two funtions should be kept in a helpers class
import { drawScaledCard, applyTranslate } from "./renderCards";

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
const fetchGenreRow = async (genreId:number): Promise<PopularResponseType> => {
  const url = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=10&api_key=${authKey}`;
  const response = await fetch(url, {
    method: 'GET'
  });
  if (response.ok) {
    return response.json();
  } else {
    return Promise.reject(response);
  }
}

// randomly splices a genre out of the list of genres
const getRandomGenre = () => {
  return genres.splice(Math.floor(Math.random()*genres.length), 1)[0];
};

// creates an image element from a supplied url
const loadImage = (imageUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load ${imageUrl} fail`));
    img.src = imageUrl;
  });
};

// generates the rows data by random grabbing lists of popular titles from the list of genres supplied by the movie db
export const getRowsData = (defaultImage: HTMLImageElement, IMAGE_WIDTH: number, IMAGE_HEIGHT: number, PADDING: number) => {
  return new Promise((resolve, reject) => {
    fetchGenres().then((res) => {
      genres = res.genres;
      const intialRows = [];
      const theRowsData: Array<RowObjectType> = [];
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      intialRows.push(getRandomGenre());
      let rowCounter = 0;
      intialRows.forEach((rowIn) => {
        fetchGenreRow(rowIn.id).then((res) => {
          const { results } = res;
          results.length = 10; // TODO only load assets that are going to be seen. Temporarily chopping the array in half until this is added
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
            } as RowImageType;
          })
          const row: RowObjectType = {
            id: rowIn.id,
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
          theRowsData.push(row)
          if (theRowsData.length === intialRows.length) {
            resolve(theRowsData);
          }
        })
      })
    });
  })
};


// loads and re-renders images
export const loadAndRenderImages = (rowsData: Array<RowObjectType>, ctx: CanvasRenderingContext2D, translateY: number ) => {
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