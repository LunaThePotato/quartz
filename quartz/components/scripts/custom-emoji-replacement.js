function replaceEmojiShortcodes(container) {
    // Define the mapping from shortcode to image URL.
    const emojiMap = {
      ':FighterArts_smash:': '/emojis/FighterArts_smash.png',
      ':FighterArts_launch:': '/emojis/FighterArts_launch.png',
      // Add other mappings as needed...
    };
  
    let html = container.innerHTML;
    // Loop through each shortcode and replace all occurrences with an <img> tag.
    for (const [shortcode, imgUrl] of Object.entries(emojiMap)) {
      const imgTag = `<img class="custom-emoji" alt="${shortcode}" src="${imgUrl}" />`;
      // Replace every occurrence of the shortcode.
      html = html.replaceAll(shortcode, imgTag);
    }
    container.innerHTML = html;
  }
  
  // Run the replacement on elements that should display emoji.
  function runEmojiReplacement() {
    // For example, process the entire page content:
    const contentContainers = document.querySelectorAll(".page-content");
    contentContainers.forEach(container => replaceEmojiShortcodes(container));
  }
  
  // Wait for the DOM to load, then run the replacement.
  document.addEventListener("DOMContentLoaded", runEmojiReplacement);
  
  // If your Quartz site uses a custom "nav" event to re-render content (as seen in the popover script),
  // you can also hook into that event:
  document.addEventListener("nav", runEmojiReplacement);