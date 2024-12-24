import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import UploadImage from "./UploadImage";

const EmotionData = () => {
  const [emotionData, setEmotionData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]); 

  const emotionToGenre = {
    happy: "35,12,10751", // Comedy, Adventure, Family
    sad: "18,10749", // Drama, Romance
    angry: "28,53", // Action, Thriller
    neutral: "99,36", // Documentary, History
    surprise: "12,14", // Adventure, Fantasy
    fear: "27,53", // Horror, Thriller
    disgusted: "53,80", // Thriller, Crime
  };

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");

    socket.on("emotion_data", (data) => {
      console.log("Received emotion data:", data);
      setEmotionData(data.emotion);
    });

    socket.on("connect_error", (err) => {
      setError("Connection error: " + err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleImageUploadSuccess = () => {
    setLoading(true);
  };

  const sendgenre = async () => {
    if (!emotionData) {
      console.error("Emotion data is missing.");
      return;
    }
  
    const emotion = emotionData.toLowerCase().trim();
    const genre = emotionToGenre[emotion] || "12"; // Default to Adventure (ID: 12)
  
    console.log(`Detected Emotion: ${emotion}`);
    console.log(`Mapped Genre: ${genre}`);
  
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZjcwMzQzMDdmYzU3OWVjZjUzYzc0NjEwZTE3NDU4YiIsIm5iZiI6MTczNDkzNjQ0Ny41LCJzdWIiOiI2NzY5MDc3ZjczZGE1YmNjYzVjNGQ3MzgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.p94ik0CH2-MkuxlQ3xufAJiw9awRqDu2ItRIMp69Hgs",
      },
    };
  
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&with_genres=${genre}`,
        options
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Movies Data:", data);
      setMovies(data.results || []);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(err.message);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Emotion-Based Movie Recommendations</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {emotionData && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <p className="mb-2">
            <strong>Detected Emotion:</strong> {emotionData}
          </p>
          <p className="mt-2">
            <strong>Mapped Genre:</strong> {emotionToGenre[emotionData.toLowerCase()] || "Adventure"}
          </p>
          <button
            onClick={sendgenre}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
          >
            Show Movies
          </button>
        </div>
      )}

      {movies.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recommended Movies:</h2>
          <ul className="space-y-2">
            {movies.map((movie) => (
              <li key={movie.id} className="p-3 bg-white rounded shadow hover:shadow-md transition-shadow">
                <strong>{movie.title}</strong>
                {movie.release_date && <p>Release Date: {movie.release_date}</p>}
                {movie.overview && <p>{movie.overview}</p>}
                {movie.poster_path && (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    alt={`${movie.title} poster`} 
                    className="mt-2 rounded"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <UploadImage onUploadSuccess={handleImageUploadSuccess} />
    </div>
  );
};

export default EmotionData;