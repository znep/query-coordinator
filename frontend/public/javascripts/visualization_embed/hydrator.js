// Visualization hydrator. Replaces embed codes with real visualizations.

import $ from 'jquery';
import { views as visualizationViews, VisualizationRenderer } from 'common/visualizations';
const { FlyoutRenderer } = visualizationViews;

const DEFAULT_WIDTH = '500px';
const DEFAULT_HEIGHT = '400px';

/**
 * Renders all unrendered embed codes.
 */
export default function hydrateEmbeds() {
  const $embeds = $('.socrata-visualization-embed:not(.rendered)');
  $embeds.each((i, element) => {
    try {
      hydrateEmbed(element);
    } catch (e) {
      // Log error and continue with remainder of embeds.
      logWarning('Error rendering visualization.', e);
    }
  });
}

/**
 * Replaces the given embed code with a visualization.
 */
export const hydrateEmbed = (element) => {
  const embedVersion = element.getAttribute('data-embed-version');
  const vifAttribute = element.getAttribute('data-vif');

  if (!embedVersion) {
    logWarning('Embed tag must specify a data-embed-version attribute.');
  } else if (embedVersion !== '1') {
    logWarning(`Library too old to render v${embedVersion} embeds`);
  } else if (!vifAttribute) {
    logWarning('Embed tag must specify a data-vif attribute.');
  } else if ($(element).hasClass('rendered')) {
    // TODO: VIF updates would be relatively easy - just trigger SOCRATA_VISUALIZATION_RENDER_VIF
    // However, we should actually figure out how we want external devs to interface with this
    // library.
    logWarning('Embed already rendered, skipping rerender.');
  } else {
    let vif = null;
    try {
      vif = JSON.parse(vifAttribute);
    } catch (e) {
      logWarning('Embed data-vif attribute is not valid JSON.', e);
      return;
    }

    // Possible improvement: Use default sizes if chart isn't getting space in the
    // layout (say, any dimension less that 20px).
    const width = element.getAttribute('data-width') || DEFAULT_WIDTH;
    const height = element.getAttribute('data-height') || DEFAULT_HEIGHT;

    const target = $(
      '<div>',
      {
        // Be nice to devs and preserve some attrs.
        'class': element.getAttribute('class'),
        'id': element.getAttribute('id')
      }
    );
    target.width(width);
    target.height(height);
    target.addClass('rendered');
    target.data('vif', vif); // For debugging help.
    $(element).replaceWith(target);

    try {
      new VisualizationRenderer(vif, target, {
        // Since tag-level Styleguide is not on the page, instruct flyouts to aggressively
        // apply their own text formatting.
        flyoutRenderer: new FlyoutRenderer({ inheritTextStyle: false }),
        displayFilterBar: true
      });
    } catch (e) {
      logWarning('Visualization failed to render', e);
      // TODO better error UX.
      $(target).replaceWith(element); // Put the original content back.
    }
  }
};

const logWarning = (message, error) => {
  if (window.console) {
    const args = [ `Socrata Visualizations: ${message}` ];
    if (error) {
      args.push(error);
    }
    console.warn.apply(console, args);
  }
};
