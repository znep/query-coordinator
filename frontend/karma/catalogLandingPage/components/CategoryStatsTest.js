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

  it('renders a category stat for each item specified in the categoryStats object', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps());
    assert.lengthOf(element.querySelectorAll('.stat-item'), 3);
  });

  it('shows the correct data for each stat', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps());
    const statNames = element.querySelectorAll('.stat-name');
    const statCounts = element.querySelectorAll('.stat-count');

    assert.equal(statNames[0].textContent, 'Charts');
    assert.equal(statCounts[0].textContent, '2');
    assert.equal(statNames[1].textContent, 'Datasets');
    assert.equal(statCounts[1].textContent, '3');
    assert.equal(statNames[2].textContent, 'Maps');
    assert.equal(statCounts[2].textContent, '4');
  });

  it('uses a singular stat-name if there it has a value of 1', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps({
      categoryStats: {
        charts: 1,
        datasets: 1,
        maps: 1
      }
    }));
    const statNames = element.querySelectorAll('.stat-name');
    const statCounts = element.querySelectorAll('.stat-count');

    assert.equal(statNames[0].textContent, 'Chart');
    assert.equal(statCounts[0].textContent, '1');
    assert.equal(statNames[1].textContent, 'Dataset');
    assert.equal(statCounts[1].textContent, '1');
    assert.equal(statNames[2].textContent, 'Map');
    assert.equal(statCounts[2].textContent, '1');
  });

  it('only renders the category stats that do not have a value of 0', () => {
    const element = renderComponent(CategoryStats, categoryStatsProps({
      categoryStats: {
        charts: 0,
        datasets: 1,
        maps: 0
      }
    }));
    assert.lengthOf(element.querySelectorAll('.stat-item'), 1);
    assert.equal(element.querySelector('.stat-name').textContent, 'Dataset');
    assert.equal(element.querySelector('.stat-count').textContent, '1');
  });
});
