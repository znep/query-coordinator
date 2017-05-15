import { expect, assert } from 'chai';
import { BlobPreview } from 'components/BlobPreview';

describe('components/BlobPreview', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: {
        isBlobby: true,
        blobId: 'guid',
        blobType: 'image'
      }
    });
  }

  it('renders an element if the view is blobby', function() {
    var element = renderComponent(BlobPreview, getProps());
    assert.ok(element);
  });

  it('does not render an element if the view is not blobby', function() {
    var element = renderComponent(BlobPreview, getProps({
      view: {
        isBlobby: false
      }
    }));

    assert.isNull(element);
  });

  it('does not render an element if the blob has an unknown type', function() {
    var element = renderComponent(BlobPreview, getProps({
      view: {
        blobType: 'a catchy mp3 file'
      }
    }));

    assert.isNull(element);
  });

  describe('preview', function() {
    it('renders an image if the blob is an image', function() {
      var element = renderComponent(BlobPreview, getProps());
      var image = element.querySelector('img');
      assert.ok(image);
      expect(image.getAttribute('src')).to.contain('guid');
    });

    it('renders an iframe if the blob is a document', function() {
      var element = renderComponent(BlobPreview, getProps({
        view: {
          blobType: 'google_viewer'
        }
      }));

      var iframe = element.querySelector('iframe');
      assert.ok(iframe);
      expect(iframe.getAttribute('src')).to.contain('docs.google.com');
      expect(iframe.getAttribute('src')).to.contain('guid');
    });
  });
});
