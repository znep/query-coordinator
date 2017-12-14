import _ from 'lodash';
import { connect } from 'react-redux';
import SoQLResults from '../components/TransformColumn/SoQLResults';
import * as DisplayState from '../lib/displayState';
import * as Links from '../links/links';
import { browserHistory } from 'react-router';

function mapStateToProps(state, props) {
  const outputColumn = state.entities.output_columns[props.outputColumn.id];
  const transform = state.entities.transforms[outputColumn.transform_id];
  outputColumn.transform = transform;
  return {
    params: props.params,
    entities: state.entities,
    inputSchema: props.inputSchema,
    displayState: DisplayState.fromUiUrl(_.pick(props, ['params', 'location'])),
    outputColumn,
    transform
  };
}

function mergeProps(stateProps, dispatchProps, props) {
  return {
    ...stateProps,
    ...props,
    onClickError: () => {
      const params = stateProps.params;
      const linkPath = DisplayState.inErrorMode(stateProps.displayState, stateProps.transform)
        ? Links.transformColumn(
          params,
          params.sourceId,
          params.inputSchemaId,
          params.outputSchemaId,
          stateProps.outputColumn.id
        )
        : Links.transformColumnErrors(
          params,
          params.sourceId,
          params.inputSchemaId,
          params.outputSchemaId,
          stateProps.outputColumn.id,
          stateProps.transform.id
        );

      browserHistory.push(linkPath);
    }
  };
}


export default connect(mapStateToProps, null, mergeProps)(SoQLResults);
