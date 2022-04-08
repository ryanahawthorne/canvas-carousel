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
  popularity: number
}

export type PopularResponseType = {
  page: number
  total_pages: number
  total_results: number
  results: PopularResultsResponseType[]
}

export type RowObjectType = {
  unfinishedMovementX: number,
  animationStartTime?: number,
  easingPosition: number,
  animationDirection?: 'left' | 'right',
  translateX: number,
  targetTranslateX: number,
  highlightedCard: number,
  rowNumber: number,
  images: Array<RowImageType>
}

export type RowImageType = {
  image: HTMLImageElement,
  cardOriginalPositionX: number,
  cardOriginalPositionY: number,
}
