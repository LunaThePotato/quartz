import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

const p = new DOMParser()

// ===== Emoji Replacement Function =====
function replaceEmojiShortcodes(container: HTMLElement) {
  // Define your mapping from shortcode to image URL.
  const emojiMap: Record<string, string> = {
    ':FighterArts_smash:': '/emojis/FighterArts_smash.png',
    ':FighterArts_launch:': '/emojis/FighterArts_launch.png',
    // Add more mappings as needed...
  };

  let html = container.innerHTML;
  // Loop through each shortcode in the mapping and replace it with an <img> tag.
  for (const [shortcode, imgUrl] of Object.entries(emojiMap)) {
    // Create the replacement <img> tag as a string.
    const imgTag = `<img class="custom-emoji" alt="${shortcode}" src="${imgUrl}" />`;
    // Replace all occurrences of the shortcode
    html = html.replaceAll(shortcode, imgTag);
  }
  container.innerHTML = html;
}
// ========================================

async function mouseEnterHandler(
  this: HTMLAnchorElement,
  { clientX, clientY }: { clientX: number; clientY: number },
) {
  const link = this;
  if (link.dataset.noPopover === "true") {
    return;
  }

  async function setPosition(popoverElement: HTMLElement) {
    const { x, y } = await computePosition(link, popoverElement, {
      middleware: [inline({ x: clientX, y: clientY }), shift(), flip()],
    });
    Object.assign(popoverElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  const hasAlreadyBeenFetched = () =>
    [...link.children].some((child) => child.classList.contains("popover"));

  // Don't refetch if there's already a popover
  if (hasAlreadyBeenFetched()) {
    return setPosition(link.lastChild as HTMLElement);
  }

  const thisUrl = new URL(document.location.href);
  thisUrl.hash = "";
  thisUrl.search = "";
  const targetUrl = new URL(link.href);
  const hash = decodeURIComponent(targetUrl.hash); // e.g. "#Berserked"
  targetUrl.hash = "";
  targetUrl.search = "";

  const response = await fetchCanonical(targetUrl).catch((err) => {
    console.error(err);
  });

  // Bailout if another popover exists
  if (hasAlreadyBeenFetched()) {
    return;
  }

  if (!response) return;
  const [contentType] = response.headers.get("Content-Type")!.split(";");
  const [contentTypeCategory, typeInfo] = contentType.split("/");

  const popoverElement = document.createElement("div");
  popoverElement.classList.add("popover");
  const popoverInner = document.createElement("div");
  popoverInner.classList.add("popover-inner");
  popoverElement.appendChild(popoverInner);

  popoverInner.dataset.contentType = contentType ?? undefined;

  switch (contentTypeCategory) {
    case "image":
      const img = document.createElement("img");
      img.src = targetUrl.toString();
      img.alt = targetUrl.pathname;

      popoverInner.appendChild(img);
      break;
    case "application":
      switch (typeInfo) {
        case "pdf":
          const pdf = document.createElement("iframe");
          pdf.src = targetUrl.toString();
          popoverInner.appendChild(pdf);
          break;
        default:
          break;
      }
      break;
    default:
      const contents = await response.text();
      const html = p.parseFromString(contents, "text/html");
      normalizeRelativeURLs(html, targetUrl);
      // Remove all IDs to prevent duplicates
      html.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

      // Extract key from the link's hash (if present)
      let key: string | null = null;
      if (hash !== "") {
        key = hash.slice(1).toLowerCase(); // Remove '#' and normalize
      }

      if (key) {
        // Query for the element that has the matching data-popover-key attribute
        const targetElt = html.querySelector(`.popover-hint[data-popover-key="${key}"]`) as HTMLElement | null;
        if (!targetElt) return;
        popoverInner.appendChild(targetElt);
      } else {
        // Fallback: if no key is specified, append all popover-hint elements
        const elts = [...html.getElementsByClassName("popover-hint")];
        if (elts.length === 0) return;
        elts.forEach((elt) => popoverInner.appendChild(elt));
      }
      
      // After inserting popover content, replace any emoji shortcodes with <img> tags
      replaceEmojiShortcodes(popoverInner);
  }

  setPosition(popoverElement);
  link.appendChild(popoverElement);

  if (hash !== "") {
    const heading = popoverInner.querySelector(hash) as HTMLElement | null;
    if (heading) {
      // Leave ~12px of buffer when scrolling to a heading
      popoverInner.scroll({ top: heading.offsetTop - 12, behavior: "instant" });
    }
  }
}

document.addEventListener("nav", () => {
  const links = [...document.getElementsByClassName("internal")] as HTMLAnchorElement[];
  for (const link of links) {
    link.addEventListener("mouseenter", mouseEnterHandler);
    window.addCleanup(() => link.removeEventListener("mouseenter", mouseEnterHandler));
  }
});