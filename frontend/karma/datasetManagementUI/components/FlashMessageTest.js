import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import FlashMessage from 'datasetManagementUI/components/FlashMessage/FlashMessage';
import _ from 'lodash';

describe('components/FlashMessage', () => {
  const errorProps = {
    kind: 'error',
    message: 'Something went very, very wrong.',
    visible: true,
    onCloseClick: sinon.spy()
  };

  const successProps = {
    ...errorProps,
    kind: 'success',
    message: 'Things are great'
  }

  it('renders success flash when prop kind === sucesss', () => {
    const component = shallow(<FlashMessage {...successProps} />);
    expect(component.find('.success')).to.have.length(1);
  });

  it('renders error flash when prob error === error', () => {
    const component = shallow(<FlashMessage {...errorProps}/>);
    expect(component.find('.error')).to.have.length(1);
  });

  it('renders the message passed to it', () => {
    const component = shallow(<FlashMessage {...errorProps}/>);
    expect(component.childAt(2).text()).to.eq(errorProps.message);
  });

  it('renders a close button', () => {
    const component = shallow(<FlashMessage {...errorProps}/>);
    expect(component.find('SocrataIcon[name="close-2"]')).to.have.length(1);
  });

  it('calls onCloseClick callback when close button is clicked', () => {
    const component = mount(<FlashMessage {...errorProps}/>);
    component.find('.socrata-icon-close-2').simulate('click');
    expect(component.instance().props.onCloseClick.calledOnce).to.eq(true);
  });

  it('returns null if prop visible is falsey', () => {
    const visibleProps = {
      ...errorProps,
      visible: false
    };
    const component = shallow(<FlashMessage {...visibleProps}/>);
    assert.isNull(component.type());
  });
})
