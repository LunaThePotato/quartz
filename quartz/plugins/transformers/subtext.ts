import { QuartzTransformerPlugin } from "../types";
import { visit } from "unist-util-visit";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";

/**
 * A Quartz transformer plugin that turns paragraphs starting with "-# "
 * into <small class="subtext">…</small>, preserving any inline formatting.
 */
export const Subtext: QuartzTransformerPlugin = () => ({
  name: "Subtext",
  markdownPlugins() {
    return [
      () => (tree, file) => {
        visit(tree, "paragraph", (node: any, index: number, parent: any) => {
          // Check if first child is a text node beginning with "-# "
          const first = node.children[0];
          if (
            first?.type === "text" &&
            typeof first.value === "string" &&
            first.value.startsWith("-# ")
          ) {
            // Remove the "-# " prefix from the first text node
            first.value = first.value.replace(/^-#\s*/, "");

            // Convert this paragraph's MDAST children to a HAST tree
            const hastTree = toHast(
              { type: "root", children: node.children },
              { allowDangerousHtml: true }
            );
            // Serialize the HAST tree into HTML
            const html = toHtml(hastTree, { allowDangerousHtml: true });

            // Replace the entire paragraph node with an HTML node
            parent.children[index] = {
              type: "html",
              value: `<small class="subtext">${html}</small>`,
            };
          }
        });
      },
    ];
  },
});
