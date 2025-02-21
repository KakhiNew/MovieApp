export interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
}

export interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Genre: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Awards: string;
  Poster: string;
  Runtime: string;
}

export interface SearchResponse {
  Search: Movie[];
  Response: string;
}

export interface UpcomingMovie {
  id: string;
  title: string;
  poster: string;
  releaseDate: string;
}