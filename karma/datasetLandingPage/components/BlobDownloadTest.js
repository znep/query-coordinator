import _ from 'lodash';
import { BlobDownload } from 'components/BlobDownload';
import mockServerConfig from 'data/mockServerConfig';

describe('components/BlobDownload', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: {
        id: 'viewId',
        isBlobby: true,
        blobId: 'globally-unique-identifier',
        blobFilename: 'purple.png',
        blobMimeType: 'image/png',
        blobType: 'image',
        editUrl: 'something/edit'
      }
    });
  }

  it('renders an element if the view is blobby', function() {
    var element = renderComponent(BlobDownload, getProps());
    expect(element).to.exist;
    expect(element.querySelector('h2')).to.exist;
    expect(element.querySelector('.section-content')).to.exist;
  });

  it('does not render an element if the view is not blobby', function() {
    var element = renderComponent(BlobDownload, getProps({
      view: {
        isBlobby: false
      }
    }));

    expect(element).to.not.exist;
  });

  describe('edit prompt', function() {
    afterEach(function() {
      window.serverConfig = _.cloneDeep(mockServerConfig);
    });

    it('is hidden if the user is not a publisher or an admin', function() {
      window.serverConfig.currentUser = null;
      var element = renderComponent(BlobDownload, getProps());
      expect(element.querySelector('.edit-prompt')).to.not.exist;
    });

    it('is visible if the user is a publisher or an admin', function() {
      window.serverConfig.currentUser = { roleName: 'publisher' };
      var element = renderComponent(BlobDownload, getProps());
      expect(element.querySelector('.edit-prompt')).to.exist;
    });

    it('has a button that links to the edit page', function() {
      window.serverConfig.currentUser = { roleName: 'publisher' };
      var element = renderComponent(BlobDownload, getProps());
      expect(element.querySelector('.edit-prompt a.btn').getAttribute('href')).to.contain('/edit');
    });
  });

  describe('main content', function() {
    it('contains information about the file', function() {
      var element = renderComponent(BlobDownload, getProps());
      var fileInfo = element.querySelector('.section-content .file-info');
      expect(fileInfo).to.exist;
      expect(fileInfo.textContent).to.equal('purple.png');
    });

    it('contains a link to download the file', function() {
      var element = renderComponent(BlobDownload, getProps());
      var downloadButton = element.querySelector('.section-content a.btn');
      expect(downloadButton.getAttribute('href')).to.contain('/download/viewId/image%2Fpng');
    });
  });
});
