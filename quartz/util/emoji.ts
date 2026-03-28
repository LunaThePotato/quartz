const customEmojis: Record<string, string> = {
  "FighterArts_fire_elemental": "/emojis/FighterArts_fire_elemental.png",
}

const U200D = String.fromCharCode(8205)
const UFE0Fg = /\uFE0F/g

export function getIconCode(char: string) {
  return toCodePoint(char.indexOf(U200D) < 0 ? char.replace(UFE0Fg, "") : char)
}

function toCodePoint(unicodeSurrogates: string) {
  const r: string[] = []
  let c = 0,
    p = 0,
    i = 0

  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++)
    if (p) {
      r.push((65536 + ((p - 55296) << 10) + (c - 56320)).toString(16))
      p = 0
    } else if (55296 <= c && c <= 56319) {
      p = c
    } else {
      r.push(c.toString(16))
    }
  }

  return r.join("-")
}

type EmojiMap = {
  codePointToName: Record<string, string>
  nameToBase64: Record<string, string>
}

let emojimap: EmojiMap | undefined = undefined
const emojiCache: Record<string, Promise<string>> = {}

function twemoji(code: string) {
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${getIconCode(code)}.svg`
}

export async function loadEmoji(code: string) {
  const customEmoji = customEmojis[code]
  if (customEmoji) {
    return `
      <img
        src="${customEmoji}"
        class="emoji custom-emoji"
        alt="${code}"
        data-custom="true"
      />
    `
  }

  if (!emojimap) {
    const data = await import("./emojimap.json")
    emojimap = data as EmojiMap
  }

  const name = emojimap.codePointToName[code.toUpperCase()]
  if (!name) {
    const key = `twemoji:${code}`
    if (key in emojiCache) return emojiCache[key]
    return (emojiCache[key] = fetch(twemoji(code)).then((r) => r.text()))
  }

  const base64 = emojimap.nameToBase64[name]
  if (!base64) {
    const key = `twemoji:${code}`
    if (key in emojiCache) return emojiCache[key]
    return (emojiCache[key] = fetch(twemoji(code)).then((r) => r.text()))
  }

  return `
    <img
      src="data:image/svg+xml;base64,${base64}"
      class="emoji"
      alt="${code}"
    />
  `
}