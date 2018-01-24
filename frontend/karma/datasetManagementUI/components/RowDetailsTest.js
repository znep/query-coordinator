import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import RowDetails from 'datasetManagementUI/components/RowDetails/RowDetails';

describe('components/RowDetails', () => {
  it('returns ViewRowDetails component if dataset is published', () => {
    const props = {
      isPublishedDataset: true,
      revisionSeq: 4,
      fourfour: 'haha-haha'
    };

    const component = shallow(<RowDetails {...props} />);

    assert.isTrue(component.is('Connect(ViewRowDetailsContainer)'));
  });

  it('returns RevisionRowDetails component if dataset is unpublished', () => {
    const props = {
      isPublishedDataset: false,
      revisionSeq: 4,
      fourfour: 'haha-haha'
    };

    const component = shallow(<RowDetails {...props} />);

    assert.isTrue(component.is('Connect(RowDetails)'));
  });
});
