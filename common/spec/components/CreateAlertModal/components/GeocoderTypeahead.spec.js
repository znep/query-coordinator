import _ from 'lodash';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import datasetApi from 'common/components/CreateAlertModal/api/datasetApi';
import GeocoderTypeahead from 'common/components/CreateAlertModal/components/GeocoderTypeahead';
import InputDropDown from 'common/components/CreateAlertModal/components/InputDropDown';

describe('GeocoderTypeahead', () => {
  let onSelectSpy;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      mapboxAccessToken: 'TEST_MAPBOX_ACCESS_TOKEN',
      typeaheadWaitTime: 0,
      onSelect: onSelectSpy
    });
  }

  beforeEach(() => {
    onSelectSpy = sinon.spy();
  });

  it('renders an element', () => {
    const element = mount(<GeocoderTypeahead {...getProps()} />);
    assert.isDefined(element);
  });

  it('should call onInputChange function on GeoSearch input change', () => {
    const element = mount(<GeocoderTypeahead {...getProps()} />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onInputChange();

    sinon.assert.calledOnce(onSelectSpy);
  });

  it('should call onSelect function on GeoSearch result select', () => {
    const element = mount(<GeocoderTypeahead {...getProps()} />);
    const inputDropDown = element.find(InputDropDown);

    inputDropDown.props().onSelect();

    sinon.assert.calledOnce(onSelectSpy);
  });

  describe('Geo Search', () => {
    it('on input change it should call geo query', (done) => {
      const geoSearchPromise = sinon.stub(datasetApi, 'geoSearch')
        .returns(Promise.resolve([]));
      const element = mount(<GeocoderTypeahead {...getProps()} />);
      const inputDropDown = element.find(InputDropDown);

      inputDropDown.props().onInputChange('abc');

      setTimeout(function() {
        sinon.assert.calledOnce(geoSearchPromise);
        geoSearchPromise.restore();
        done();
      }, 0);
    });

    it('on input change it should not call geo query if input is empty', () => {
      const geoSearchPromise = sinon.stub(datasetApi, 'geoSearch')
        .returns(Promise.resolve([]));
      const element = mount(<GeocoderTypeahead {...getProps()} />);
      const inputDropDown = element.find(InputDropDown);

      inputDropDown.props().onInputChange();

      sinon.assert.notCalled(geoSearchPromise);
      geoSearchPromise.restore();
    });
  });
});
