import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import I18n from 'common/i18n';
import { ENTER, isolateEventByKeys } from 'common/keycodes';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';

export class SearchablePicklist extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isValidating: false,
      isError: false,
      textEntered: false
    };

    _.bindAll(this, [
      'onChangeSearchTerm',
      'onClickSelectedOption',
      'onKeyPressSearch',
      'onSearch',
      'focusAndSelectSearchInput',
      'renderSearch',
      'renderSelectedOptionsPicklist',
      'renderPicklist',
      'renderError',
      'renderPrompt'
    ]);
  }

  componentDidMount() {
    this.mounted = true;

    if (this.search) {
      this.search.focus();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
    this.setState({ isError: false });
    const textEntered = event.target.value !== '';
    this.setState({ textEntered });
  }

  onClickSelectedOption(selectedOption) {
    this.props.onClickSelectedOption(selectedOption);
  }

  onKeyPressSearch(event) {
    isolateEventByKeys(event, [ENTER]);

    if (event.keyCode === ENTER) {
      this.onSearch(event);
    }
  }

  onSearch(event) {
    const { canAddSearchTerm } = this.props;
    event.preventDefault();

    if (_.isFunction(canAddSearchTerm)) {
      this.setState({ isValidating: true });

      // This code runs asyncrhonously and potentially
      // after the component is removed. Make sure we're still
      // mounted.
      canAddSearchTerm(this.search.value).
        then(() => {
          if (this.mounted) {
            this.setState({ isValidating: false, textEntered: false });
          }
        }).
        catch(() => { // eslint-disable-line dot-notation
          if (this.mounted) {
            _.defer(this.focusAndSelectSearchInput);
            this.setState({ isError: true, isValidating: false });
          }
        });
    }
  }

  focusAndSelectSearchInput() {
    if (this.search) {
      this.search.focus();
      this.search.setSelectionRange(0, this.search.value.length);
    }
  }

  renderSearch() {
    const { hideSearchInput, value } = this.props;
    const { isValidating, isError, textEntered } = this.state;

    if (hideSearchInput) {
      return null;
    }

    const loadingSpinner = isValidating ? <span className="spinner-default"></span> : null;

    const buttonClassName = classNames('btn btn-default', {
      'btn-highlighted': textEntered
    });

    return (
      <div className="searchable-picklist-input-container">
        <form>
          <span className="input-group">
            <input
              className="searchable-picklist-input"
              type="text"
              aria-label={I18n.t('shared.components.filter_bar.search')}
              value={value || ''}
              ref={(el) => this.search = el}
              onKeyPress={this.onKeyPressSearch}
              onChange={this.onChangeSearchTerm}
              aria-invalid={isError}
              disabled={isValidating} />
            {loadingSpinner}
            <span className="input-group-btn">
              <button
                className={buttonClassName}
                onClick={this.onSearch}
                disabled={isValidating}>
                <SocrataIcon name="search" />
              </button>
            </span>
          </span>
        </form>
      </div>
    );
  }

  renderSelectedOptionsPicklist() {
    const { selectedOptions, onBlur, size, value } = this.props;
    const { isValidating } = this.state;

    if (_.isEmpty(selectedOptions)) {
      return;
    }

    const picklistProps = {
      options: selectedOptions.map((selectedOption) => {
        return {
          group: I18n.t('shared.components.filter_bar.text_filter.selected_values'),
          ...selectedOption
        };
      }),
      onSelection: this.onClickSelectedOption,
      onBlur,
      disabled: isValidating,
      size,
      value
    };

    return (
      <div className="searchable-picklist-selected-options">
        <Picklist {...picklistProps} />
      </div>
    );
  }

  renderPicklist() {
    const { options, size, value, onSelection, onBlur } = this.props;
    const { isValidating } = this.state;

    if (_.isEmpty(options)) {
      return (
        <div className="alert warning">
          {I18n.t('shared.components.filter_bar.no_options_found')}
        </div>
      );
    }

    const picklistProps = {
      options,
      size,
      value,
      onSelection,
      onBlur,
      disabled: isValidating
    };

    return (
      <div className="searchable-picklist-suggested-options">
        <Picklist {...picklistProps} />
      </div>
    );
  }

  renderError() {
    return this.state.isError ?
      <div className="alert warning">{I18n.t('shared.components.filter_bar.text_filter.keyword_not_found')}</div> :
      null;
  }

  renderPrompt() {
    return (this.state.textEntered && !this.state.isError) ?
      <div className="alert info">
        {I18n.t('shared.components.filter_bar.text_filter.exact_search_prompt_main')}
        <a href="" onClick={this.onSearch}>
          {I18n.t('shared.components.filter_bar.text_filter.exact_search_prompt_link')}
        </a>
      </div> :
      null;
  }

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderError()}
        {this.renderPrompt()}
        <div className="searchable-picklist-options">
          {this.renderSelectedOptionsPicklist()}
          {this.renderPicklist()}
        </div>
      </div>
    );
  }
}

SearchablePicklist.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  selectedOptions: PropTypes.arrayOf(PropTypes.object),
  onChangeSearchTerm: PropTypes.func.isRequired,
  onSelection: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onClickSelectedOption: PropTypes.func,
  canAddSearchTerm: PropTypes.func,
  hideSearchInput: PropTypes.bool
};

export default SearchablePicklist;
