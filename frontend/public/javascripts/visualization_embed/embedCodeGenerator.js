import _ from 'lodash';
import $ from 'jquery';
import I18n from 'common/i18n';
import { loaderLibrarySrc } from './paths';

/**
 * Generates an embed code given a vif and some embed options.
 *
 * @param vif
 * @param options: Options relating to embed code generation
 *   - fallbackSourceLinkText: This text is displayed while we load the visualizations package
 *       or the package fails to load (networking issue or similar). Defaults to a generic
 *       "Explore the data".
 *   - sourceHref: href for the fallback source link. By default, links to the VIF's dataset page.
 *   - height, width: Override default dimensions. Any value jQuery understands, i.e. '200px'.
 */
export default function generateEmbedCode(vif, options) {
  // N.B.: The HTML generated by this function is immutable once embedded
  // into a customer's page (I suppose we could ask them nicely to re-embed).
  // We should be _really_ careful what we put in here.
  options = options || {};

  const domain = _.get(vif, 'series[0].dataSource.domain');
  const datasetUid = _.get(vif, 'series[0].dataSource.datasetUid');
  const defaultSourceHref = (domain && datasetUid) ? `https://${domain}/d/${datasetUid}?referrer=embed` : null;
  const fallbackSourceLinkText = options.fallbackSourceLinkText || I18n.t('shared.visualizations.charts.embed.explore_data_link');
  const domainAttr = domain ? `data-socrata-domain="${domain}" ` : '';

  const scriptTag = `<script type="text/javascript" charset="UTF-8" ${domainAttr}src="${loaderLibrarySrc(domain)}"></script>`;

  // Some of these fields will resolve to null or undefined.
  // This is fine - jQuery will not set those particular
  // attributes, which is what we want.
  const attrs = {
    'class': 'socrata-visualization-embed',
    'data-embed-version': '1',
    'data-height': options.height,
    'data-vif': JSON.stringify(vif),
    'data-width': options.width,
    href: _.get(options, 'sourceHref', defaultSourceHref),
    rel: 'external',
    target: '_blank'
  };

  const link = $('<a>', attrs).
    text(fallbackSourceLinkText)[0].
    outerHTML;

  return `${scriptTag}\n${link}`;
}
