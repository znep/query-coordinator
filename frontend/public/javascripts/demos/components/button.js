import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { Button, Checkbox, Dropdown } from 'common/components';

class ButtonDemo extends Component {
  constructor() {
    super();
    this.state = {
      busy: false,
      dark: false,
      disabled: false,
      size: 'default',
      variant: 'default'
    };
  }

  renderBoolField = (field) => {
    const onChange = () => {
      this.setState({
        [field]: !this.state[field]
      });
    };
    return (
      <form>
        <Checkbox id={`${field}-checkbox`} checked={this.state[field]} onChange={onChange}>{field}</Checkbox>
      </form>
    );
  }

  renderDropdownField = (field, values) => {
    const options = values.map((option) => ({ title: option, value: option }));
    const onSelection = (option) => {
      this.setState({
        [field]: option.value
      });
    };
    return (<Dropdown options={options} value={this.state[field]} onSelection={onSelection} />);
  }

  render() {
    const variants = [
      'default', 'transparent', 'primary', 'alternate-1', 'alternate-2',
      'simple', 'warning', 'success', 'error'
    ];
    const sizes = [ 'lg', 'default', 'sm', 'xs' ];

    const {
      busy,
      dark,
      disabled,
      variant,
      size
    } = this.state;

    const buttonProps = {
      busy,
      dark,
      disabled,
      variant,
      onClick: () => { alert('You are now aware of your breathing.'); },
      size
    };

    return (
      <div>
        <div>
          <h5>Variant</h5>
          {this.renderDropdownField('variant', variants)}
          {this.renderDropdownField('size', sizes)}
          {this.renderBoolField('disabled')}
          {this.renderBoolField('dark')}
          {this.renderBoolField('busy')}
        </div>
        <div className="styleguide-example">
          <Button {...buttonProps}>Hello!</Button>
        </div>
        <div className="styleguide-code-example">
          <pre>
{
`const props = ${JSON.stringify(buttonProps, null, 2)};
return (<Button {...props}>Hello!</Button>);
`
}
          </pre>
        </div>
      </div>
    );
  }
}

$(() => {
  ReactDOM.render(
    React.createElement(ButtonDemo),
    document.getElementById('component-demo')
  );
});
