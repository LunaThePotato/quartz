import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"
import Slugger from "github-slugger" // ← Added import

const p = new DOMParser()

// ===== Emoji Replacement Function =====
function replaceEmojiShortcodes(container: HTMLElement) {
  const emojiMap: Record<string, string> = {
    ':FighterArts_smash:': '/emojis/FighterArts_smash.png',
    ':FighterArts_launch:': '/emojis/FighterArts_launch.png',
    ':FighterArts_topple:': '/emojis/FighterArts_topple.png',
    ':FighterArts_break:': '/emojis/FighterArts_break.png',
    ':Conditions_daze2:': '/emojis/Conditions_daze2.png',
    ':Conditions_burst:': '/emojis/Conditions_burst.png',
    ':Conditions_bleeding:': '/emojis/Conditions_bleeding.png',
    ':Conditions_blinded:': '/emojis/Conditions_blinded.png',
    ':Conditions_dazed:': '/emojis/Conditions_dazed.png',
    ':Conditions_gaping_wounds:': '/emojis/Conditions_gaping_wounds.png',
    ':Conditions_hamstrung:': '/emojis/Conditions_hamstrung.png',
    ':Conditions_off_balance:': '/emojis/Conditions_off_balance.png',
    ':Conditions_stun:': '/emojis/Conditions_stun.png',
    ':Conditions_weak_grip:': '/emojis/Conditions_weak_grip.png',

    // Add more mappings as needed...
  };

  let html = container.innerHTML;
  for (const [shortcode, imgUrl] of Object.entries(emojiMap)) {
    const imgTag = `<img class="custom-emoji" alt="${shortcode}" src="${imgUrl}" />`;
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

  if (hasAlreadyBeenFetched()) {
    return setPosition(link.lastChild as HTMLElement);
  }

  const thisUrl = new URL(document.location.href);
  thisUrl.hash = "";
  thisUrl.search = "";
  const targetUrl = new URL(link.href);
  const rawHash = decodeURIComponent(targetUrl.hash).slice(1); // ← Changed
  targetUrl.hash = "";
  targetUrl.search = "";

  const response = await fetchCanonical(targetUrl).catch((err) => {
    console.error(err);
  });

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
      html.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

      let key: string | null = null;
      if (rawHash !== "") {
        key = rawHash.toLowerCase();
      }

      if (key) {
        const targetElt = html.querySelector(`.popover-hint[data-popover-key="${key}"]`) as HTMLElement | null;
        if (!targetElt) return;
        popoverInner.appendChild(targetElt);
      } else {
        const elts = [...html.getElementsByClassName("popover-hint")];
        if (elts.length === 0) return;
        elts.forEach((elt) => popoverInner.appendChild(elt));
      }

      replaceEmojiShortcodes(popoverInner);
  }

  setPosition(popoverElement);
  link.appendChild(popoverElement);

  // ---- Adjusted scrolling logic using Slugger ----
  if (rawHash !== "") {
    const slugger = new Slugger();
    const slug = slugger.slug(rawHash);
    const heading = popoverInner.querySelector(`#${CSS.escape(slug)}`) as HTMLElement | null;
    if (heading) {
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