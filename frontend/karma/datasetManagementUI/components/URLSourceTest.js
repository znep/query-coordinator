import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import URLSource from 'datasetManagementUI/components/URLSource/URLSource';

describe('components/URLSource', () => {
  const spy = sinon.spy();

  const fakePromise = () =>
    new Promise((res, rej) => {
      spy();

      res('good');
    });

  const fakeEvent = {
    preventDefault: () => {},
    stopPropagation: () => {}
  };

  const component = shallow(<URLSource hrefExists={false} createURLSource={fakePromise} />);

  it('calls StartImport when button is clicked', () => {
    component.find('Connect(ApiCallButton)').simulate('click', fakeEvent);

    assert.isTrue(spy.calledOnce);
  });

  it('displays an error message if an error is present', () => {
    component.setState({ error: 'bad things' });

    assert.isTrue(component.find('.errorMessage').exists());
  });
});
