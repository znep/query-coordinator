import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Selectors from 'selectors';
import SourceSidebar from 'components/SourceSidebar/SourceSidebar';

export const mapStateToProps = ({ entities }, { params }) => {
  let currentSource;
  let otherSources;
  const revisionSeq = _.toNumber(params.revisionSeq);
  const pendingOrSuccessfulSources = _.chain(entities.sources)
    .values()
    .filter(source => !source.failed_at)
    .value();

  const currentOutputSchema = Selectors.currentOutputSchema(entities, revisionSeq);

  if (currentOutputSchema) {
    const { input_schema_id: inputSchemaId } = currentOutputSchema;
    const { source_id: sourceId } = entities.input_schemas[inputSchemaId];

    currentSource = entities.sources[sourceId];
    otherSources = pendingOrSuccessfulSources.filter(source => source.id !== sourceId);
  } else {
    // rare case where you have uploads but not a current upload
    currentSource = null;
    otherSources = pendingOrSuccessfulSources;
  }

  const sources = [{ ...currentSource, isCurrent: true }, ...otherSources];

  return {
    sources: _.orderBy(sources, ['finished_at'], ['desc']),
    entities
  };
};

export default withRouter(connect(mapStateToProps)(SourceSidebar));
