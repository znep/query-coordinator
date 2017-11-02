import { assert } from 'chai';
import { BlobDownload } from 'common/components';
import TestUtils from 'react-dom/test-utils';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/BlobDownload', () => {
  const defaultProps = {
    showDownloadSection: true,
    showManageSection: true,
    blobFilename: 'filename.txt',
    downloadLink: 'fake/download/link',
    editBlobSourceLink: '/editLink'
  };
  const component = shallow(<BlobDownload {...defaultProps} />);

  it('renders a header with a title', () => {
    const downloadHeader = component.find('h2');
    assert.ok(downloadHeader);
    assert.isAtLeast(downloadHeader.length, 1);
  });

  it('contains the blobs filename', () => {
    var downloadTitle = component.find(
      '.section-content .download-object .download-title'
    );
    assert.ok(downloadTitle);
    assert.equal(downloadTitle.text(), defaultProps.blobFilename);
  });

  it('contains a link to download the file', () => {
    var downloadButton = component.find('.section-content a.btn');
    assert.equal(downloadButton.prop('href'), defaultProps.downloadLink);
  });

  it('renders the edit component', () => {
    const manageMessage = component
      .find('ManagePrompt')
      .dive()
      .find('.edit-prompt-message');
    assert.ok(manageMessage);
    assert.isAtLeast(manageMessage.length, 1);
    const manageLink = component
      .find('ManagePrompt')
      .dive()
      .find('.edit-prompt-button');
    assert.equal(manageLink.prop('href'), defaultProps.editBlobSourceLink);
  });

  it('does not render the edit component if showManageSection is false', () => {
    const newProps = { ...defaultProps, showManageSection: false };
    const noManageComponent = shallow(<BlobDownload {...newProps} />);
    const manageMessage = noManageComponent.find('.edit-prompt-message');
    assert.equal(manageMessage.length, 0);
  });

  it('does not render anything if showDownloadSection is false', () => {
    const newProps = { ...defaultProps, showDownloadSection: false };
    const notComponent = shallow(<BlobDownload {...newProps} />);
    assert.isTrue(notComponent.isEmptyRender());
  });
});
