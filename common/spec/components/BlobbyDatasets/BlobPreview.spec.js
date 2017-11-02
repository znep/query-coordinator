import { assert } from 'chai';
import { BlobPreview } from 'common/components';
import TestUtils from 'react-dom/test-utils';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/BlobPreview', () => {
  const defaultProps = {
    isPreviewable: true,
    previewUrl: 'url/preview.com',
    previewType: 'image',
    blobName: 'filename.txt'
  };
  const component = shallow(<BlobPreview {...defaultProps} />);

  it('renders a header with a title', () => {
    const previewHeader = component.find('h2');
    assert.ok(previewHeader);
    assert.isAtLeast(previewHeader.length, 1);
  });

  it('contains the an img with the previewURL when previewType is image', () => {
    var previewImg = component
      .find('PreviewElement')
      .dive()
      .find('img');
    assert.equal(previewImg.prop('src'), defaultProps.previewUrl);
    assert.equal(previewImg.prop('alt'), defaultProps.blobName);
  });

  it('contains the an iframe with the previewURL when previewType is google_viewer', () => {
    const newProps = { ...defaultProps, previewType: 'google_viewer' };
    const googlePreview = shallow(<BlobPreview {...newProps} />);
    var previewIframe = googlePreview
      .find('PreviewElement')
      .dive()
      .find('iframe');
    assert.include(previewIframe.prop('src'), defaultProps.previewUrl);
  });

  it('does not render a preview if previewType is not image/google_viewer', () => {
    const newProps = { ...defaultProps, previewType: 'other' };
    const notComponent = shallow(<BlobPreview {...newProps} />);
    assert.isTrue(notComponent.isEmptyRender());
  });

  it('does not render a preview if isPreviewable is false', () => {
    const newProps = { ...defaultProps, isPreviewable: false };
    const notComponent = shallow(<BlobPreview {...newProps} />);
    assert.isTrue(notComponent.isEmptyRender());
  });
});
