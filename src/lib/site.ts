// Site-wide constants. Single source for the GitHub Pages base path
// so all internal links survive the eventual move to a custom domain.
import.meta.env.BASE_URL;
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
