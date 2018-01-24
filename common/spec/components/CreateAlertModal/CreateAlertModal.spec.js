import TestUtils from 'react-dom/test-utils';
import React, { Component } from 'react';
import { mount } from 'enzyme';

import AdvancedAlertFooter from 'common/components/CreateAlertModal/AdvancedAlert/AdvancedAlertFooter';
import CreateAlertModal from 'common/components/CreateAlertModal';
import CustomAlertFooter from 'common/components/CreateAlertModal/CustomAlert/CustomAlertFooter';
import DeleteAlert from 'common/components/CreateAlertModal/DeleteAlert';
import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import Tabs from 'common/components/CreateAlertModal/components/Tabs';


describe('CreateAlertModal', () => {
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

  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} />);
    assert.isDefined(element);
  });

  it('should renders an Modal with name, query inputs', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} />);
    assert.lengthOf(element.find('.create-alert-modal-container'), 1);
  });

  it('should call onClose method while dismiss', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} />);
    element.find('.modal-header-dismiss').simulate('click');
    sinon.assert.calledOnce(spy);
  });

  it('should rednder delete view content', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} selectedTab="advance_alert" />);
    element.setState({ showDeleteAlertPage: true });
    assert.lengthOf(element.find(DeleteAlert), 1);
  });

  describe('Advance Alert', () => {
    it('should show the Advance Alert content and Footer', () => {
      const spy = sinon.spy();
      let element = mount(<CreateAlertModal onClose={spy} />);
      element.setState({ selectedTab: 'advancedAlert' });
      assert.isTrue(element.find('.advance-alert').exists());
      assert.lengthOf(element.find(AdvancedAlertFooter), 1);
    });
  });

  describe('Custom Alert', () => {
    it('should show the custom Alert content and Footer', () => {
      const spy = sinon.spy();
      let element = mount(<CreateAlertModal onClose={spy} />);
      element.setState({ selectedTab: 'customAlert' });
      assert.isTrue(element.find('.custom-alert').exists());
      assert.lengthOf(element.find(CustomAlertFooter), 1);
    });
  });

});
