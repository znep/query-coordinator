import PropTypes from 'prop-types';
import React from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import styles from 'styles/SetupAutomation.scss';
import Highlight from 'react-syntax-highlight';
import CopyToClipboard from 'react-copy-to-clipboard';

const SubI18n = I18n.automate_this;

function uploadFunctionName(source) {
  const contentTypeFunctionNameMapping = [
    ['text/csv', 'csv'],
    ['application/vnd.ms-excel', 'xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    ['text/tab-separated-values', 'tsv'],
    ['application/zip', 'shapefile'],
    ['application/x-zip', 'shapefile'],
    ['application/vnd.google-earth.kml+xml', 'kml'],
    ['application/vnd.google-earth.kmz', 'kmz'],
    ['application/vnd.geo+json', 'geojson']
  ];

  for (const [mime, funcName] of contentTypeFunctionNameMapping) {
    if (source.content_type.indexOf(mime) > -1) {
      return funcName;
    }
  }
  return 'csv'; // idk - maybe they'll figure it out at this point
}


function UploadSourcePythonCode({ fourfour, source, importConfigName }) {
  const content = `from socrata.authorization import Authorization
from socrata import Socrata
import os
import sys

auth = Authorization(
  '${window.location.host}',
  os.environ['MY_SOCRATA_USERNAME'],
  os.environ['MY_SOCRATA_PASSWORD']
)

socrata = Socrata(auth)

(ok, view) = socrata.views.lookup('${fourfour}')
assert ok, view

with open('${source.source_type.filename}', 'rb') as my_file:
  (ok, job) = socrata.using_config('${importConfigName}', view).${uploadFunctionName(source)}(my_file)
  assert ok, job
  # These next 3 lines are optional - once the job is started from the previous line, the
  # script can exit; these next lines just block until the job completes
  assert ok, job
  (ok, job) = job.wait_for_finish(progress = lambda job: print('Job progress:', job.attributes['status']))
  sys.exit(0 if job.attributes['status'] == 'successful' else 1)

`;
  return (<div className={styles.codeWindow}>
    <CopyToClipboard text={content}>
      <button className={styles.copyBtn}>
        {SubI18n.copy_code}
      </button>
    </CopyToClipboard>
    <Highlight lang="python" value={content} />
  </div>);
}

UploadSourcePythonCode.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  source: PropTypes.object.isRequired,
  fourfour: PropTypes.string.isRequired,
  importConfigName: PropTypes.string.isRequired
};

function SetupAutomation({ fourfour, source, outputSchemaId, importConfigName, onDismiss }) {
  const headerProps = {
    title: SubI18n.title,
    onDismiss
  };

  return (
    <div className={styles.setupAutomation}>
      <ModalHeader {...headerProps} />
      <ModalContent>
        <p style={{ marginTop: 10 }}>
          {SubI18n.description}
        </p>
        <ol>
          <li>
            {SubI18n.install_socrata_py}
            <div className={styles.codeWindow}>
              <Highlight lang="bash" value="pip install socrata-py" />
            </div>
            {SubI18n.local_py_env}
          </li>
          <li>
            {SubI18n.containing_this_code}
            <UploadSourcePythonCode
              fourfour={fourfour}
              source={source}
              outputSchemaId={outputSchemaId}
              importConfigName={importConfigName} />
          </li>
          <li>
            {SubI18n.use_a_task_scheduler}
            <div className={styles.codeWindow}>
              <Highlight lang="bash" value="python3 my-update-script.py" />
            </div>
          </li>
          <li>
            <a target="_blank" href="/admin/activity_feed">{SubI18n.activity_log}</a>
          </li>
        </ol>
      </ModalContent>
      <ModalFooter>
        <button
          className="btn btn-primary"
          onClick={onDismiss}>
          {I18n.common.done}
        </button>
      </ModalFooter>
    </div>
  );
}

SetupAutomation.propTypes = {
  importConfigName: PropTypes.string.isRequired,
  fourfour: PropTypes.string.isRequired,
  outputSchemaId: PropTypes.number.isRequired,
  source: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired
};

export default SetupAutomation;
