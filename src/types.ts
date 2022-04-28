type GenreType = {
  id: number
  name: string
}

export type PopularResultsResponseType = {
  id: number
  vote_count: number
  vote_average: number
  name: string
  first_air_date: string
  original_language: string
  original_name: string
  genre_ids: GenreType['id'][]
  backdrop_path: string
  overview: string
  poster_path: string
  popularity: number,
  original_title: string,
  release_date: Date,
}

export type PopularResponseType = {
  page: number
  total_pages: number
  total_results: number
  results: PopularResultsResponseType[]
}

export type RowObjectType = {
  id: number, // genre id
  unfinishedMovementX: number,
  animationStartTime: number | undefined | null,
  easingPosition: number,
  animationDirection?: 'left' | 'right' | 'top' | 'down' | null,
  translateX: number,
  targetTranslateX: number,
  highlightedCard: number,
  rowNumber: number,
  cards: Array<RowImageType>,
}

export type RowImageType = {
  image: HTMLImageElement,
  cardOriginalPositionX: number,
  cardOriginalPositionY: number,
  original_title: string,
  overview: string,
  backdrop_path: string,
  poster_path: string,
  release_date: Date,
}
