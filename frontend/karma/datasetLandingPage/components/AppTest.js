import { shallow } from 'enzyme';
import { assert } from 'chai';
import mockView from 'data/mockView';
import { FeatureFlags } from 'common/feature_flags';

import App from 'App';
import RowDetails from 'components/RowDetails';
import SchemaPreview from 'components/SchemaPreview';
import DatasetPreview from 'components/DatasetPreview';
import BlobPreview from 'components/BlobPreview';
import BlobDownload from 'components/BlobDownload';

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

  describe('when rendering a dataset', function() {
    let element;

    beforeEach(function() {
      // App is exported wrapped in Connect. It's much easier
      // to test the unconnected component, which is exposed at
      // App.WrappedComponent.
      element = shallow(<App.WrappedComponent {...getProps()} />);
    });

    it('does not render BlobPreview', function() {
      assert.lengthOf(element.find(BlobPreview), 0);
    });

    it('does not render BlobDownload', function() {
      assert.lengthOf(element.find(BlobDownload), 0);
    });

    it('renders RowDetails', function() {
      assert.lengthOf(element.find(RowDetails), 1);
    });

    it('renders SchemaPreview', function() {
      assert.lengthOf(element.find(SchemaPreview), 1);
    });
  });

  describe('when rendering a blob', function() {
    let element;

    beforeEach(function() {
      const props = {
        view: {
          isBlobby: true,
          blobType: 'image',
          blobId: 'guid',
          blobFilename: 'kitten.tiff'
        }
      };

      // App is exported wrapped in Connect. It's much easier
      // to test the unconnected component, which is exposed at
      // App.WrappedComponent.
      element = shallow(<App.WrappedComponent {...getProps(props)} />);
    });

    it('renders BlobPreview', function() {
      assert.lengthOf(element.find(BlobPreview), 1);
    });

    it('renders BlobDownload', function() {
      assert.lengthOf(element.find(BlobDownload), 1);
    });

    it('does not render RowDetails', function() {
      assert.lengthOf(element.find(RowDetails), 0);
    });

    it('does not render SchemaPreview', function() {
      assert.lengthOf(element.find(SchemaPreview), 0);
    });

    it('does not render DatasetPreview', function() {
      assert.lengthOf(element.find(DatasetPreview), 0);
    });
  });
});
