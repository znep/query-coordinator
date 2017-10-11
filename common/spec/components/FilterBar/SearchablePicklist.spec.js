import _ from 'lodash';
import $ from 'jquery';
import { Simulate } from 'react-dom/test-utils';

import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import { ENTER } from 'common/dom_helpers/keycodes';

import { renderComponent } from '../../helpers';
import SearchablePicklist from 'components/FilterBar/SearchablePicklist';
import { mockPicklistOptions } from './data';

describe('SearchablePicklist', () => {
  function getProps(props) {
    return _.defaults({}, props, {
      isLoading: false,
      options: mockPicklistOptions,
      value: '',
      hasSearchError: false,
      onChangeSearchTerm: _.noop,
      onSelection: _.noop,
      onBlur: _.noop
    });
  }

  function simulateTextInput(element, searchTerm = 'fuzzy bunnies') {
    const searchInput = getSearchInput(element);
    searchInput.value = searchTerm;
    Simulate.change(searchInput);
  }

  const getSearchInput = (element) => element.querySelector('.searchable-picklist-input');
  const getSearchButton = (element) => element.querySelector('.input-group-btn button');
  const getSearchLink = (element) => element.querySelector('.alert.info a');
  const getPicklist = (element) => element.querySelector('.picklist');
  const getSelectedOptions = (element) => element.querySelector('.searchable-picklist-selected-options');
  const getSearchInputSpinner = (element) => element.querySelector('.spinner-default');
  const getSearchWarning = (element) => element.querySelector('.alert.warning');
  const getSearchPrompt = (element) => element.querySelector('.alert.info');

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
  });

  afterEach(() => {
    I18n.translations = {};
  });

  it('renders an element', () => {
    const element = renderComponent(SearchablePicklist, getProps());
    assert.isNotNull(element);
  });

  describe('search input', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      assert.isNotNull(getSearchInput(element));
    });

    it('displays the value in the search input if provided', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        value: 'Pesto'
      }));
      assert.equal(getSearchInput(element).value, 'Pesto');
    });

    it('calls onChangeSearchTerm when the search input changes', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onChangeSearchTerm: stub
      }));
      const input = getSearchInput(element);

      input.value = 'Pizza';
      Simulate.change(input);

      sinon.assert.calledWith(stub, 'Pizza');
    });

    describe('when adding an arbitrary value using <ENTER>', () => {
      it('invokes canAddSearch with the value', (done) => {
        const searchTerm = 'fuzzy bunnies';
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => done()
        }));
        const searchInput = getSearchInput(element);

        searchInput.value = searchTerm;
        Simulate.keyPress(getSearchInput(element), { keyCode: ENTER });
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise(() => {
              _.defer(() => {
                assert.notDeepEqual(getSearchInputSpinner(element), null);
                done();
              });
            });
          }
        }));

        Simulate.keyPress(getSearchInput(element), { keyCode: ENTER });
      });

      it('hides the loading spinner after canAddSearchTerm resolves', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise((resolve) => {
              _.delay(resolve, 10);
              _.delay(() => assert.notDeepEqual(getSearchInputSpinner(element), null), 5);
              _.delay(() => {
                assert.deepEqual(getSearchInputSpinner(element), null);
                done();
              }, 15);
            });
          }
        }));

        Simulate.keyPress(getSearchInput(element), { keyCode: ENTER });
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return Promise.reject();
          }
        }));

        Simulate.keyPress(getSearchInput(element), { keyCode: ENTER });

        _.delay(() => {
          assert.notDeepEqual(getSearchWarning(element), null);
          done();
        }, 10);
      });
    });

    describe('when adding an arbitrary value using the search button', () => {
      it('invokes canAddSearch', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => done()
        }));
        simulateTextInput(element);

        Simulate.click(getSearchButton(element));
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise(() => {
              _.defer(() => {
                assert.notDeepEqual(getSearchInputSpinner(element), null);
                done();
              });
            });
          }
        }));

        Simulate.click(getSearchButton(element));
      });

      it('hides the loading spinner after canAddSearchTerm resolves', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise((resolve) => {
              _.delay(resolve, 10);
              _.delay(() => assert.notDeepEqual(getSearchInputSpinner(element), null), 5);
              _.delay(() => {
                assert.deepEqual(getSearchInputSpinner(element), null);
                done();
              }, 15);
            });
          }
        }));

        Simulate.click(getSearchButton(element));
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return Promise.reject();
          }
        }));

        Simulate.click(getSearchButton(element));

        _.delay(() => {
          assert.notDeepEqual(getSearchWarning(element), null);
          done();
        }, 10);
      });
    });

    describe('when adding an arbitrary value using the search link', () => {
      it('invokes canAddSearch', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => done()
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise(() => {
              _.defer(() => {
                assert.notDeepEqual(getSearchInputSpinner(element), null);
                done();
              });
            });
          }
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));
      });

      it('hides the loading spinner after canAddSearchTerm resolves', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return new Promise((resolve) => {
              _.delay(resolve, 10);
              _.delay(() => assert.notDeepEqual(getSearchInputSpinner(element), null), 5);
              _.delay(() => {
                assert.deepEqual(getSearchInputSpinner(element), null);
                done();
              }, 15);
            });
          }
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: () => {
            return Promise.reject();
          }
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));

        _.delay(() => {
          assert.notDeepEqual(getSearchWarning(element), null);
          done();
        }, 10);
      });
    });
  });

  describe('picklist', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      assert.isNotNull(getPicklist(element));
    });

    it('displays the no options message if no options are available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        options: []
      }));
      assert.isTrue($(element.querySelector('.alert')).hasClass('warning'));
    });

    it('displays the exact search prompt if input is entered', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      assert.equal(getSearchPrompt(element), null);

      simulateTextInput(element);
      assert.notEqual(getSearchPrompt(element), null);
    });

    it('hides the exact search prompt if input is removed', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      simulateTextInput(element);
      assert.notEqual(getSearchPrompt(element), null);

      simulateTextInput(element, '');
      assert.equal(getSearchPrompt(element), null);
    });

    it('hides the exact search prompt if the no options message is visible', (done) => {
      const element = renderComponent(SearchablePicklist, getProps({
        canAddSearchTerm: () => {
          return Promise.reject();
        }
      }));
      simulateTextInput(element);
      Simulate.click(getSearchLink(element));

      _.delay(() => {
        assert.notEqual(getSearchWarning(element), null);
        assert.equal(getSearchPrompt(element), null);
        done();
      }, 10);
    });

    it('highlights the value in the picklist if provided and available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        value: 'Pesto'
      }));
      const picklist = getPicklist(element);
      const selectedOption = picklist.querySelector('.picklist-option-selected');

      assert.equal(selectedOption.innerText, 'Pesto');
    });

    it('calls onSelection when a picklist option is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onSelection: stub
      }));
      const picklist = getPicklist(element);
      const option = picklist.querySelectorAll('.picklist-option');

      Simulate.click(option[1]);

      sinon.assert.calledWith(stub, {
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  });

  describe('selected values', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        selectedOptions: [{title: 'Pesto', value: 'Pesto'}]
      }));

      assert.isNotNull(getSelectedOptions(element));
    });

    it('does not render if selectedOptions is empty', () => {
      const element = renderComponent(SearchablePicklist, getProps());

      assert.isNull(getSelectedOptions(element));
    });

    it('calls onClickSelectedOption when a selectedOptions item is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onClickSelectedOption: stub,
        selectedOptions: [{
          title: 'Pesto',
          value: 'Pesto'
        }]
      }));

      const selectedOptions = getSelectedOptions(element);

      const option = selectedOptions.querySelectorAll('.picklist-option');

      Simulate.click(option[0]);

      sinon.assert.calledWith(stub, {
        group: 'Selected Values',
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  });
});
