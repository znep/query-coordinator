import sinon from 'sinon';
import { expect, assert } from 'chai';
import App from 'App';
import $ from 'jquery';
import mockView from 'data/mockView';
import mockFeaturedItem from 'data/mockFeaturedItem';
import mockRelatedView from 'data/mockRelatedView';
import { getDefaultStore } from 'testStore';
import datasetLandingPage from 'reducers';
import { createStore } from 'redux';
import { FeatureFlags } from 'common/feature_flags';

describe('App', function() {
  before(function() {
    FeatureFlags.useTestFixture({
      disable_authority_badge: false
    });
  });

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView
    });
  }

  function getStore(state) {
    window.initialState = _.defaultsDeep({}, state, {
      view: mockView,
      relatedViews: [mockRelatedView],
      featuredContent: [mockFeaturedItem]
    });

    return createStore(datasetLandingPage);
  }

  describe('when rendering a dataset', function() {
    var originalSocrataTable;

    beforeEach(function() {
      originalSocrataTable = $.fn.socrataTable;
      $.fn.socrataTable = sinon.stub();
    });

    afterEach(function() {
      $.fn.socrataTable = originalSocrataTable;
    });

    var element;

    beforeEach(function() {
      element = renderComponentWithStore(App, {}, getStore());
    });

    it('does not render BlobPreview', function() {
      assert.isNull(element.querySelector('.blob-preview'));
    });

    it('does not render BlobDownload', function() {
      assert.isNull(element.querySelector('.blob-download'));
    });

    it('renders RowDetails', function() {
      assert.ok(element.querySelector('.dataset-contents'));
    });

    it('renders SchemaPreview', function() {
      assert.ok(element.querySelector('.schema-preview'));
    });
  });

  describe('when rendering a blob', function() {
    var element;

    beforeEach(function() {
      var storeState = {
        view: {
          isBlobby: true,
          blobType: 'image',
          blobId: 'guid',
          blobFilename: 'kitten.tiff'
        }
      };

      element = renderComponentWithStore(App, {}, getStore(storeState));
    });

    it('renders BlobPreview', function() {
      assert.ok(element.querySelector('.blob-preview'));
    });

    it('renders BlobDownload', function() {
      assert.ok(element.querySelector('.blob-download'));
    });

    it('does not render RowDetails', function() {
      assert.isNull(element.querySelector('.dataset-contents'));
    });

    it('does not render SchemaPreview', function() {
      assert.isNull(element.querySelector('.schema-preview'));
    });

    it('does not render DatasetPreview', function() {
      assert.isNull(element.querySelector('.dataset-preview'));
    });
  });
});
