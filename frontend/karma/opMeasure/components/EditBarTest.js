import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';

import { EditBar as SocrataComponentsEditBar } from 'common/components';

import { EditBar } from 'components/EditBar';

describe('EditBar', () => {
  const getProps = (props) => {
    return {
      name: 'Test Measure',
      ...props
    };
  };

  it('renders', () => {
    const element = shallow(<EditBar {...getProps()} />);
    assert.ok(element);
  });

  it('behaves like a standard edit bar', () => {
    const element = shallow(<EditBar {...getProps()} />);
    const standardElement = element.find(SocrataComponentsEditBar);
    assert.isTrue(standardElement.exists());
    assert.equal(standardElement.dive().find('.page-name').text(), 'Test Measure');
  });

  describe('preview button', () => {
    let props;
    let element;

    const getPreviewButton = (element) => element.find('.btn-preview');

    beforeEach(() => {
      props = { onClickPreview: sinon.spy() };
      element = shallow(<EditBar {...getProps(props)} />);
    });

    it('renders', () => {
      assert.isTrue(getPreviewButton(element).exists());
    });

    it('invokes onClickPreview on click', () => {
      getPreviewButton(element).simulate('click');
      sinon.assert.calledOnce(props.onClickPreview);
    });
  });

  describe('edit button', () => {
    let props;
    let element;

    const getEditButton = (element) => element.find('.btn-edit');

    beforeEach(() => {
      props = { onClickEdit: sinon.spy() };
      element = shallow(<EditBar {...getProps(props)} />);
    });

    it('renders', () => {
      assert.isTrue(getEditButton(element).exists());
    });

    it('invokes onClickEdit on click', () => {
      getEditButton(element).simulate('click');
      sinon.assert.calledOnce(props.onClickEdit);
    });
  });
});
