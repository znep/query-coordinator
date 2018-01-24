import { assert } from 'chai';
import Footer from 'adminActivityFeedSoql/components/Footer';
import testStore from '../testStore';
import mockTranslations from '../mockTranslations';

describe('Footer', () => {

  describe('with 0 result', () => {
    const store = testStore({
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 0
      }
    });
    const element = renderComponentWithLocalization(Footer, {}, store);

    it('renders empty page controls', () => {
      assert.equal(element.querySelector('.pager').textContent.length, 0);
    });

    it('renders "no results" text', () => {
      assert.equal(element.querySelector('.result-count').textContent, mockTranslations.no_results);
    });
  });

  describe('with a single result', () => {

    const store = testStore({
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 1
      }
    });
    const element = renderComponentWithLocalization(Footer, {}, store);

    it('renders empty page controls', () => {
      assert.equal(element.querySelector('.pager').textContent.length, 0);
    });

    it('renders result label for single result', () => {
      const testTranslation = mockTranslations.result_count.one.
        replace('%{first}', '1').
        replace('%{last}', '1');

      assert.equal(
        element.querySelector('.result-count').textContent,
        testTranslation
      );
    });
  });

  describe('with a result set lower than max page size', () => {

    const store = testStore({
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 5
      }
    });
    const element = renderComponentWithLocalization(Footer, {}, store);

    it('renders empty page controls', () => {
      assert.equal(element.querySelector('.pager').textContent.length, 0);
    });

    it('renders result label for multiple result', () => {
      const testTranslation = mockTranslations.result_count.other.
        replace('%{first}', '1').
        replace('%{last}', '5').
        replace('%{count}', '5');

      assert.equal(
        element.querySelector('.result-count').textContent,
        testTranslation
      );
    });

  });

  describe('with a result set more than max page size', () => {
    const store = testStore({
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 25
      }
    });
    const element = renderComponentWithLocalization(Footer, {}, store);

    it('renders page controls', () => {
      assert.isAbove(element.querySelector('.pager').textContent.length, 0);
    });

    it('renders result label for multiple result', () => {
      const testTranslation = mockTranslations.result_count.other.
      replace('%{first}', '1').
      replace('%{last}', '10').
      replace('%{count}', '25');

      assert.equal(
        element.querySelector('.result-count').textContent,
        testTranslation
      );
    });
  });

});
