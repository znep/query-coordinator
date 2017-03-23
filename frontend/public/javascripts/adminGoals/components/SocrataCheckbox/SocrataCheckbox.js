import React from 'react';
import classNames from 'classnames/bind';
import './SocrataCheckbox.scss';

export default class SocrataCheckbox extends React.Component {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);

    this.state = {
      checked: this.props.checked || false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.checked
    });
  }

  onClick() {
    if (this.props.onClick) {
      this.props.onClick(!this.state.checked);
    }

    this.setState({
      checked: !this.state.checked
    });
  }

  render() {
    let currentClass = classNames({ 'icon-checkmark3': this.state.checked });

    return (
      <div className="socrata-checkbox" role="checkbox" aria-checked={ this.state.checked ? 'true' : 'false'} onClick={ this.onClick }>
        <label>
          <span className="hidden">{this.props.label}</span>
          <span className="fake-checkbox">
            <span className={ currentClass } />
          </span>
        </label>
      </div>
    );
  }
}
