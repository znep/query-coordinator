// Common paths related to embeds.
// Note that the loader pulls this file in,
// so please be wary of the payload size impact
// of what you import. See comments in loader.js.

// This is our ultimate fallback. Shouldn't ever be used.
// When we actually implement a CDN, this will hopefully
// go away.
const defaultAssetDomain = 'opendata.socrata.com';

export const loaderFilename = 'socrata-visualizations-loader.js';
export const mainLibraryFilename = 'socrata-visualizations-embed.js';

const asset = (domain, filename) =>
  `https://${domain || defaultAssetDomain}/component/visualization/v1/${filename}`;

export const loaderLibrarySrc = (domain) => asset(domain, loaderFilename);
export const mainLibrarySrc = (domain) => asset(domain, mainLibraryFilename);

