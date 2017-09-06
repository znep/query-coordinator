import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import { DOWN, ENTER, ESCAPE, SPACE, isolateEventByKeys } from 'common/dom_helpers/keycodes';

export class ColorPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedColor: this.props.value,
      showingBuckets: false
    };

    _.bindAll(this, [
      'componentWillReceiveProps',
      'componentDidUpdate',
      'onClickColorFrame',
      'onClickBucket',
      'onClose',
      'onChangeInputColor',
      'onKeyDownColorPicker',
      'onKeyUpColorPicker',
      'onKeyUpColorBucket',
      'onKeyDownColorBucket',
      'onKeyUpHexInput',
      'renderColorBucket',
      'renderColorBuckets',
      'renderColorFrame',
      'renderColorPickerOverlay'
    ]);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        selectedColor: nextProps.value
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.showingBuckets && this.state.showingBuckets) {
      this.colorBucketsRef.focus();
    }
  }

  onClickColorFrame() {
    this.setState({
      showingBuckets: !this.state.showingBuckets
    });
  }

  onClickBucket(selectedColor) {
    this.setState({
      showingBuckets: false,
      selectedColor
    });

    this.props.handleColorChange(selectedColor);
    this.colorPickerRef.focus();
  }

  onClose() {
    this.setState({
      showingBuckets: false
    });
  }

  onChangeInputColor(e) {
    const selectedColor = e.target.value;
    const isValidColor = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(selectedColor);

    if (isValidColor) {
      this.props.handleColorChange(selectedColor);
    }

    this.setState({ selectedColor });
  }

  onKeyDownColorPicker(event) {
    isolateEventByKeys(event, [DOWN]);
  }

  onKeyUpColorPicker(event) {
    const { keyCode } = event;
    isolateEventByKeys(event, [DOWN, ESCAPE]);

    if (keyCode === DOWN) {
      this.setState({ showingBuckets: true });
    } else if (keyCode === ESCAPE) {
      this.onClose();
    }
  }

  onKeyUpColorBucket(color, event) {
    const { keyCode } = event;
    isolateEventByKeys(event, [ENTER, SPACE, ESCAPE]);

    if (keyCode === ENTER || keyCode === SPACE) {
      this.onClickBucket(color);
    } else if (keyCode === ESCAPE) {
      this.onClose();
    }
  }

  onKeyDownColorBucket(event) {
    isolateEventByKeys(event, [ENTER, SPACE]);
  }

  onKeyUpHexInput(event) {
    const { keyCode } = event;
    isolateEventByKeys(event, [ENTER, ESCAPE]);

    if (keyCode === ENTER) {
      this.onChangeInputColor(event);
      this.setState({ showingBuckets: false });
      this.colorPickerRef.focus();
    } else if (keyCode === ESCAPE) {
      this.onClose();
    }
  }

  renderColorBucket(color, key) {
    const isSelectedColor = color === this.state.selectedColor;
    const attributes = {
      key,
      id: color,
      tabIndex: 0,
      role: 'option',
      onClick: this.onClickBucket.bind(this, color),
      onKeyUp: this.onKeyUpColorBucket.bind(this, color),
      onKeyDown: this.onKeyDownColorBucket,
      style: { backgroundColor: color },
      'aria-selected': isSelectedColor,
      'aria-label': `${I18n.t('shared.components.color_picker.pickable_color')} ${color}`,
      className: classNames('color-bucket', {
        'selected-color': isSelectedColor
      })
    };

    return <div {...attributes}></div>;
  }

  renderColorBuckets() {
    const { palette, bucketRevealDirection } = this.props;
    const { selectedColor, showingBuckets } = this.state;
    const colorBuckets = _.map(palette, this.renderColorBucket);
    const bucketContainerClassName = classNames('color-buckets-container', {
      'hidden': !showingBuckets,
      'reveal-from-top': bucketRevealDirection === 'top'
    });

    const colorBucketsAttributes = {
      className: `color-buckets color-${palette.length}`,
      ref: ref => this.colorBucketsRef = ref,
      role: 'listbox',
      tabIndex: 0,
      'aria-activedescendant': selectedColor
    };
    const hexInputAttributes = {
      type: 'text',
      value: selectedColor,
      onChange: this.onChangeInputColor,
      onKeyUp: this.onKeyUpHexInput
    };

    return (
      <div className={bucketContainerClassName}>
        <div {...colorBucketsAttributes}>
          {colorBuckets}
        </div>
        <input {...hexInputAttributes} />
      </div>
    );
  }

  renderColorFrame() {
    const { selectedColor } = this.state;
    const openColorPicker = I18n.t('shared.components.color_picker.open_color_picker');
    const withCurrentSelection = I18n.t('shared.components.color_picker.with_currently_selected_color');
    const label = selectedColor ?
      `${openColorPicker} ${withCurrentSelection} ${selectedColor}` : openColorPicker;
    const colorFrameAttributes = {
      className: 'color-frame',
      onClick: this.onClickColorFrame,
      role: 'button',
      tabIndex: 0,
      onKeyUp: this.onKeyUpColorPicker,
      onKeyDown: this.onKeyDownColorPicker,
      ref: (ref) => this.colorPickerRef = ref,
      'aria-label': label
    };

    const selectedColorFrameAttributes = {
      className: 'selected-color-frame',
      style: { backgroundColor: selectedColor }
    };

    return (
      <div {...colorFrameAttributes}>
        <div {...selectedColorFrameAttributes} />
        <div className="caret" role="presentation">
          <span className="socrata-icon-arrow-down" />
        </div>
      </div>
    );
  }

  renderColorPickerOverlay() {
    const colorOverlayClassName = classNames('color-picker-overlay', {
      'hidden': !this.state.showingBuckets
    });

    return <div className={colorOverlayClassName} onClick={this.onClose} role="button" />;
  }

  render() {
    const colorPickerAttributes = {
      className: 'color-picker',
      id: this.props.id
    };

    return (
      <div {...colorPickerAttributes}>
        {this.renderColorPickerOverlay()}
        {this.renderColorFrame()}
        {this.renderColorBuckets()}
      </div>
    );
  }
}

ColorPicker.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object
  ]),
  palette: PropTypes.array,
  handleColorChange: PropTypes.func,
  bucketRevealDirection: PropTypes.string
};

ColorPicker.defaultProps = {
  type: 'single',
  value: '#204490',
  palette: [
    '#204490', '#9A2600', '#B26B00', '#006A01', '#6B176C', '#006A8B', '#9B2D52', '#457800',
    '#2F62CF', '#DE3700', '#FF9A00', '#009802', '#9A229B', '#0098C8', '#DF4176', '#64AC00',
    '#6D91DD', '#E7734D', '#FFB84D', '#4DB74E', '#B864B9', '#4DB7D8', '#E87A9F', '#92C54D'
  ],
  handleColorChange: _.noop
};

export default ColorPicker;
