import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { getComponentName } from 'lib/util';

const makeWrapper = (WrappedComponent) => {
  // WrappedComponent is a form. Wrapping the form in this HOC gives you a what
  // to manage your form's data, and even sync it to the store if you want. You
  // can use this in conjuction with validateSchema if you want validations. You
  // can also use this with connected components if you need data from the redux store

  class FormWrapper extends Component {
    constructor(props) {
      super(props);

      // All the form's data is gathered into state.model. It will have a keyname
      // for each field in the form
      this.state = {
        model: props.initialModel || {},
        isDirty: {
          fields: [],
          form: false
        }
      };

      _.bindAll(this,
        [
          'setModel',
          'setProperty',
          'setDirty',
          'setDirtyProperty',
          'bindToChangeEvent',
          'bindInput',
          'removeDirtyProperty'
        ]
      );
    }

    // Necessary to check the initial model again here, just in case we are
    // getting its data from an API call or other async method, in which case
    // that data might not be available when this component's constructor is called
    componentWillReceiveProps(nextProps) {
      const initialModelOrig = this.props.initialModel || {};
      const initialModelUpdated = nextProps.initialModel;

      if (!_.isEqual(initialModelOrig, initialModelUpdated)) {
        this.setModel(initialModelUpdated);
      }
    }

    // If you pass syncToStore in as a prop, then this component will send
    // its internal state to the redux store
    componentWillUpdate(nextProps, nextState) {
      const { syncToStore, fourfour } = this.props;
      if (syncToStore && fourfour && !_.isEqual(nextState, this.state)) {
        syncToStore(fourfour, 'model', nextState.model);
        syncToStore(fourfour, 'isDirty', nextState.isDirty);
      }
    }

    setModel(model) {
      this.setState({ model });
    }

    setProperty(fieldName, value) {
      this.setModel(_.assign({}, this.state.model, {
        [fieldName]: value
      }));
    }

    setDirty(isDirty) {
      this.setState({ isDirty });
    }

    setDirtyProperty(fieldName) {
      const dirtyFields = this.state.isDirty.fields;

      if (dirtyFields.includes(fieldName)) {
        return;
      }

      this.setDirty({
        fields: dirtyFields.concat([fieldName]),
        form: true
      });
    }

    removeDirtyProperty(fieldName) {
      const newFields = this.state.isDirty.fields.filter(field => field !== fieldName);

      this.setDirty(_.assign({}, this.state.isDirty, {
        fields: newFields
      }));
    }

    // This does not account for all form-field possibilities. You can extend it
    // if it is not doing what you wish, or you can just use setProperty/setModel
    // directly from your form-field
    bindToChangeEvent(e) {
      const { name, type, value } = e.target;

      this.setDirtyProperty(name);

      if (type === 'checkbox') {
        const oldCheckboxValue = this.state.model[name] || [];
        const newCheckboxValue = e.target.checked
          ? oldCheckboxValue.concat(value)
          : oldCheckboxValue.filter(v => v !== value);

        this.setProperty(name, newCheckboxValue);
      } else {
        this.setProperty(name, value);
      }
    }

    // A helper method that you can attach to a form field like so:
    // <input {...bindInput('fieldName')} />.
    bindInput(name) {
      return {
        name,
        value: this.state.model[name] || '',
        onChange: this.bindToChangeEvent
      };
    }

    render() {
      const finalProps = _.assign({}, this.props, {
        bindInput: this.bindInput,
        bindToChangeEvent: this.bindToChangeEvent,
        model: this.state.model,
        isDirty: this.state.isDirty,
        setDirty: this.setDirty,
        setDirtyProperty: this.setDirtyProperty,
        removeDirtyProperty: this.removeDirtyProperty,
        setProperty: this.setProperty,
        setModel: this.setModel
      });

      return React.createElement(WrappedComponent, finalProps);
    }
  }

  FormWrapper.propTypes = {
    syncToStore: PropTypes.func,
    fourfour: PropTypes.string,
    initialModel: PropTypes.object
  };

  FormWrapper.displayName = `Reformed(${getComponentName(WrappedComponent)})`;
  return hoistNonReactStatics(FormWrapper, WrappedComponent);
};

export default makeWrapper;
