// Common paths related to embeds.

//TODO figure out where we want to host these.
const prefix = 'https://socrata-test-bucket.s3.amazonaws.com';

const loaderFilename = 'socrata-visualizations-loader.js';
const mainFilename = 'socrata-visualizations-embed.js';

export const loaderLibrarySrc = `${prefix}/${loaderFilename}`;
export const mainLibrarySrc = `${prefix}/${mainFilename}`;

