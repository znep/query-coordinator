import { Manager } from 'components/Manager';
import _ from 'lodash';

describe('components/Manager', () => {
  const getProps = (props = {}) => {
    return {
      category: 'Fun',
      categoryStats: {
        datasets: 2,
        charts: 1
      },
      featuredContent: {
        item0: { position: 0, name: 'featured fun thing' }
      },
      header: {
        headline: 'Some fun stuff',
        description: 'Some stuff that is fun',
        showStats: true
      },
      toggleStats: _.noop,
      updateDescription: _.noop,
      updateHeadline: _.noop,
      ...props
    };
  };

  it('renders a Manager', () => {
    const element = renderComponentWithStore(Manager, getProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'clp-manager');
  });

  it('renders a header', () => {
    const element = renderComponentWithStore(Manager, getProps());
    assert.isNotNull(element.querySelector('h1.header'));
  });

  describe('headline input', () => {
    it('renders', () => {
      const element = renderComponentWithStore(Manager, getProps());
      assert.isNotNull(element.querySelector('input.text-input.input-headline'));
    });

    it('calls updateHeadline when changed', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(Manager, getProps({
        updateHeadline: spy
      }));

      TestUtils.Simulate.change(element.querySelector('.input-headline'), { value: 'wu tang' });

      sinon.assert.called(spy);
    });
  });

  describe('description input', () => {
    it('renders', () => {
      const element = renderComponentWithStore(Manager, getProps());
      assert.isNotNull(element.querySelector('input.text-input.input-description'));
    });

    it('calls updateDescription when changed', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(Manager, getProps({
        updateDescription: spy
      }));

      TestUtils.Simulate.change(element.querySelector('.input-description'), { value: 'wu tang' });

      sinon.assert.called(spy);
    });
  });

  describe('stats checkbox', () => {
    it('renders', () => {
      const element = renderComponentWithStore(Manager, getProps());
      assert.isNotNull(element.querySelector('div.show-stats'));
    });

    it('calls toggleStats when changed', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(Manager, getProps({
        toggleStats: spy
      }));

      TestUtils.Simulate.change(element.querySelector('.show-stats input#showStats'), { checked: true });

      sinon.assert.called(spy);
    });
  });
});