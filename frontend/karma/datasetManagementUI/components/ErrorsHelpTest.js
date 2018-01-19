import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import ErrorsHelp from 'datasetManagementUI/components/ErrorsHelp/ErrorsHelp';

describe('components/Modals/ErrorsHelp', () => {
  const defaultProps = {
    errorRowCount: 9,
    onDismiss: sinon.spy()
  };

  it('renders <WhyWontTheyImport/> as first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    assert.isTrue(component.find('WhyWontTheyImport').exists());
  });

  it('renders <WhatCanIDoAboutIt/> as second page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 1
    });

    assert.isTrue(component.find('WhatCanIDoAboutIt').exists());
  });

  it('renders <HowToGetRowsBackInDataset/> as third page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 2
    });

    assert.isTrue(component.find('HowToGetRowsBackInDataset').exists());
  });

  it('renders only a next button on first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    const nextButton = component.find('.nextButton');

    const prevButton = component.find('.previousButton');

    assert.isTrue(nextButton.exists());

    assert.isFalse(prevButton.exists());
  });

  it('renders a prev button when not on first page', () => {
    const component = shallow(<ErrorsHelp {...defaultProps} />);

    component.setState({
      modalPage: 2
    });

    const prevButton = component.find('.previousButton');

    assert.isTrue(prevButton.exists());
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
