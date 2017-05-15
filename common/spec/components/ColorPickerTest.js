import React from 'react';
import ReactDOM from 'react-dom';
import { renderComponent } from '../helpers';
import ColorPicker from 'components/ColorPicker';

describe('ColorPicker', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      palette: [
        '#111111',
        '#222222',
        '#333333',
        '#444444'
      ]
    });
  }

  it('renders the initial value', () => {
    const element = renderComponent(ColorPicker, getProps({
      value: '#999999'
    }));
    assert.equal(
      $(element).find('.selected-color-frame').css('background-color'),
      'rgb(153, 153, 153)' // #999999 in decimal
    );
  });

  it('updates if the value changes in props', () => {
    // Can't use TestUtils because that always renders from scratch. We're interested
    // in testing updates.
    let colorPicker = React.createElement(ColorPicker, getProps());
    const node = document.createElement('div');
    ReactDOM.render(colorPicker, node);

    colorPicker = React.createElement(ColorPicker, getProps({
      value: '#989898'
    }));
    ReactDOM.render(colorPicker, node);

    assert.equal(
      $(node).find('.selected-color-frame').css('background-color'),
      'rgb(152, 152, 152)' // #989898 in decimal
    );
  });

});
