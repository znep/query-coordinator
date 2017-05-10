import { expect, assert } from 'chai';
import { CategoryStats } from 'components/CategoryStats';

describe('components/CategoryStats', () => {
  const categoryStatsProps = (options = {}) => ({
    categoryStats: {
      charts: 2,
      datasets: 3,
      maps: 4
    },
    showStats: true,
    ...options
  });

  it('does not render if showStats is false', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps({ showStats: false }));
    assert.isNull(element);
  });

  it('does not render if there is nothing in the categoryStats', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps({ categoryStats: {} }));
    assert.isNull(element);
  });

  it('does not render if everything in categoryStats has a value of 0', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps({
      categoryStats: {
        charts: 0,
        datasets: 0,
        maps: 0
      }
    }));
    assert.isNull(element);
  });

  it('renders with a stats-title and stat-counts', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps());
    assert.equal(element.className, 'catalog-landing-page-stats');
    assert.isNotNull(element.querySelector('.stats-title'));
    assert.isNotNull(element.querySelector('.stat-counts'));
  });
});
