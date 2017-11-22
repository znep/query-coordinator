import { assert } from 'chai';
import React from 'react';
import _ from 'lodash';
import { shallow } from 'enzyme';
import PublishButton from 'components/PublishButton/PublishButton';

const defaultProps = {
  dataSatisfied: false,
  metadataSatisfied: false,
  publishing: false,
  publishDataset: _.noop
};

describe('"Publish Dataset" button and flyout', () => {
  it('is disabled when there is no data', () => {
    const component = shallow(<PublishButton {...defaultProps} />);
    assert.isTrue(component.find('button[disabled=true]').exists());
  });

  it('is disabled when the source is in progress', () => {
    const updatedProps = {
      ...defaultProps,
      dataSatisfied: true,
      metadataSatisfied: true,
      publishing: true,
      parenthoodSatisfied: true,
      requiresParenthood: false
    };

    const component = shallow(<PublishButton {...updatedProps} />);
    assert.isTrue(component.find('button[disabled=true]').exists());
  });

  it('is disabled when metadata is invalid', () => {
    const updatedProps = {
      ...defaultProps,
      dataSatisfied: true,
      metadataSatisfied: false,
      publishing: false,
      parenthoodSatisfied: true,
      requiresParenthood: false
    };

    const component = shallow(<PublishButton {...updatedProps} />);
    assert.isTrue(component.find('button[disabled=true]').exists());
  });

  it('is disabled when an is_parent: false usaid dataset has no external links'), () => {
    const updatedProps = {
      ...defaultProps,
      dataSatisfied: true,
      metadataSatisfied: false,
      publishing: false,
      parenthoodSatisfied: false,
      requiresParenthood: true
    };
  }
});
