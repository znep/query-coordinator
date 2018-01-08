import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowBlobPreview, BlobFileInfo } from 'pages/ShowBlobPreview/ShowBlobPreview';
import BlobPreview from 'containers/BlobPreviewContainer';
import BlobDownload from 'containers/BlobDownloadContainer';
import sinon from 'sinon';

describe('ShowBlobPreview', () => {
  const props = {
    revision: {
      revision_seq: 0,
      fourfour: 'meow-meow'
    },
    source: {
      id: 1,
      content_type: 'image/jpeg',
      filesize: 30
    },
    saveCurrentBlob: sinon.spy(),
    goHome: sinon.spy(),
    sourcesLink: ''
  }

  const component = shallow(<ShowBlobPreview {...props} />)

  it('renders', () => {
    assert.isTrue(component.exists());
  });

  it('has a BlobPreview element', () => {
    assert.lengthOf(component.find(BlobPreview), 1);
    assert.isTrue(component.find(BlobPreview).first().exists());
  })

  it('has a BlobDownload element', () => {
    assert.lengthOf(component.find(BlobDownload), 1);
    assert.isTrue(component.find(BlobDownload).first().exists());
  })

  it('has a BlobFileInfo element', () => {
    assert.lengthOf(component.find(BlobFileInfo), 1);
    assert.isTrue(component.find(BlobFileInfo).first().exists());
  })

  describe('BlobFileInfo', () => {

    const blobInfoComponent = shallow(<BlobFileInfo source={props.source} sourcesLink="/sources/link" />)

    it('contains information about the file', () => {
      const filetypeText = blobInfoComponent.find('#sourceFiletype').first().text();
      const filesizeText = blobInfoComponent.find('#sourceFilesize').first().text();
      assert.include(filetypeText, props.source.content_type);
      assert.include(filesizeText, props.source.filesize);
    })

    it('contains an informative alert', () => {
      assert.lengthOf(blobInfoComponent.find('.alert'), 1);
      assert.isTrue(blobInfoComponent.find('.alert').first().exists());
    })
  });

})
