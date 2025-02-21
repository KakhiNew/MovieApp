import './style.css';
import { Movie, MovieDetails, SearchResponse, UpcomingMovie } from './types';

class MovieSearch {
  private readonly API_KEY = 'fc1fef96';
  private movieSearchBox: HTMLInputElement;
  private searchList: HTMLDivElement;
  private resultGrid: HTMLDivElement;
  private upcomingMoviesContainer: HTMLDivElement;
  private favorites: Set<string>;
  private currentSlideIndex = 0;
  private readonly SLIDES_TO_SHOW = 4;

  constructor() {
    this.movieSearchBox = document.getElementById('movie-search-box') as HTMLInputElement;
    this.searchList = document.getElementById('search-list') as HTMLDivElement;
    this.resultGrid = document.getElementById('result-grid') as HTMLDivElement;
    this.upcomingMoviesContainer = document.getElementById('upcoming-movies') as HTMLDivElement;
    this.favorites = new Set(JSON.parse(localStorage.getItem('movieFavorites') || '[]'));

    this.initialize();
  }

  private initialize(): void {
    this.movieSearchBox.addEventListener('keyup', () => this.findMovies());
    this.movieSearchBox.addEventListener('click', () => this.findMovies());

    window.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.className !== "search-input") {
        this.searchList.classList.add('hide-search-list');
      }
    });

    this.loadUpcomingMovies();
    this.setupSliderControls();
    this.loadFavorites();
  }

  private async loadUpcomingMovies(): Promise<void> {
    try {
      const upcomingMovies: UpcomingMovie[] = [
        { id: '1', title: 'Upcoming Movie 1', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-04-01' },
        { id: '2', title: 'Upcoming Movie 2', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-04-15' },
        { id: '3', title: 'Upcoming Movie 3', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-05-01' },
        { id: '4', title: 'Upcoming Movie 4', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-05-15' },
        { id: '5', title: 'Upcoming Movie 5', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-06-01' },
        { id: '6', title: 'Upcoming Movie 6', poster: 'https://via.placeholder.com/300x450', releaseDate: '2024-06-15' },
      ];
      this.displayUpcomingMovies(upcomingMovies);
    } catch (error) {
      console.error('Error loading upcoming movies:', error);
      this.upcomingMoviesContainer.innerHTML = '<p class="text-red-500">Failed to load upcoming movies</p>';
    }
  }

  private displayUpcomingMovies(movies: UpcomingMovie[]): void {
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';

    movies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'slider-card';
      card.innerHTML = `
        <div class="relative">
          <img src="${movie.poster}" alt="${movie.title}" class="w-full h-[420px] object-cover">
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h3 class="text-lg font-semibold">${movie.title}</h3>
            <p class="text-sm text-white/70">Release: ${new Date(movie.releaseDate).toLocaleDateString()}</p>
          </div>
        </div>
      `;
      sliderWrapper.appendChild(card);
    });

    this.upcomingMoviesContainer.innerHTML = '';
    this.upcomingMoviesContainer.appendChild(sliderWrapper);
  }

  private setupSliderControls(): void {
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => this.slideMovies('prev'));
      nextBtn.addEventListener('click', () => this.slideMovies('next'));
    }
  }

  private slideMovies(direction: 'prev' | 'next'): void {
    const wrapper = this.upcomingMoviesContainer.querySelector('.slider-wrapper') as HTMLElement;
    const cards = wrapper.children;
    const cardWidth = 280 + 16;

    if (direction === 'next') {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % (cards.length - this.SLIDES_TO_SHOW + 1);
    } else {
      this.currentSlideIndex = this.currentSlideIndex - 1;
      if (this.currentSlideIndex < 0) {
        this.currentSlideIndex = cards.length - this.SLIDES_TO_SHOW;
      }
    }

    const translateX = -this.currentSlideIndex * cardWidth;
    wrapper.style.transform = `translateX(${translateX}px)`;
  }

  private async toggleFavorite(movieId: string): Promise<void> {
    try {
      if (this.favorites.has(movieId)) {
        this.favorites.delete(movieId);
      } else {
        const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${this.API_KEY}`);
        const data = await response.json();
        if (data.Response === "True") {
          this.favorites.add(movieId);
        } else {
          throw new Error('Invalid movie ID');
        }
      }
      localStorage.setItem('movieFavorites', JSON.stringify([...this.favorites]));
      await this.loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  private async loadFavorites(): Promise<void> {
    const favoritesContainer = document.getElementById('favorites-container');
    if (!favoritesContainer) return;

    favoritesContainer.innerHTML = '';
    const favoritesList = [...this.favorites];

    for (const movieId of favoritesList) {
      try {
        const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${this.API_KEY}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const movie: MovieDetails = await response.json();
        
        if ('Response' in movie && movie.Response === "True") {
          const movieCard = document.createElement('div');
          movieCard.className = 'movie-card';
          movieCard.innerHTML = `
            <div class="relative">
              <img src="${movie.Poster !== "N/A" ? movie.Poster : "image_not_found.png"}" 
             alt="${movie.Title}" 
             class="w-full h-[300px] object-cover">
              <button class="favorite-btn" data-id="${movieId}">
          <i class="fas fa-heart text-accent"></i>
              </button>
              <div class="p-4">
          <h3 class="font-semibold">${movie.Title}</h3>
          <p class="text-sm text-white/60">${movie.Year}</p>
              </div>
            </div>
          `;

          const favoriteBtn = movieCard.querySelector('.favorite-btn');
          if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.toggleFavorite(movieId);
            });
          }

          favoritesContainer.appendChild(movieCard);
        } else {
          this.favorites.delete(movieId);
        }
      } catch (error) {
        console.error('Error loading favorite movie:', error);
        this.favorites.delete(movieId);
      }
    }
    localStorage.setItem('movieFavorites', JSON.stringify([...this.favorites]));
  }

  private async loadMovies(searchTerm: string): Promise<void> {
    this.searchList.innerHTML = '<div class="p-4 text-center">Loading...</div>';
    
    try {
      const URL = `https://www.omdbapi.com/?s=${searchTerm}&page=1&apikey=${this.API_KEY}`;
      const response = await fetch(URL);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data: SearchResponse = await response.json();
      if (data.Response === "True" && data.Search?.length > 0) {
        this.displayMovieList(data.Search);
      } else {
        this.searchList.innerHTML = '<div class="p-4 text-center">No movies found</div>';
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      this.searchList.innerHTML = '<div class="p-4 text-center text-red-500">Error fetching movies</div>';
    }
  }

  private findMovies(): void {
    const searchTerm = this.movieSearchBox.value.trim();
    if (searchTerm.length > 0) {
      this.searchList.classList.remove('hide-search-list');
      this.loadMovies(searchTerm);
    } else {
      this.searchList.classList.add('hide-search-list');
    }
  }

  private displayMovieList(movies: Movie[]): void {
    this.searchList.innerHTML = "";
    movies.forEach((movie) => {
      const movieListItem = document.createElement('div');
      movieListItem.dataset.id = movie.imdbID;
      movieListItem.classList.add('p-3', 'hover:bg-white/5', 'transition-colors', 'duration-200');
      const moviePoster = movie.Poster !== "N/A" ? movie.Poster : "image_not_found.png";

      movieListItem.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0 w-12 h-16 overflow-hidden rounded">
            <img src="${moviePoster}" alt="${movie.Title}" class="w-full h-full object-cover">
          </div>
          <div>
            <h3 class="font-semibold text-sm">${movie.Title}</h3>
            <p class="text-xs text-white/60">${movie.Year}</p>
          </div>
        </div>
      `;
      this.searchList.appendChild(movieListItem);
    });
    this.loadMovieDetails();
  }

  private async loadMovieDetails(): Promise<void> {
    const searchListMovies = this.searchList.querySelectorAll('[data-id]');
    searchListMovies.forEach(movie => {
      movie.addEventListener('click', async () => {
        const movieId = (movie as HTMLElement).dataset.id;
        if (movieId) {
          this.searchList.classList.add('hide-search-list');
          this.movieSearchBox.value = "";
          this.resultGrid.innerHTML = '<div class="p-4 text-center">Loading...</div>';
          
          try {
            const response = await fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${this.API_KEY}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const movieDetails: MovieDetails = await response.json();
            if (movieDetails.Response === "True") {
              this.displayMovieDetails(movieDetails);
            } else {
              throw new Error('Invalid movie details');
            }
          } catch (error) {
            console.error('Error loading movie details:', error);
            this.resultGrid.innerHTML = '<div class="p-4 text-center text-red-500">Error loading movie details</div>';
          }
        }
      });
    });
  }

  private displayMovieDetails(details: MovieDetails): void {
    // No additional check needed here as it's already handled in loadMovieDetails

    const isFavorite = this.favorites.has(details?.imdbID || '');
    
    this.resultGrid.innerHTML = `
      <div class="flex flex-col md:flex-row gap-6 p-4">
      <div class="relative w-full md:w-1/3">
        <img src="${details.Poster !== "N/A" ? details.Poster : "image_not_found.png"}" 
           alt="${details.Title}" 
           class="w-full h-auto rounded shadow-lg">
        <button class="favorite-btn absolute top-4 right-4 bg-black/50 p-2 rounded-full" data-id="${details.imdbID}">
        <i class="fas fa-heart ${isFavorite ? 'text-accent' : 'text-white/50'}"></i>
        </button>
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-4">${details.Title}</h2>
        <div class="space-y-3">
        <p><span class="text-white/60">Year:</span> ${details.Year}</p>
        <p><span class="text-white/60">Rated:</span> ${details.Rated}</p>
        <p><span class="text-white/60">Runtime:</span> ${details.Runtime}</p>
        <p><span class="text-white/60">Genre:</span> ${details.Genre}</p>
        <p><span class="text-white/60">Director:</span> ${details.director}</p>        Set-Location "C:\Users\kk\OneDrive\Downloads\MovieApp"        Set-Location "C:\Users\kk\OneDrive\Downloads\MovieApp"
        <p><span class="text-white/60">Cast:</span> ${details.Actors}</p>
        <p class="mt-4">${details.Plot}</p>
        <p class="mt-4"><span class="text-white/60">Language:</span> ${details.Language}</p>
        <p><span class="text-white/60">Awards:</span> ${details.Awards}</p>
        </div>
      </div>
      </div>
    `;

    const favoriteBtn = this.resultGrid.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const movieId = favoriteBtn.getAttribute('data-id');
        if (movieId) {
          this.toggleFavorite(movieId);
          const heartIcon = favoriteBtn.querySelector('i');
          if (heartIcon) {
            heartIcon.classList.toggle('text-accent');
            heartIcon.classList.toggle('text-white/50');
          }
        }
      });
    }
  }
}

new MovieSearch();