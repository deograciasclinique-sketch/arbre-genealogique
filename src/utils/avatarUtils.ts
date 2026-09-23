// A neutral, local silhouette shown whenever a member has no photo yet —
// no external "demo" image is ever requested or displayed.
export const PLACEHOLDER_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f0ede8"/>
  <circle cx="50" cy="38" r="18" fill="#c7c1b8"/>
  <path d="M50 60c-22 0-36 13-36 30v10h72V90c0-17-14-30-36-30z" fill="#c7c1b8"/>
</svg>
`.trim());

export function photoOrPlaceholder(url?: string): string {
  return url && url.trim() ? url : PLACEHOLDER_AVATAR;
}
