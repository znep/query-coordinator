import { StatCounts } from 'components/StatCounts';

describe('components/StatCounts', () => {
  const statCountsProps = (options = {}) => ({
    categoryStats: {
      charts: 2,
      datasets: 3,
      maps: 4,
    },
    ...options
  });

  it('does not render if there is nothing in the categoryStats prop', () => {
    const element = renderComponent(StatCounts, statCountsProps({ categoryStats: {} }));
    assert.isNull(element);
  });

  it('does not render if everything in categoryStats has a value of 0', () => {
    const element = renderComponent(StatCounts, statCountsProps({
      categoryStats: {
        charts: 0,
        datasets: 0,
        maps: 0
      }
    }));
    assert.isNull(element);
  });

  it('renders a stat for each item specified in the categoryStats prop', () => {
    const element = renderComponent(StatCounts, statCountsProps());
    assert.equal(element.className, 'stat-counts');
    assert.lengthOf(element.querySelectorAll('.stat-item'), 3);
  });

  it('shows the correct data for each stat', () => {
    const element = renderComponent(StatCounts, statCountsProps());
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
    const element = renderComponent(StatCounts, statCountsProps({
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

  it('only renders the stats that do not have a value of 0', () => {
    const element = renderComponent(StatCounts, statCountsProps({
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
