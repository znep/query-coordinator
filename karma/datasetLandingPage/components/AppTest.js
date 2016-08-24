import App from 'App';
import mockView from 'data/mockView';
import mockFeaturedItem from 'data/mockFeaturedItem';
import mockViewWidget from 'data/mockViewWidget';
import { getDefaultStore } from 'testStore';
import datasetLandingPage from 'reducers';
import { createStore } from 'redux';

describe('App', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView
    });
  }

  function getStore(state) {
    window.initialState = _.defaultsDeep({}, state, {
      view: mockView,
      relatedViews: [mockViewWidget],
      featuredContent: [mockFeaturedItem]
    });

    return createStore(datasetLandingPage);
  }

  describe('when rendering a dataset', function() {
    var element;

    beforeEach(function() {
      element = renderComponentWithStore(App, {}, getStore());
    });

    it('does not render BlobPreview', function() {
      expect(element.querySelector('.blob-preview')).to.not.exist;
    });

    it('does not render BlobDownload', function() {
      expect(element.querySelector('.blob-download')).to.not.exist;
    });

    it('renders RowDetails', function() {
      expect(element.querySelector('.dataset-contents')).to.exist;
    });

    it('renders SchemaPreview', function() {
      expect(element.querySelector('.schema-preview')).to.exist;
    });
  });

  describe('when rendering a blob', function() {
    var element;

    beforeEach(function() {
      var storeState = {
        view: {
          isBlobby: true,
          blobType: 'image'
        }
      };

      element = renderComponentWithStore(App, {}, getStore(storeState));
    });

    it('renders BlobPreview', function() {
      expect(element.querySelector('.blob-preview')).to.exist;
    });

    it('renders BlobDownload', function() {
      expect(element.querySelector('.blob-download')).to.exist;
    });

    it('does not render RowDetails', function() {
      expect(element.querySelector('.dataset-contents')).to.not.exist;
    });

    it('does not render SchemaPreview', function() {
      expect(element.querySelector('.schema-preview')).to.not.exist;
    });

    it('does not render DatasetPreview', function() {
      expect(element.querySelector('.dataset-preview')).to.not.exist;
    });
  });
});
