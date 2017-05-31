// Main entry point for embeds. This file is loaded (via script tag)
// by src/embed/loader.js.
//
// LIBRARY_VERSION comes from our Webpack config and is injected
// directly from package.json.
import $ from 'jquery';
import generateEmbedCode from './embedCodeGenerator';
import hydrateEmbeds from './hydrator';

import '../views/styles/socrata-visualizations.scss';
import 'leaflet/dist/leaflet.css';
import 'socrata-components/dist/css/styleguide-no-tag-level.css';

window.socrata = window.socrata || {};
window.socrata.visualizationEmbed = window.socrata.visualizationEmbed || {};

// The loader should be smart enough to only load this script once.
// If that fails or someone pulls us in directly, this check prevents
// duplicate invocations of this script from conflicting.
if (!window.socrata.visualizationEmbed.mainScriptLoaded) {
  window.socrata.visualizationEmbed.mainScriptLoaded = true;
  window.socrata.visualizationEmbed.libraryVersion = LIBRARY_VERSION;
  window.socrata.visualizationEmbed.generateEmbedCode = generateEmbedCode;

  // Hydrate on doc ready (we have no guarantee of being loaded async).
  $(() => {
    hydrateEmbeds();

    // Only expose rendering code once everything is ready.
    // Otherwise, any outstanding loader might call into us
    // too early.
    window.socrata.visualizationEmbed.hydrateEmbeds = hydrateEmbeds;
  });
}
