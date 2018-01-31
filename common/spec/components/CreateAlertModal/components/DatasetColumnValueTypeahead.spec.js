import _ from 'lodash';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import DatasetColumnValueTypeahead from 'common/components/CreateAlertModal/components/DatasetColumnValueTypeahead';
import InputDropDown from 'common/components/CreateAlertModal/components/InputDropDown';

describe('DatasetColumnValueTypeahead', () => {
  let onSelectSpy;
  let stubMatchingColumnValuesPromise;
  let stubTopValuesByColumnPromise;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      column: 'test',
      haveNbeView: false,
      typeaheadWaitTime: 0,
      viewId: 'test',
      onSelect: onSelectSpy
    });
  }

  beforeEach(() => {
    onSelectSpy = sinon.spy();
    stubMatchingColumnValuesPromise = sinon.stub(datasetApi, 'getMatchingColumnValues')
      .returns(Promise.resolve([]));
    stubTopValuesByColumnPromise = sinon.stub(datasetApi, 'getTopValuesByColumn')
      .returns(Promise.resolve([]));
  });

  afterEach(() => {
    stubMatchingColumnValuesPromise.restore();
    stubTopValuesByColumnPromise.restore();
  });

  it('renders an element', () => {
    const element = mount(<DatasetColumnValueTypeahead {...getProps()} />);

    assert.isDefined(element);
  });

  it('should call onInputChange function on InputDropDown change', () => {
    const element = mount(<DatasetColumnValueTypeahead {...getProps()} />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onInputChange();

    sinon.assert.calledOnce(onSelectSpy);
  });

  it('should call onSelect function on InputDropDown select', () => {
    const element = mount(<DatasetColumnValueTypeahead {...getProps()} />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onSelect();

    sinon.assert.calledOnce(onSelectSpy);
  });

  it('on load it should call getTopValuesByColumn query', () => {
    const props = getProps({ haveNbeView: false });
    const element = mount(<DatasetColumnValueTypeahead {...props } />);

    sinon.assert.calledOnce(stubTopValuesByColumnPromise);
  });

  it('on load it should not call getTopValuesByColumn query if dataset is NBE', () => {
    const props = getProps({ haveNbeView: true });
    const element = mount(<DatasetColumnValueTypeahead {...props } />);

    sinon.assert.notCalled(stubTopValuesByColumnPromise);
  });

  it('on input change it should call getColumnValues query if dataset is NBE', (done) => {
    const props = getProps({ haveNbeView: true });
    const element = mount(<DatasetColumnValueTypeahead {...props } />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onInputChange('abc');

    setTimeout(function() {
      sinon.assert.calledOnce(stubMatchingColumnValuesPromise);
      done();
    }, 0);
  });


  it('on input change it should not call getColumnValues query if dataset is NBE', () => {
    const props = getProps({ haveNbeView: false });
    const element = mount(<DatasetColumnValueTypeahead {...props } />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onInputChange('abc');

    sinon.assert.notCalled(stubMatchingColumnValuesPromise);
  });
});
