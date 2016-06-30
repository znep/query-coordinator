import React from 'react';
import { view } from 'components/importing';
import _ from 'lodash';

describe('importing screen view', () => {
  it('shows notify button when notification key is present', () => {
    const element = renderComponent(view({
      importStatus: {
        type: 'InProgress',
        progress: { rowsImported: 0, ticket: 'asdf-1234-asdf-1234' },
        notification: 'Available'
      },
      operation: 'UploadData',
      onNotifyMe: _.noop
    }));
    expect(element.querySelector('a.button.setNotifyComplete'))
      .to.be.defined;
  });

  it('does not show the notify button when notification key is missing', () => {
    const element = renderComponent(view({
      importStatus: {
        type: 'InProgress',
        progress: { stage: 'processing', ticket: 'asdf-1234-asdf-1234' }
      },
      operation: 'UploadGeospatial',
      onNotifyMe: _.noop
    }));
    expect(element.querySelector('a.button.setNotifyComplete'))
      .to.be.null;
  });

});
