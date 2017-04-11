import { expect, assert } from 'chai';

import Localization from 'components/Localization/Localization';
import LocalizedDate from 'components/Localization/LocalizedDate';

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

    expect(output.textContent).to.eq('March 22, 2017');
  });
});
