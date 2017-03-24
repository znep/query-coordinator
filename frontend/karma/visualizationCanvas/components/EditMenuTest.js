import { EditMenu } from 'components/EditMenu';
import mockView from 'data/mockView';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

describe('EditMenu', () => {
  const getProps = (props) => {
    return {
      name: 'test name',
      description: 'test description',
      isActive: true,
      onClickUpdate: _.noop,
      onClickDismiss: _.noop,
      ...props
    };
  };

  let element;

  beforeEach(() => {
    element = renderComponent(EditMenu, getProps());
  });

  it('renders', () => {
    expect(element).to.exist;
  });

  it('uses the page name as default value for the title field', () => {
    expect(element.querySelector('input[id="edit-title-field"]').value).to.eq('test name');
  });

  it('uses the page description as default value for the description field', () => {
    expect(element.querySelector('textarea[id="edit-description-field"]').value).to.eq('test description');
  });

  it('update the name in state if the name field value is changed', (done) => {
    const instance = React.createElement(EditMenu, getProps());
    const component = renderIntoDocument(instance);
    const element = ReactDOM.findDOMNode(component);
    var textInput = element.querySelector('.text-input');

    textInput.value = 'new name';
    TestUtils.Simulate.change(textInput);

    _.defer(() => {
      expect(component.state.name).to.eq('new name');
      done();
    });
  });

  it('updates the description in state when the description field value is changed', (done) => {
    const instance = React.createElement(EditMenu, getProps());
    const component = renderIntoDocument(instance);
    const element = ReactDOM.findDOMNode(component);
    var textarea = element.querySelector('.text-area');

    textarea.value = 'new description';
    TestUtils.Simulate.change(textarea);

    _.defer(() => {
      expect(component.state.description).to.eq('new description');
      done();
    });
  });

  it('renders an update button', () => {
    expect(element.querySelector('.update-button')).to.exist;
  });

  it('disables the update button when the name is empty', () => {
    const element = renderComponent(EditMenu, getProps({
      name: ''
    }));

    expect(element.querySelector('.update-button:disabled')).to.exist;
  });

  it('invokes onClickUpdate on update click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponent(EditMenu, getProps({
      onClickUpdate: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('.update-button'));
    expect(onClickSpy).to.have.been.called;
  });
});
