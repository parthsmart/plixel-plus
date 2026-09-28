const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const status = document.querySelector("#status");
const results = document.querySelector("#results");
const endpoint = "https://commons.wikimedia.org/w/api.php";
let activeRequest;

function setStatus(message, state = "idle") {
  status.className = `status status--${state}`;
  status.replaceChildren();

  if (state === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    status.append(spinner);
  }

  status.append(document.createTextNode(message));
}

function showSkeletons() {
  results.replaceChildren(...Array.from({ length: 6 }, () => {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    skeleton.setAttribute("aria-hidden", "true");
    return skeleton;
  }));
}

function createImageCard(result) {
  const image = result.imageinfo?.[0];
  const thumbnail = image?.thumburl || image?.url;
  if (!thumbnail) return null;

  const card = document.createElement("a");
  card.className = "image-card";
  card.href = image.descriptionurl || thumbnail;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const picture = document.createElement("img");
  picture.src = thumbnail;
  picture.alt = result.title?.replace(/^File:/, "") || "Search result";
  picture.loading = "lazy";

  const caption = document.createElement("span");
  caption.textContent = picture.alt;
  card.append(picture, caption);
  return card;
}

async function searchImages(query, signal) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6",
    gsrlimit: "18", prop: "imageinfo", iiprop: "url", iiurlwidth: "600",
    format: "json", origin: "*",
  });
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("The image service could not be reached.");
  const data = await response.json();
  return Object.values(data.query?.pages || {});
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    setStatus("Enter a topic to search for images.");
    searchInput.focus();
    return;
  }

  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  const button = searchForm.querySelector("button");
  button.disabled = true;
  results.setAttribute("aria-busy", "true");
  setStatus(`Searching Wikimedia Commons for “${query}”…`, "loading");
  showSkeletons();
  try {
    const cards = (await searchImages(query, request.signal)).map(createImageCard).filter(Boolean);
    if (!cards.length) {
      results.replaceChildren();
      setStatus(`No images found for “${query}”. Try another topic.`, "empty");
      return;
    }
    results.replaceChildren(...cards);
    document.title = `SightSpark | ${query}`;
    setStatus(`Showing ${cards.length} images for “${query}”. Select one to view its source.`, "results");
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    results.replaceChildren();
    setStatus("Something went wrong. Check your connection and please try again.", "error");
  } finally {
    if (request.signal.aborted || activeRequest !== request) return;
    results.setAttribute("aria-busy", "false");
    button.disabled = false;
  }
});
