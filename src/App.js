import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import SpotifyLogin from "react-spotify-login";
import {
  key,
  playTrack,
  getRandomInt,
  fetchAlbums,
  normalizeAlbum,
} from "./api";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem(key));
  const [album, setAlbum] = useState(null);
  const [state, setState] = useState("idle");
  const stringCounterRef = useRef(0);
  const previousAlbumImage = usePrevious(album ? album.image : "");
  const albumImageRef = useRef(null);
  const cachedAlbumsRef = useRef(null);
  const rejectedAlbums = useRef([]);
  const totalAlbumsRef = useRef(196);

  const onSpotifySuccess = ({ access_token }) => {
    localStorage.setItem(key, access_token);
    setLoggedIn(true);
  };

  const getRandomAlbum = (albums) => {
    const randomAlbum = normalizeAlbum(albums[getRandomInt(albums.length)]);
    if (rejectedAlbums.current.includes(randomAlbum.id)) {
      if (totalAlbumsRef.current - 1 === rejectedAlbums.current.length) {
        // no more albums to randomize 🤷🏽‍♂️
        rejectedAlbums.current = [];
      }
      return getRandomAlbum(albums);
    }
    return randomAlbum;
  };

  const fetchRandomAlbum = async () => {
    if (cachedAlbumsRef.current) {
      rejectedAlbums.current.push(album.id);
      if (stringCounterRef.current === strings.length - 1) {
        stringCounterRef.current = 0;
      } else {
        stringCounterRef.current++;
      }
      // set album from cache
      return setAlbum(getRandomAlbum(cachedAlbumsRef.current));
    }
    // make network req then write to cache
    try {
      setState("pending");
      const spotifyAlbums = await fetchAlbums();
      setAlbum(getRandomAlbum(spotifyAlbums));
      setState("idle");
      cachedAlbumsRef.current = [...spotifyAlbums];
    } catch (e) {
      console.log(e);
      if (e.message === "TOKEN_EXPIRED") {
        setLoggedIn(false);
      } else {
        setState("error");
      }
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchRandomAlbum();
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const currentAlbumImage = album ? album.image : "";

  useEffect(() => {
    if (previousAlbumImage && currentAlbumImage !== previousAlbumImage) {
      // fix image flash
      albumImageRef.current.style.visibility = "hidden";
    }
  }, [currentAlbumImage, previousAlbumImage]);

  return (
    <>
      {!loggedIn ? (
        <SpotifyLogin
          clientId={process.env.REACT_APP_SPOTIFY_CLIENT_ID}
          redirectUri={window.location.protocol + "//" + window.location.host}
          scope="user-library-read user-modify-playback-state"
          onSuccess={onSpotifySuccess}
          onFailure={console.log}
          className="button"
        />
      ) : (
        <>
          <button
            onClick={fetchRandomAlbum}
            disabled={state === "pending"}
            className="button"
          >
            {state === "pending"
              ? "hang on tight 🕵🏽‍♂️"
              : strings[stringCounterRef.current]}
          </button>
          {album && (
            <div className="album" onClick={() => playTrack(album.uri)}>
              <img
                src={album.image}
                alt={album.image}
                ref={albumImageRef}
                onLoad={() =>
                  (albumImageRef.current.style.visibility = "visible")
                }
                className="album-img"
              />
              <p className="album-name">
                {album.name} by {album.artist}
              </p>
              <button
                onClick={() => playTrack(album.uri)}
                className="album-play"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#024368"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="feather feather-play-circle"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M10 8L16 12 10 16 10 8z" />
                </svg>
                <span>Click to open on spotify</span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

const strings = [
  "Something more groovy? 🤔",
  "Not in the mood for this 😒",
  "No, something else please😑",
  "I said something else!! 😩",
  "Why you doing this to me? 😩",
  "Cmon, you can do better 😠",
  "Bad taste my friend... 😡",
];
