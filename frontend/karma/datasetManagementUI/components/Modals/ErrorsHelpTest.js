import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import ErrorsHelp from 'components/Modals/ErrorsHelp';

describe('components/Modals/ErrorsHelp', () => {
  const defaultProps = {
    errorRowCount: 9,
    onDismiss: sinon.spy()
  };

  it('renders <WhyWontTheyImport/> as first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    assert.isFalse(component.find('WhyWontTheyImport').isEmpty());
  });

  it('renders <WhatCanIDoAboutIt/> as second page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 1
    });

    assert.isFalse(component.find('WhatCanIDoAboutIt').isEmpty());
  });

  it('renders <HowToGetRowsBackInDataset/> as third page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 2
    });

    assert.isFalse(component.find('HowToGetRowsBackInDataset').isEmpty());
  });

  it('renders only a next button on first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    const nextButton = component.find('.nextButton');

    const prevButton = component.find('.previousButton');

    assert.isFalse(nextButton.isEmpty());

    assert.isTrue(prevButton.isEmpty());
  });

  it('renders a prev button when not on first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 2
    });

    const prevButton = component.find('.previousButton');

    assert.isFalse(prevButton.isEmpty());
  });

  it('changes state correctly when next button clicked', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.find('.nextButton').simulate('click');

    assert.equal(component.state('modalPage'), 1);
  });

  it('changes state correctly when prev button clicked', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 2
    });

    component.find('.previousButton').simulate('click');

    assert.equal(component.state('modalPage'), 1);
  });
});
