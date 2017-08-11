import { assert } from 'chai';
import { ReportingPeriodSelector } from 'components/ReportingPeriodSelector';

describe('ReportingPeriodSelector', () => {
  const getProps = (props) => {
    return {
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(ReportingPeriodSelector, getProps());
    assert.ok(element);
  });
});
