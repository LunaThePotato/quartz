import { CustomEmojis } from "./quartz/plugins/transformers/customEmojis";
import { QuartzConfig } from "./quartz/cfg";
import { Subtext } from "./quartz/plugins/transformers/subtext";
import * as Plugin from "./quartz/plugins";
import { visit } from "unist-util-visit";

/**
 * A small Remark plugin that forces every heading to use an ID
 * derived by replacing ":"→"_" and spaces→"-", then lowercasing.
 */
function remarkCustomSlugifier() {
  return () => (tree: any) => {
    visit(tree, "heading", (node: any) => {
      // Extract the plain text from all child nodes
      const text = node.children
        .map((c: any) => ("value" in c ? c.value : ""))
        .join("");
      // Build the slug: replace colons, spaces, lowercase
      const slug = text
        .replace(/:/g, "_")
        .replace(/\s+/g, "-")
        .toLowerCase();
      // Attach as an explicit ID for rehype to pick up
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.id = slug;
    });
  };
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Solteria Wiki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: { provider: "plausible" },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    generateSocialImages: true,
    socialImage: "Solteria.png",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: { header: "Noto Serif", body: "PT Serif", code: "IBM Plex Mono" },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.Subtext(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "filesystem"] }),
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),

      // ← Insert our custom slugifier here!
      {
        name: "CustomSlugifier",
        markdownPlugins() {
          return [remarkCustomSlugifier()];
        },
      },

      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      CustomEmojis(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
};

export default config;