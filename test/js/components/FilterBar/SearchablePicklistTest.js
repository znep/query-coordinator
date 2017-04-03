import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import SearchablePicklist from 'components/FilterBar/SearchablePicklist';
import { ENTER } from 'common/keycodes';
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

  function simulateTextInput(element, searchTerm = "fuzzy bunnies") {
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

  it('renders an element', () => {
    const element = renderComponent(SearchablePicklist, getProps());
    expect(element).to.exist;
  });

  describe('search input', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      expect(getSearchInput(element)).to.exist;
    });

    it('displays the value in the search input if provided', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        value: 'Pesto'
      }));
      expect(getSearchInput(element).value).to.equal('Pesto');
    });

    it('calls onChangeSearchTerm when the search input changes', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onChangeSearchTerm: stub
      }));
      const input = getSearchInput(element);

      input.value = 'Pizza';
      Simulate.change(input);

      expect(stub).to.have.been.calledWith('Pizza');
    });

    describe('when adding an arbitrary value using <ENTER>', () => {
      it('invokes canAddSearch with the value', (done) => {
        const searchTerm = 'fuzzy bunnies';
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => done()
        }));
        const searchInput = getSearchInput(element);

        searchInput.value = searchTerm;
        Simulate.keyUp(getSearchInput(element), { keyCode: ENTER });
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.defer(() => {
                expect(getSearchInputSpinner(element)).to.not.eq(null);
                done();
              });
            });
          }
        }));

        Simulate.keyUp(getSearchInput(element), { keyCode: ENTER });
      });

      it('hides the loading spinner after canAddSearchTerm resolves', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.delay(resolve, 10);
              _.delay(() => expect(getSearchInputSpinner(element)).to.not.eq(null), 5);
              _.delay(() => {
                expect(getSearchInputSpinner(element)).to.eq(null);
                done();
              }, 15)
            });
          }
        }));

        Simulate.keyUp(getSearchInput(element), { keyCode: ENTER });
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return Promise.reject();
          }
        }));

        Simulate.keyUp(getSearchInput(element), { keyCode: ENTER });

        _.delay(() => {
          expect(getSearchWarning(element)).to.not.eq(null);
          done();
        }, 10);
      });
    });

    describe('when adding an arbitrary value using the search button', () => {
      it('invokes canAddSearch', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => done()
        }));
        simulateTextInput(element);

        Simulate.click(getSearchButton(element));
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.defer(() => {
                expect(getSearchInputSpinner(element)).to.not.eq(null);
                done();
              });
            });
          }
        }));

        Simulate.click(getSearchButton(element));
      });

      it('hides the loading spinner after canAddSearchTerm resolves', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.delay(resolve, 10);
              _.delay(() => expect(getSearchInputSpinner(element)).to.not.eq(null), 5);
              _.delay(() => {
                expect(getSearchInputSpinner(element)).to.eq(null);
                done();
              }, 15)
            });
          }
        }));

        Simulate.click(getSearchButton(element));
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return Promise.reject();
          }
        }));

        Simulate.click(getSearchButton(element));

        _.delay(() => {
          expect(getSearchWarning(element)).to.not.eq(null);
          done();
        }, 10);
      });
    });

    describe('when adding an arbitrary value using the search link', () => {
      it('invokes canAddSearch', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => done()
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));
      });

      it('adds a loading spinner', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.defer(() => {
                expect(getSearchInputSpinner(element)).to.not.eq(null);
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
          canAddSearchTerm: (term) => {
            return new Promise((resolve, reject) => {
              _.delay(resolve, 10);
              _.delay(() => expect(getSearchInputSpinner(element)).to.not.eq(null), 5);
              _.delay(() => {
                expect(getSearchInputSpinner(element)).to.eq(null);
                done();
              }, 15)
            });
          }
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));
      });

      it('shows an error if the search term cannot be added', (done) => {
        const element = renderComponent(SearchablePicklist, getProps({
          canAddSearchTerm: (term) => {
            return Promise.reject();
          }
        }));
        simulateTextInput(element);

        Simulate.click(getSearchLink(element));

        _.delay(() => {
          expect(getSearchWarning(element)).to.not.eq(null);
          done();
        }, 10);
      });
    });
  });

  describe('picklist', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      expect(getPicklist(element)).to.exist;
    });

    it('displays the no options message if no options are available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        options: []
      }));
      expect(element.querySelector('.alert')).to.have.class('warning');
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
        canAddSearchTerm: (term) => {
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

      expect(selectedOption.innerText).to.equal('Pesto');
    });

    it('calls onSelection when a picklist option is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onSelection: stub
      }));
      const picklist = getPicklist(element);
      const option = picklist.querySelectorAll('.picklist-option');

      Simulate.click(option[1]);

      expect(stub).to.have.been.calledWith({
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  });

  describe('selected values', () => {
    it('renders', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        selectedOptions: [{title: 'Pesto', value: 'Pesto'}]
      }));

      expect(getSelectedOptions(element)).to.exist;
    });

    it('does not render if selectedOptions is empty', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps());

      expect(getSelectedOptions(element)).to.not.exist;
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

      expect(stub).to.have.been.calledWith({
        group: "Selected Values",
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  })
});
