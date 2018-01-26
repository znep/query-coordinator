import _ from 'lodash';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import CustomAlert from 'common/components/CreateAlertModal/CustomAlert';
import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import SoqlBuilder from 'common/components/CreateAlertModal/components/SoqlBuilder';

describe('CustomAlert', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      mapboxAccessToken: 'Mapbox-Access-Token',
      viewId: 'abcd-efgh'
    });
  }

  it('renders an element', () => {
    const element = mount(<CustomAlert {...getProps()} />);

    assert.isDefined(element);
  });

  it('should render alert breadcrumbs', () => {
    const element = mount(<CustomAlert {...getProps()} />);

    assert.lengthOf(element.find('.alert-breadcrumbs'), 1);
  });

  describe('Alert Type Page', () => {
    const props = getProps({ customAlertPage: 'alertType' });

    it('should render page with alert type content', () => {
      const element = mount(<CustomAlert {...props} />);

      element.setState({ isDataLoading: false });
      assert.equal(element.find('.alert-type-page').length, 1);
    });

    it('should render page with threshold alert type select option', () => {
      const element = mount(<CustomAlert {...props} />);

      element.setState({ isDataLoading: false });
      assert.equal(element.find('.threshold-option').length, 1);
    });
  });

  describe('Alert Parameter Page', () => {
    let getColumnsPromise;
    let getMigrationPromise;
    window.serverConfig.mapboxAccessToken = 'Mapbox-Access-Token';

    beforeEach(() => {
      getColumnsPromise = sinon.stub(datasetApi, 'getColumns').returns(Promise.resolve({ status: 200 }));
      getMigrationPromise = sinon.stub(datasetApi, 'getMigration').returns(Promise.resolve({ status: 200 }));
    });

    afterEach(() => {
      getColumnsPromise.restore();
      getMigrationPromise.restore();
    });

    it('should render soql builder', () => {
      const props = getProps({
        customAlertPage: 'parameters',
        customAlertType: 'entire_data',
        customAlert: []
      });
      const element = mount(<CustomAlert {...props} />);
      element.setState({ isDataLoading: false, customAlert: [] });
      assert.lengthOf(element.find(SoqlBuilder), 1);
    });
  });

  describe('Alert Trigger Page', () => {
    const props = getProps({
      customAlertPage: 'trigger',
      customAlert: []
    });

    it('should render page with alert trigger content', () => {
      const element = mount(<CustomAlert {...props} />);

      element.setState({ isDataLoading: false });

      assert.equal(element.find('.alert-trigger-page').length, 1);
    });

    it('should render trigger content with rolling query option', () => {
      const element = mount(<CustomAlert {...props} />);

      element.setState({ isDataLoading: false });

      assert.equal(element.find('.rolling-query').length, 1);
    });
  });
});
