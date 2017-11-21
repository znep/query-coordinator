import sinon from 'sinon';
import { expect, assert } from 'chai';
import { Manager } from 'components/Manager';
import _ from 'lodash';

describe('components/Manager', () => {
  const getProps = (props = {}) => {
    return {
      catalogPath: '/browse',
      catalogQuery: { custom_path: '/browse' },
      featuredContent: {
        item0: { position: 0, name: 'featured fun thing' }
      },
      header: {
        headline: 'Some fun stuff',
        description: 'Some stuff that is fun'
      },
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
    it('renders a textarea tag', () => {
      const element = renderComponentWithStore(Manager, getProps());
      assert.isNotNull(element.querySelector('textarea.text-input.input-description'));
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

  describe('header', () => {
    it('does not specify a filter when managing /browse', () => {
      const element = renderComponentWithStore(Manager, getProps({
        catalogQuery: { custom_path: '/browse' }
      }));
      assert.equal(element.querySelector('.header span').textContent, 'Feature Content');
    });

    it('specifies a category filter', () => {
      const element = renderComponentWithStore(Manager, getProps({
        catalogQuery: { category: 'Fun' }
      }));
      assert.equal(element.querySelector('.header span').textContent, 'Feature Content for Fun');
    });

    it('specifies a view type filter', () => {
      const element = renderComponentWithStore(Manager, getProps({
        catalogQuery: { limitTo: 'charts' }
      }));
      assert.equal(element.querySelector('.header span').textContent, 'Feature Content for Charts');
    });

    it('specifies a custom metadata filter', () => {
      const element = renderComponentWithStore(Manager, getProps({
        catalogQuery: { '1980sMovies': 'Predator' }
      }));
      assert.equal(element.querySelector('.header span').textContent, 'Feature Content for Predator');
    });
  });
});
