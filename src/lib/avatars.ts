export interface AvatarOption {
  id: string;
  name: string;
  url: string;
}

export const PRESET_3D_AVATARS: AvatarOption[] = [
  {
    id: "memoji-cool",
    name: "Cool Shades",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png",
  },
  {
    id: "memoji-star",
    name: "Star Struck",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png",
  },
  {
    id: "memoji-hearts",
    name: "Heart Eyes",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png",
  },
  {
    id: "memoji-party",
    name: "Partying",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png",
  },
  {
    id: "memoji-robot",
    name: "Cyber Bot",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png",
  },
  {
    id: "memoji-alien",
    name: "Cosmic Alien",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien.png",
  },
  {
    id: "memoji-joy",
    name: "Joy Tears",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png",
  },
  {
    id: "memoji-sunny",
    name: "Sunny Smile",
    url: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Beaming%20Face%20with%20Smiling%20Eyes.png",
  },
];

export const DEFAULT_AVATAR = PRESET_3D_AVATARS[0].url;

export function getFallbackAvatar(name: string, type: "user" | "group" | "direct" = "user"): string {
  const safeName = (name || "User").trim();
  if (type === "group") {
    return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(safeName)}&backgroundColor=007AFF,5856D6,AF52DE`;
  }
  const charCode = safeName.charCodeAt(0) || 0;
  const index = charCode % PRESET_3D_AVATARS.length;
  return PRESET_3D_AVATARS[index].url;
}
