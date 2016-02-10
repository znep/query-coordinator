import React from 'react';
import $ from 'jquery';
import FlannelUtils from '../../flannel/flannel';
import './autocompletefilter.scss';

class SocrataAutocompletefilter extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      options: [],
      selected: [],
      searchinput: '',
      activeIndex: undefined
    };

    this.onChangeSearchInput = this.onChangeSearchInput.bind(this);
    this.onClickSuggestion = this.onClickSuggestion.bind(this);
    this.onClickDeleteSelected = this.onClickDeleteSelected.bind(this);

    this.handleKeyboardEvents = this.handleKeyboardEvents.bind(this);
  }

  componentDidMount() {
    this.fetchSuggestions();
    this.refs.searchinput.focus();

    var text = window.location.pathname;
    this.urlSections = text.split('/');
    this.fourByFour = this.urlSections[2];

    var $component = $('#qf-' + this.props.componentId);

    $component.find('.searchInput').on('focusin', function() {
      if (!$component.find('.search-icon').hasClass('is-active-focus')) {
        $component.find('.search-icon').addClass('is-active-focus');
      }
    });
    $component.find('.searchInput').on('focusout', function() {
      if ($component.find('.search-icon').hasClass('is-active-focus')) {
        $component.find('.search-icon').removeClass('is-active-focus');
      }
    });

    FlannelUtils.showOverlay();
  }

  formattedLabel() {
    var valuePresenter;

    if (this.state.selected.length > 1) {
      valuePresenter = '(' + this.state.selected.length + ' selected)';
    } else if (this.state.selected.length === 1) {
      valuePresenter = this.state.selected[0].text + ' selected';
    } else {
      valuePresenter = '(all values)';
    }
    return valuePresenter;
  }

  fetchSuggestions(newSuggestionText) {
    var newSuggestions = newSuggestionText || '';
    var suggestionUrl = 'https://dataspace.demo.socrata.com/views/' +
      this.props.datasetId + '/columns/' +
      this.props.dataColumn + '/suggest/' +
      newSuggestions + '?size=11';

    /*
     this.props.domain + '/views/' +
     https://opendata-demo.test-socrata.com/views/3q2y-nhw8/columns/job_title/suggest/' + newSuggestionText + '?size=11
     https://dataspace.demo.socrata.com/views/qfph-stuu/columns/country/suggest/a?size=11
    */

    this.setState({ requesting: true });

    var self = this;
    $.ajax({
      method: 'GET',
      url: suggestionUrl
    }).success(function(result) {
      self.setState({
        requesting: false,
        options: result.options,
        activeIndex: undefined
      });
      //self.props.requestSuccess = true;
    }).error(function() {
      //self.props.requestSuccess = false;
      self.setState({
        requesting: true,
        options: [],
        activeIndex: undefined
      });
    });
  }

  getArrayItemIndexByText(selectedObj, scopeArray) {
    for (var i = scopeArray.length - 1; i >= 0; i--) {
      if (scopeArray[i].text == selectedObj.text) {
        return i;
      }
    }
  }
  checkActive(index) {
    if (index == this.state.activeIndex) {
      return ' is-active';
    } else {
      return '';
    }
  }
  makeItemActive(index) {
    this.setState({ activeIndex: index });
  }

  onChangeSearchInput(e) {
    if (e.target.value.length > 0 && $(e.target).siblings('.clearSuggestion').hasClass('hidden')) {
      $(e.target).siblings('.clearSuggestion').removeClass('hidden');
    } else if (e.target.value.length == 0 && !$(e.target).siblings('.clearSuggestion').hasClass('hidden')) {
      $(e.target).siblings('.clearSuggestion').addClass('hidden');
    }

    this.setState({ searchinput: e.target.value});
    this.fetchSuggestions(e.target.value);
  }
  onClickClearSearchInput() {
    this.refs.searchinput.value = '';
    this.setState({ searchinput: '' });
    this.fetchSuggestions();
  }
  onClickSuggestion(suggestionObj, idx) {
    var aOptions = this.state.options;
    aOptions.splice(idx, 1);
    var aSelecteds = this.state.selected;
    aSelecteds.push(suggestionObj);

    this.setState({
      options: aOptions,
      selected: aSelecteds
    }, ()=> {
      this.refs.searchinput.focus();

      var bool = (aSelecteds.length > 0) ? true : false;
      this.props.dataHandler(this.formattedLabel(), aSelecteds, bool, true);
    });

  }
  onClickDeleteSelected(selectedObj) {
    // delete from filters list
    var aOptions = this.state.options;
    var aSelecteds = this.state.selected;

    var selectedIndex = this.getArrayItemIndexByText(selectedObj, aSelecteds);

    aSelecteds.splice(selectedIndex, 1);
    aOptions.push(selectedObj);
    aOptions = _.sortByOrder(aOptions, 'text', 'asc');

    this.setState({
      selected: aSelecteds,
      options: aOptions
    });

    this.refs.searchinput.focus();

    var bool = (aSelecteds.length > 0) ? true : false;
    this.props.dataHandler(this.formattedLabel(), aSelecteds, bool, true);
  }

  handleKeyboardEvents(e) {
    var activeIndex, activeItemOffset, currentScrollPosition;

    if (e.keyCode == 40) {
      e.preventDefault();
      activeIndex = this.state.activeIndex >= 0 ? Number(this.state.activeIndex) + 1 : 0; // going down

      if (typeof this.state.options[activeIndex] != 'undefined') {
        this.setState({
          activeIndex: activeIndex,
          searchinput: this.state.options[activeIndex].text
        });

        if (activeIndex < this.state.options.length) {
          activeItemOffset =
          $('.mod-socrata-autocomplete-lists-suggestions-listitem:nth-child(' + (activeIndex + 1) + ')').
            offset().top;

          if (activeItemOffset > (200 + $('.mod-socrata-autocomplete-lists-filter-list').height())) {
            currentScrollPosition = $('.mod-socrata-autocomplete-lists-suggestions-list').scrollTop();
            $('.mod-socrata-autocomplete-lists-suggestions-list').scrollTop(currentScrollPosition + 10);
          }
        }
      }

    } else if (e.keyCode == 38) {
      e.preventDefault();
      activeIndex = this.state.activeIndex >= 0 ? Number(this.state.activeIndex) - 1 : 0; // going up

      if (typeof this.state.options[activeIndex] != 'undefined') {
        this.setState({
          activeIndex: activeIndex,
          searchinput: this.state.options[activeIndex].text
        });

        if (activeIndex < this.state.options.length) {
          activeItemOffset =
          $('.mod-socrata-autocomplete-lists-suggestions-listitem:nth-child(' + (activeIndex + 1) + ')').offset().top;
          currentScrollPosition = $('.mod-socrata-autocomplete-lists-suggestions-list').scrollTop();
          $('.mod-socrata-autocomplete-lists-suggestions-list').scrollTop(currentScrollPosition - 10);
          if (activeItemOffset < ($('.mod-socrata-autocomplete-lists-filter-list').height())) {
            // if offset value lower
          }
        }
      }
    } else if (e.keyCode == 13) {
      var duplicate = false;
      var aFilters = [];
      var aOptions = this.state.options;

      if (this.state.activeIndex) {
        for (var i = this.state.selected.length - 1; i >= 0; i--) {
          if (this.state.selected[i].text == this.state.options[this.state.activeIndex].text) {
            duplicate = true;
          }
        }

        if (!duplicate) {
          aFilters = this.state.selected;
          aFilters.push(this.state.options[this.state.activeIndex]);
          aOptions.splice(this.state.activeIndex, 1);

          this.setState({
            options: aOptions,
            selected: aFilters
          });
        }
      } else {
        for (var j = this.state.selected.length - 1; j >= 0; j--) {
          if (this.state.selected[j].text == this.state.options[this.state.activeIndex].text) {
            duplicate = true;
          }
        }

        if (!duplicate) {
          aFilters = this.state.selected;
          aFilters.push(this.state.options[0]);
          aOptions.splice(this.state.activeIndex, 1);

          this.setState({
            options: aOptions,
            selected: aFilters
          });
        }
        this.refs.searchinput.focus();
      }
    }
  }

  render() {
    var self = this;

    if (this.state.selected.length > 0) {
      var selections = this.state.selected.map(function(selectionObj, idx) {
        return (
          <li className="mod-socrata-autocomplete-lists-filter-listitem"
            key={ idx }>
            <i className="icon-close-circle" onClick={ self.onClickDeleteSelected.bind(self, selectionObj) }></i>
            <i className="icon-filter"></i>
            { selectionObj.text }
          </li>
        );
      });
    }

    if (this.state.options.length > 0) {
      var suggestions = this.state.options.map(function(suggestionObj, idx) {
        return <li className={ 'mod-socrata-autocomplete-lists-suggestions-listitem' + self.checkActive(idx) }
          key={ idx }
          onClick={ self.onClickSuggestion.bind(self, suggestionObj, idx) }
          onMouseEnter={ self.makeItemActive.bind(self, idx) }>
          { suggestionObj.text }
        </li>;
      });
    }

    var footnote;
    if (this.state.options.length === 0) {
      footnote = 'No matching results.';
    }

    return (
      <div className="qfb-filter-item-flannel-autocomplete">
        <div className="mod-socrata-autocomplete-searchfield">
          <i className="search-icon icon-search is-active-focus"></i>
          <input type="text" className="searchInput" placeholder="Find"
            ref="searchinput"
            onKeyDown={ this.handleKeyboardEvents }
            onChange={ this.onChangeSearchInput } />
          <i className="clearSuggestion icon-close hidden" onClick={ this.onClickClearSearchInput.bind(this) }></i>
        </div>
        <div className="mod-socrata-autocomplete-lists">
          { selections && <h4 className="mod-socrata-autocomplete-lists-filter-title">Selected Filters</h4> }
          <ul className="mod-socrata-autocomplete-lists-filter-list">
            { selections }
          </ul>
          <ul className="mod-socrata-autocomplete-lists-suggestions-list">
            { suggestions }
            <li className="listitem-footnote">{ footnote }</li>
          </ul>
        </div>
      </div>
    );
  }
}

SocrataAutocompletefilter.propTypes = {
  componentId: React.PropTypes.string,
  name: React.PropTypes.string,
  dataHandler: React.PropTypes.func.isRequired
};

export default SocrataAutocompletefilter;
