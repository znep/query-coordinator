import { assert } from 'chai';
import { MetricCard } from 'components/MetricCard';

describe('MetricCard', () => {
  const getProps = (props) => {
    return {
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(MetricCard, getProps());
    assert.ok(element);
  });
});
