import { fetchWithAutoPaging } from "spotify-auto-paging";

export const key = "spotifyToken";
const headers = () => ({
  Authorization: "Bearer " + localStorage.getItem(key),
});

export const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const playTrack = async (albumUri) => {
  const url = `https://api.spotify.com/v1/me/player/play`;
  const body = JSON.stringify({
    context_uri: albumUri,
  });
  const res = await fetch(url, {
    headers: headers(),
    body,
    method: "PUT",
  });
  if (res.status !== 204) {
    window.open(albumUri, "_blank");
  }
};

export const fetchAlbums = async () => {
  return fetchWithAutoPaging({
    initialUrl: `https://api.spotify.com/v1/me/albums`,
    accessToken: localStorage.getItem(key),
  });
};

export const normalizeAlbum = ({
  album: { id, uri, name, images, artists },
}) => ({
  uri,
  name,
  id,
  image: images[1].url,
  artist: artists[0].name,
});

export const fetchCurrentlyPlayedAlbum = async () => {
  const url = `https://api.spotify.com/v1/me/player/currently-playing`;
  const options = {
    headers: headers(),
  };
  const res = await fetch(url, options);
  if (res.status === 200) {
    const data = await res.json();
    if (data.context.type === "album") {
      // only return track if it's played from an album
      return normalizeAlbum(data.item);
    }
  }
  return null;
};
