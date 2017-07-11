import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import Tag from 'components/FormComponents/Tag';
import { shallow } from 'enzyme';

describe('components/FormComponents/Tag', () => {
  let component;

  const defaultProps = {
    tagName: 'testtag',
    onTagClick: () => {}
  };

  beforeEach(() => {
    component = shallow(<Tag {...defaultProps} />);
  });

  it('renders a  list item', () => {
    assert.isTrue(component.is('li'));
  });

  it('inserts tagName prop inside list item', () => {
    assert.equal(component.childAt(0).text(), defaultProps.tagName);
  });

  it('inserts a close button inside the list item', () => {
    const closeButton = component.find('SocrataIcon');
    assert.equal(closeButton.length, 1);
  });

  it('calls the onTagClick callback when tag is clicked', () => {
    const newProps = {
      ...defaultProps,
      onTagClick: sinon.stub()
    };

    const element = shallow(<Tag {...newProps} />);

    element.find('.tag').simulate('click');

    assert.isTrue(newProps.onTagClick.called);
  });
});
