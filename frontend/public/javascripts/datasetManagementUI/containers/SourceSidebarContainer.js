import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Selectors from 'selectors';
import SourceSidebar from 'components/SourceSidebar/SourceSidebar';

export const mapStateToProps = ({ entities }, { params }) => {
  // let currentSource;
  let otherSources;
  let sources;

  const revisionSeq = _.toNumber(params.revisionSeq);
  const revision = Selectors.currentRevision(entities, revisionSeq);
  const pendingOrSuccessfulSources = _.chain(entities.sources)
    .values()
    .filter(source => !source.failed_at)
    .value();

  const currentSource = Selectors.currentSource(entities, revisionSeq);

  if (currentSource) {
    otherSources = pendingOrSuccessfulSources.filter(source => source.id !== currentSource.id);
    sources = [{ ...currentSource, isCurrent: true }, ...otherSources];
  } else {
    // rare case where you have uploads but not a current upload
    sources = pendingOrSuccessfulSources;
  }

  return {
    sources: _.orderBy(sources, ['finished_at'], ['desc']),
    entities,
    hideHrefLink: revision.is_parent === false
  };
};

export default withRouter(connect(mapStateToProps)(SourceSidebar));
