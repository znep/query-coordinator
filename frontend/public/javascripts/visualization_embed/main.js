// Main entry point for embeds. This file is loaded (via script tag)
// by src/embed/loader.js.
import $ from 'jquery';
import generateEmbedCode from './embedCodeGenerator';
import hydrateEmbeds from './hydrator';

// Socrata-icons MUST come before styleguide. Otherwise,
// you will get icons showing up twice (styleguide has a
// compatibility shim for old-style socrata-icons that is
// sensitive to style load order).
import 'frontend/app/styles/socrata-icons.scss';
import 'common/styleguide/styleguide-no-tag-level.scss';
import 'frontend/app/styles/visualizations-import-shim.scss';

window.socrata = window.socrata || {};
window.socrata.visualizationEmbed = window.socrata.visualizationEmbed || {};

// The loader should be smart enough to only load this script once.
// If that fails or someone pulls us in directly, this check prevents
// duplicate invocations of this script from conflicting.
if (!window.socrata.visualizationEmbed.mainScriptLoaded) {
  window.socrata.visualizationEmbed.mainScriptLoaded = true;
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
