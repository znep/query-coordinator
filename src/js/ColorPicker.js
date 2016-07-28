import React from 'react';
import classNames from 'classnames';

export var ColorPicker = React.createClass({
  propTypes: {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.array,
      React.PropTypes.object
    ]),
    palette: React.PropTypes.array,
    handleColorChange: React.PropTypes.func,
    bucketRevealDirection: React.PropTypes.string
  },

  getInitialState()  {
    return {
      selectedColor: this.props.value,
      showingBuckets: false
    };
  },

  getDefaultProps() {
    return {
      type: 'single',
      value: '#204490',
      palette: [
        '#204490','#9A2600','#B26B00','#006A01','#6B176C','#006A8B','#9B2D52','#457800',
        '#2F62CF','#DE3700','#FF9A00','#009802','#9A229B','#0098C8','#DF4176','#64AC00',
        '#6D91DD','#E7734D','#FFB84D','#4DB74E','#B864B9','#4DB7D8','#E87A9F','#92C54D'
      ]
    };
  },

  onClickColorFrame() {
    this.setState({ showingBuckets: !this.state.showingBuckets });
  },

  onClickBucket(color) {
    this.setState({
      showingBuckets: false,
      selectedColor: color
    });

    if (this.props.handleColorChange) {
      this.props.handleColorChange(color);
    }
  },

  onClose() {
    this.setState({ showingBuckets: false });
  },

  onChangeInputColor(e) {
    this.setState({ selectedColor: e.target.value });

    var isValidColor  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(e.target.value);
    if (isValidColor && this.props.handleColorChange) {
      this.props.handleColorChange(e.target.value);
    }
  },

  render() {
    var colorFrameStyle = {
      backgroundColor: this.state.selectedColor
    };

    var colorOverlayClassName = classNames('color-picker-overlay', {
      'hidden': !this.state.showingBuckets
    });
    var bucketsClassName = `color-buckets color-${this.props.palette.length}`;
    var bucketContainerClassName = classNames('color-buckets-container', {
      'hidden': !this.state.showingBuckets,
      'reveal-from-top': this.props.bucketRevealDirection === 'top'
    });

    var colorBuckets = this.props.palette.map((color, key)=> {
      var isSelectedColor = color == this.state.selectedColor;
      var style = { backgroundColor: color };
      var attributes = {
        key,
        className: classNames('color-bucket', { 'selected-color': isSelectedColor }),
        style,
        onClick: this.onClickBucket.bind(this, color)
      };

      return <div {...attributes}></div>;
    });

    var hexInputAttributes = {
      type: 'text',
      value: this.state.selectedColor,
      onChange: this.onChangeInputColor
    };

    return (
      <div className="color-picker">
        <div className={ colorOverlayClassName } onClick={ this.onClose } />
        <div className="color-frame" onClick={ this.onClickColorFrame }>
          <div className="selected-color-frame" style={ colorFrameStyle } />
          <div className="caret">
            <span className="icon-arrow-down" />
          </div>
        </div>
        <div className={ bucketContainerClassName }>
          <div className={ bucketsClassName }>
            { colorBuckets }
          </div>
          <input {...hexInputAttributes} />
        </div>
      </div>
    );
  }
});

export default ColorPicker;
