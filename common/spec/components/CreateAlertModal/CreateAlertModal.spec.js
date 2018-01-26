import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

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

  it('should render a modal with name & query input fields', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} />);

    assert.lengthOf(element.find('.create-alert-modal-container'), 1);
  });

  it('should call onClose method on modal dismiss', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} />);

    element.find('.modal-header-dismiss').simulate('click');

    sinon.assert.calledOnce(spy);
  });

  it('should render delete view content in delete mode', () => {
    const spy = sinon.spy();
    const element = mount(<CreateAlertModal onClose={spy} selectedTab="advance_alert" />);

    element.setState({ showDeleteAlertPage: true });

    assert.lengthOf(element.find(DeleteAlert), 1);
  });

  describe('Advanced Alert', () => {
    it('should show the Advanced Alert content and footer', () => {
      const spy = sinon.spy();
      const element = mount(<CreateAlertModal onClose={spy} />);

      element.setState({ selectedTab: 'advancedAlert' });

      assert.isTrue(element.find('.advance-alert').exists());
      assert.lengthOf(element.find(AdvancedAlertFooter), 1);
    });
  });

  describe('Custom Alert', () => {
    it('should show the Custom Alert content and footer', () => {
      const spy = sinon.spy();
      const element = mount(<CreateAlertModal onClose={spy} />);

      element.setState({ selectedTab: 'customAlert' });

      assert.isTrue(element.find('.custom-alert').exists());
      assert.lengthOf(element.find(CustomAlertFooter), 1);
    });
  });

});
