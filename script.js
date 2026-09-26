const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");

function render(items) {
  results.innerHTML = "";

  items.forEach((item) => {
    const image = item.imageinfo?.[0];
    if (!image?.thumburl) return;

    const card = document.createElement("article");
    card.className = "card";

    const link = document.createElement("a");
    link.href = image.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = "Open full image";

    const img = document.createElement("img");
    img.src = image.thumburl;
    img.alt = item.title.replace("File:", "");
    img.loading = "lazy";

    const caption = document.createElement("p");
    caption.textContent = item.title.replace("File:", "");

    link.appendChild(img);
    card.appendChild(link);
    card.appendChild(caption);
    results.appendChild(card);
  });
}

async function searchImages(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*";

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);

  const data = await response.json();
  const items = Object.values(data.query?.pages ?? {});
  render(items);
  status.textContent = `Showing ${results.children.length} result${results.children.length === 1 ? "" : "s"} for “${query}”.`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  results.innerHTML = "";
  status.textContent = `Searching for “${query}”…`;
  await searchImages(query);
});
