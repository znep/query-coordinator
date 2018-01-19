import { assert } from 'chai';
import generateEmbedCode from 'visualization_embed/embedCodeGenerator';
import $ from 'jquery';
import mockVif from './mockVif';
import _ from 'lodash';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';

const mockVifDomain = 'vertex-stories.test-socrata.com';
const loaderSrc = 'https://vertex-stories.test-socrata.com/component/visualization/v1/socrata-visualizations-loader.js';
const vifSerialized = JSON.stringify(mockVif).replace(/"/g, '&quot;');
const defaultHref = 'https://vertex-stories.test-socrata.com/d/k6cs-ww27?referrer=embed';

describe('embedCodeGenerator', function() {
  beforeEach(function() {
    I18n.translations.en = allLocales.en;
  });

  afterEach(function() {
    I18n.translations = {};
  });

  const testCase = (caseName, vif, options, expectedValue) => {
    describe(caseName, () => {
      it('should return the expected embed code', () => {
        assert.equal(expectedValue, generateEmbedCode(vif, options));
      });
    });
  };

  testCase('no options given', mockVif, undefined, `<script type="text/javascript" charset="UTF-8" data-socrata-domain="${mockVifDomain}" src="${loaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${vifSerialized}" href="${defaultHref}" rel="external" target="_blank">Explore the data</a>`);

  testCase('custom link text', mockVif, { fallbackSourceLinkText: 'foo' }, `<script type="text/javascript" charset="UTF-8" data-socrata-domain="${mockVifDomain}" src="${loaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${vifSerialized}" href="${defaultHref}" rel="external" target="_blank">foo</a>`);

  testCase('custom href', mockVif, { sourceHref: 'https://example.com' }, `<script type="text/javascript" charset="UTF-8" data-socrata-domain="${mockVifDomain}" src="${loaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${vifSerialized}" href="https://example.com" rel="external" target="_blank">Explore the data</a>`);

  testCase('height set', mockVif, { height: '123px' }, `<script type="text/javascript" charset="UTF-8" data-socrata-domain="${mockVifDomain}" src="${loaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-height="123px" data-vif="${vifSerialized}" href="${defaultHref}" rel="external" target="_blank">Explore the data</a>`);

  testCase('width set', mockVif, { width: '321px' }, `<script type="text/javascript" charset="UTF-8" data-socrata-domain="${mockVifDomain}" src="${loaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${vifSerialized}" data-width="321px" href="${defaultHref}" rel="external" target="_blank">Explore the data</a>`);

  describe('vif with nonstandard data source', () => {
    const vifWithNonstandardSource = _.cloneDeep(mockVif);
    _.set(vifWithNonstandardSource, 'series[0].dataSource', { type: 'oddness' });
    const nonstandardVifSerialized = JSON.stringify(vifWithNonstandardSource).replace(/"/g, '&quot;');
    const nonstandardVifLoaderSrc = 'https://opendata.socrata.com/component/visualization/v1/socrata-visualizations-loader.js';

    testCase('no href given', vifWithNonstandardSource, undefined, `<script type="text/javascript" charset="UTF-8" src="${nonstandardVifLoaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${nonstandardVifSerialized}" rel="external" target="_blank">Explore the data</a>`);
    testCase('href given', vifWithNonstandardSource, { sourceHref: 'https://example.com' }, `<script type="text/javascript" charset="UTF-8" src="${nonstandardVifLoaderSrc}"></script>\n<a class="socrata-visualization-embed" data-embed-version="1" data-vif="${nonstandardVifSerialized}" href="https://example.com" rel="external" target="_blank">Explore the data</a>`);
  });
});
