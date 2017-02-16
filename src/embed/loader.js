// This script is referenced by the embed code's script tag.
// Its job is simply to bootstrap the full visualization embed
// library.
//
// PLEASE NOTE that this script will be included multiple times
// in a single page if there is more than one embedded visualization.
// The script MUST be idempotent.

import { mainLibrarySrc } from './paths';

window.socrata = window.socrata || {};

// Load the main package if needed.
if (!document.querySelector(`script[src="${mainLibrarySrc}"]`)) {
  var scriptTag = document.createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.async = true;
  scriptTag.charset = 'UTF-8'; // Important, non-UTF8 sites won't autodetect encoding properly.
  scriptTag.src = mainLibrarySrc;
  document.head.appendChild(scriptTag);
  // Once the script loads, it will automatically call hydrateEmbeds.
} else {
  // If script already loaded, make sure it has rendered all embeds.
  // This covers the dynamic addition of embeds (say, a JS carousel or
  // XHR-driven content loading).
  // hydrateEmbeds is idempotent, so it's safe to call whenever.
  if (
    window.socrata &&
    window.socrata.visualizationEmbed &&
    window.socrata.visualizationEmbed.hydrateEmbeds) {
    window.socrata.visualizationEmbed.hydrateEmbeds();
  }
}

