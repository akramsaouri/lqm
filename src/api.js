export const key = "spotifyToken";
const headers = () => ({
  Authorization: "Bearer " + localStorage.getItem(key),
});

const toJson = (res) => {
  if (res.status === 401) {
    localStorage.removeItem(key);
    throw new Error("TOKEN_EXPIRED");
  } else {
    return res.json();
  }
};

const doFetch = (url) => fetch(url, { headers: headers() }).then(toJson);

export const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

const fetchWithAutoPaging = async ({ limit = 50, url }) => {
  let results = [];
  const autoPager = async (url) => {
    const { next, items } = await doFetch(url);
    results = [...results, ...items];
    if (next) {
      await autoPager(next);
    }
  };
  await autoPager(`${url}?limit=${limit}`);
  return results;
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
    limit: 50,
    url: `https://api.spotify.com/v1/me/albums`,
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
