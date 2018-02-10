/*
 * This is analogous to react-redux's connect(), except
 * it works with one or more Flux stores.
 * Example:
 *
 *  const MyConnectedComponent = connect(
 *    { assetSelectorStore, storyStore }, // Passed back as args to mapStoresToProps
 *    (stores) => {
 *      // This function is called every time the store emits a change.
 *      // The returned object gets applied as props to MyComponent.
 *      return {
 *        componentType: stores.assetSelectorStore.getComponentType(),
 *        ownerUid: storyStore.getStoryPrimaryOwnerUid()
 *      };
 *    },
 *    (dispatch) => ({
 *      onClickWidget: () => {
 *        dispatch({
 *          action: Actions.ASSET_SELECTOR_UPDATE_COMPONENT_TYPE,
 *          type
 *        });
 *      }
 *    })
 *  );
 */

import _ from 'lodash';
import React, { Component } from 'react';
import { dispatcher } from 'editor/Dispatcher';

const connectFlux = (stores, mapStoresToProps, mapDispatchToProps) => (
  (WrappedComponent) => {
    return class extends Component {
      constructor(props) {
        super(props);
        this.state = { propsForWrapped: this.getPropsForWrapped() };
      }

      getPropsForWrapped = () => {
        const fromDispatch = mapDispatchToProps ?
          mapDispatchToProps(dispatcher.dispatch.bind(dispatcher)) : {};

        return {
          ...fromDispatch,
          ...mapStoresToProps(stores)
        };
      }

      componentDidMount() {
        _.forOwn(stores, (store) => store.addChangeListener(this.onStoreChange));
      }

      componentWillUnmount() {
        _.forOwn(stores, (store) => store.removeChangeListener(this.onStoreChange));
      }

      onStoreChange = () => {
        this.setState({ propsForWrapped: this.getPropsForWrapped() });
      }

      render() {
        const props = {
          ...this.props,
          ...this.state.propsForWrapped
        };
        return <WrappedComponent {...props} />;
      }
    };
  }
);

export default connectFlux;
