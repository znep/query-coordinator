import { shallow } from 'enzyme';
import { assert } from 'chai';
import mockView from '../data/mockView';
import { FeatureFlags } from 'common/feature_flags';

import { App } from 'datasetLandingPage/App';
import RowDetails from 'datasetLandingPage/components/RowDetails';
import SchemaPreview from 'datasetLandingPage/components/SchemaPreview';
import DatasetPreview from 'datasetLandingPage/components/DatasetPreview';
import BlobPreview from 'datasetLandingPage/components/BlobPreview';
import BlobDownload from 'datasetLandingPage/components/BlobDownload';

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
      element = shallow(<App {...getProps()} />);
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

      element = shallow(<App {...getProps(props)} />);
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
