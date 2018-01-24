import TestUtils from 'react-dom/test-utils';
import React, { Component } from 'react';
import { mount } from 'enzyme';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import SoqlBuilder from 'common/components/CreateAlertModal/components/SoqlBuilder';
import SoqlSliceBuilder from 'common/components/CreateAlertModal/components/SoqlBuilder/SoqlSliceBuilder';
import Spinner from 'common/components/Spinner';

describe('SoqlBuilder', () => {

  let getColumnsPromise;
  let getMigrationPromise;

  beforeEach(() => {
    getColumnsPromise = sinon.stub(datasetApi, 'getColumns').returns(Promise.resolve({ status: 200 }));
    getMigrationPromise = sinon.stub(datasetApi, 'getMigration').returns(Promise.resolve({ status: 200 }));
  });

  afterEach(() => {
    getColumnsPromise.restore();
    getMigrationPromise.restore();
  });


  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<SoqlBuilder viewId="abcd-dcba" />);
    assert.isDefined(element);
  });

  it('on load it should call get columns, migration query', () => {
    const spy = sinon.spy();
    const element = mount(<SoqlBuilder viewId="abcd-dcba" />);
    sinon.assert.calledOnce(getColumnsPromise);
    sinon.assert.calledOnce(getMigrationPromise);
  });

  it('should show spinner untill dataset query complete', () => {
    const spy = sinon.spy();
    const element = mount(<SoqlBuilder viewId="abcd-dcba" />);
    element.setState({ isDataLoading: true });
    assert.lengthOf(element.find(Spinner), 1);
  });

  it('should render query builder after dataset query complete', () => {
    const spy = sinon.spy();
    const element = mount(<SoqlBuilder viewId="abcd-dcba" soqlSlices={[{}]} />);
    element.setState({ isDataLoading: false });
    assert.lengthOf(element.find(SoqlSliceBuilder), 1);
  });

  it('should renders with add parameter button', () => {
    const element = mount(<SoqlBuilder viewId="abcd-dcba" />);
    element.setState({ isDataLoading: false });
    assert.equal(element.find('.add-parameter-button').length, 1);
  });

  it('should call onSoqlChange on add parameter button click', () => {
    const soqlChange = sinon.spy();
    const element = mount(<SoqlBuilder viewId="abcd-dcba" onSoqlChange={soqlChange} />);
    element.setState({ isDataLoading: false });
    element.find('.add-parameter-button').simulate('click');
    sinon.assert.calledOnce(soqlChange);
  });
});
