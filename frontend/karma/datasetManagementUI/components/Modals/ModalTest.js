import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { Modal } from 'components/Modals/Modal';

describe('components/Modals/Modal', () => {
  const defaultProps = {
    visible: false,
    contentComponentName: null,
    onDismiss: sinon.spy()
  };

  it('renders null if not visible', () => {
    const component= shallow(<Modal {...defaultProps} />);
    assert.isNull(component.html());
  });

  it('renders ErrorsHelp modal', () => {
    const newProps = {
      ...defaultProps,
      contentComponentName: 'ErrorsHelp',
      visible: true
    };

    const component = shallow(<Modal {...newProps}/>);

    assert.isFalse(component.find('Connect(ErrorsHelp)').isEmpty());
  });

  it('renders Publishing modal', () => {
    const newProps = {
      ...defaultProps,
      contentComponentName: 'Publishing',
      visible: true
    };

    const component = shallow(<Modal {...newProps}/>);

    assert.isFalse(component.find('Connect(Publishing)').isEmpty());
  });
});
