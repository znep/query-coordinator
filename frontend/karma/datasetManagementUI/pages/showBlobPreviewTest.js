import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowBlobPreview } from 'pages/ShowBlobPreview/ShowBlobPreview';
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
    goHome: sinon.spy()
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

  it('contains information about the file', () => {
    const filetypeText = component.find('#source-filetype').first().text();
    const filesizeText = component.find('#source-filesize').first().text();
    assert.include(filetypeText, props.source.content_type);
    assert.include(filesizeText, props.source.filesize);
  })

})
