import React, { useState, useEffect, useRef } from "react";
import SpotifyLogin from "react-spotify-login";

import {
  key,
  getRandomInt,
  fetchAlbums,
  normalizeAlbum,
  fetchCurrentlyPlayedAlbum,
} from "./api";
import "./styles.css";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem(key));
  const [album, setAlbum] = useState(null);
  const [state, setState] = useState("idle");
  const [currrentlyPlayedAlbum, setCurrrentlyPlayedAlbum] = useState(null);
  const stringCounterRef = useRef(0);
  const previousAlbumImage = usePrevious(album ? album.image : "");
  const albumImageRef = useRef(null);
  const cachedAlbumsRef = useRef(null);
  const rejectedAlbums = useRef([]);
  const totalAlbumsRef = useRef(0);

  const handleSpotifySuccess = ({ access_token }) => {
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
      // retry again
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
      cachedAlbumsRef.current = spotifyAlbums;
      totalAlbumsRef.current = spotifyAlbums.length;
    } catch (e) {
      console.log(e);
      if (e.status === 401) {
        setLoggedIn(false);
      } else {
        // TODO: proper UI for this
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

  const refreshCurrentlyPlayedAlbum = () => {
    fetchCurrentlyPlayedAlbum().then((album) => {
      if (!album) return; // return early if no album is currently playing
      setCurrrentlyPlayedAlbum(album);
      const alreadyRejected = rejectedAlbums.current.find(
        (id) => id === album.id
      );
      if (!alreadyRejected) {
        rejectedAlbums.current.push(album.id);
      }
    });
  };

  useEffect(() => {
    window.addEventListener("focus", refreshCurrentlyPlayedAlbum);
    return () => {
      window.removeEventListener("focus", refreshCurrentlyPlayedAlbum);
    };
  }, []);

  useEffect(() => {
    refreshCurrentlyPlayedAlbum();
  }, []);

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
          scope="user-library-read user-read-playback-state"
          onSuccess={handleSpotifySuccess}
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
          {currrentlyPlayedAlbum && (
            <p className="current-track">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              Currently listening to <span>{currrentlyPlayedAlbum.name} </span>{" "}
              by <span>{currrentlyPlayedAlbum.artist}</span>.
            </p>
          )}
          {album && (
            <div className="album">
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
              <a
                href={album.uri}
                target="_blank"
                rel="noopener noreferrer"
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
              </a>
            </div>
          )}
        </>
      )}
    </>
  );
}

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

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
