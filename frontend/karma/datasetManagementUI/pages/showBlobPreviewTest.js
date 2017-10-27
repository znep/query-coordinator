import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { ShowBlobPreview } from 'pages/ShowBlobPreview/ShowBlobPreview';
import sinon from 'sinon';

describe('ShowBlobPreview', () => {
  const props = {
    revision: {
      revision_seq: 0,
      fourfour: 'meow-meow'
    },
    source: {
      id: 1,
      content_type: 'image/jpeg'
    },
    saveCurrentBlob: sinon.spy(),
    goHome: sinon.spy()
  }

  const component = shallow(<ShowBlobPreview {...props} />)

  it('renders', () => {
    assert.isTrue(component.exists());
  });

  it('can getBlobType() when content_type is imagey', () => {
    assert.equal(component.instance().getBlobType(), 'image');
  });

  it('can getBlobType() when content_type is documenty', () => {
    const newProps = {...props, source: {...props.source, content_type: 'application/pdf'}}
    const pdfPreview = shallow(<ShowBlobPreview {...newProps} />);
    assert.equal(pdfPreview.instance().getBlobType(), 'google_viewer');
  });

  it('can getBlobType() when content_type is other', () => {
    const newProps = {...props, source: {...props.source, content_type: 'application/zip'}}
    const zipPreview = shallow(<ShowBlobPreview {...newProps} />);
    assert.equal(zipPreview.instance().getBlobType(), 'link');
  });
})
