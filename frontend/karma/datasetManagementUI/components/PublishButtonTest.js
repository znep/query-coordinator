import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import { PublishButton } from 'components/PublishButton';

const defaultProps = {
  dataSatisfied: false,
  metadataSatisfied: false,
  publishedOrPublishing: false
};

describe('"Publish Dataset" button and flyout', () => {
  it('is disabled when there is no data', () => {
    const component = shallow(<PublishButton {...defaultProps} />);
    assert.isFalse(component.find('button[disabled=true]').isEmpty());
  });

  it('is disabled when the upload is in progress', () => {
    const updatedProps = {
      ...defaultProps,
      dataSatisfied: true,
      metadataSatisfied: true,
      publishedOrPublishing: true
    };

    const component = shallow(<PublishButton {...updatedProps} />);
    assert.isFalse(component.find('button[disabled=true]').isEmpty());
  });

  it('is disabled when metadata is invalid', () => {
    const updatedProps = {
      ...defaultProps,
      dataSatisfied: true,
      metadataSatisfied: false,
      publishedOrPublishing: false
    };

    const component = shallow(<PublishButton {...updatedProps} />);
    assert.isFalse(component.find('button[disabled=true]').isEmpty());
  });
});
