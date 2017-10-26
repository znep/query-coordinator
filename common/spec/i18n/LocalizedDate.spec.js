import { assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import Localization from 'common/i18n/components/Localization';
import LocalizedDate from 'common/i18n/components/LocalizedDate';

describe('LocalizedDate', () => {
  const locale = 'en';
  const translations = {};
  const date = new Date(2017, 2, 22);

  const renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

  it('should render localized date in span', () => {
    const component = (
      <Localization translations={translations} locale="en">
        <LocalizedDate date={date} />
      </Localization>
    );

    const output = renderComponent(component);

    assert.equal(output.textContent, 'March 22, 2017');
  });

  describe('should render with time', () => {
    it('without seconds', () => {
      const component = (
        <Localization translations={translations} locale="en">
          <LocalizedDate date={date} withTime />
        </Localization>
      );

      const output = renderComponent(component);

      assert.equal(output.textContent, 'March 22, 2017 12:00 AM');
    });

    it('with seconds', () => {
      const component = (
        <Localization translations={translations} locale="en">
          <LocalizedDate date={date} withTime includeSeconds />
        </Localization>
      );

      const output = renderComponent(component);

      assert.equal(output.textContent, 'March 22, 2017 12:00:00 AM');
    });
  });

});
