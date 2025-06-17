// quartz/plugins/transformers/customEmojis.ts
import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"

// Define your custom emojis here
const customEmojis: Record<string, string> = {
  "FighterArts_fire_elemental": "/emojis/FighterArts_fire_elemental.png",
  "FighterArts_water_elemental": "/emojis/FighterArts_water_elemental.png",
  "FighterArts_earth_elemental": "/emojis/FighterArts_earth_elemental.png",
  "FighterArts_ice_elemental": "/emojis/FighterArts_ice_elemental.png",
  "FighterArts_electric_elemental": "/emojis/FighterArts_electric_elemental.png",
  "FighterArts_wind_elemental": "/emojis/FighterArts_wind_elemental.png",
  "FighterArts_dark_element": "/emojis/FighterArts_dark_element.png",
  "FighterArts_light_element": "/emojis/FighterArts_light_element.png",
  "FighterArts_break": "/emojis/FighterArts_break.png",
  "FighterArts_topple": "/emojis/FighterArts_topple.png",
  "FighterArts_launch": "/emojis/FighterArts_launch.png",
  "FighterArts_smash": "/emojis/FighterArts_smash.png",
  "FighterArts_heal": "/emojis/FighterArts_heal.png",
  "FighterArts_defense": "/emojis/FighterArts_defense.png",
  "Conditions_bleeding": "/emojis/Conditions_bleeding.png",
  "Conditions_blinded": "/emojis/Conditions_blinded.png",
  "Conditions_burst": "/emojis/Conditions_burst.png",
  "Conditions_daze2": "/emojis/Conditions_daze2.png",
  "Conditions_dazed": "/emojis/Conditions_dazed.png",
  "Conditions_gaping_wounds": "/emojis/Conditions_gaping_wounds.png",
  "Conditions_hamstrung": "/emojis/Conditions_hamstrung.png",
  "Conditions_off_balance": "/emojis/Conditions_off_balance.png",
  "Conditions_stun": "/emojis/Conditions_stun.png",
  "Conditions_weak_grip": "/emojis/Conditions_weak_grip.png",
  "WeaponArts_art_cancel": "/emojis/WeaponArts_art_cancel.png",
  "WeaponArts_art_front": "/emojis/WeaponArts_art_front.png",
  "WeaponArts_art_rear": "/emojis/WeaponArts_art_rear.png",
  "WeaponArts_art_recharge": "/emojis/WeaponArts_art_recharge.png",
  "WeaponArts_art_side": "/emojis/WeaponArts_art_side.png",
  "WeaponArts_art_species": "/emojis/WeaponArts_art_species.png",
  "WeaponArts_backbreaker": "/emojis/WeaponArts_backbreaker.png",
  "WeaponArts_concussive_smash": "/emojis/WeaponArts_concussive_smash.png",
  "WeaponArts_disarming_attack": "/emojis/WeaponArts_disarming_attack.png",
  "WeaponArts_flourish": "/emojis/WeaponArts_flourish.png",
  "WeaponArts_hamstring_shot": "/emojis/WeaponArts_hamstring_shot.png",
  "WeaponArts_heartstopper": "/emojis/WeaponArts_heartstopper.png",
  "WeaponArts_lacerate": "/emojis/WeaponArts_lacerate.png",
  "WeaponArts_piercing_strike": "/emojis/WeaponArts_piercing_strike.png",
  "WeaponArts_pommel_strike": "/emojis/WeaponArts_pommel_strike.png",
  "WeaponArts_rush_attack": "/emojis/WeaponArts_rush_attack.png",
  "WeaponArts_tenacity": "/emojis/WeaponArts_tenacity.png",
  "WeaponArts_toppple2": "/emojis/WeaponArts_topple2.png",
  "WeaponArts_weakening_strike": "/emojis/WeaponArts_weakening_strike.png",
  "Art_Front": "/emojis/Art_Front.png",
  // Add more emojis here: "shortcode": "/path/to/image.png"
};

export const CustomEmojis: QuartzTransformerPlugin = () => {
  return {
    name: "CustomEmojis",
    markdownPlugins() {
      return [
        () => (tree: Root, _file) => {
          visit(tree, "text", (node, index, parent) => {
            if (!parent || index === null) return

            const regex = /:(\w+):/g
            const matches = [...node.value.matchAll(regex)]
            if (matches.length === 0) return

            let lastIndex = 0
            const newChildren = []
            for (const match of matches) {
              const shortcode = match[1]
              const emojiPath = customEmojis[shortcode]
              const start = match.index!
              const end = start + match[0].length

              if (start > lastIndex) {
                newChildren.push({
                  type: "text",
                  value: node.value.slice(lastIndex, start),
                })
              }

              if (emojiPath) {
                newChildren.push({
                  type: "html",
                  value: `<img src="${emojiPath}" class="emoji custom-emoji" alt="${shortcode}" />`, // ✅ Backtick closed
                })
              } else {
                newChildren.push({
                  type: "text",
                  value: match[0],
                })
              }

              lastIndex = end
            }

            if (lastIndex < node.value.length) {
              newChildren.push({
                type: "text",
                value: node.value.slice(lastIndex),
              })
            }

            parent.children.splice(index, 1, ...newChildren)
          }) // ✅ Closing parenthesis for `visit()`
        }, // ✅ Comma to separate array elements
      ]
    },
  }
}