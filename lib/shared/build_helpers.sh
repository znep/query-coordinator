#!/bin/bash

# make sure Cheetah tests stay in-sync with their environments
# set a new cheetah revision only when we cut a release
# preserve existing cheetah revision in the cherry-pick and hotfix cases
# override this behavior and set cheetahRevision to latest master by checking the "RESET_CHEETAH_REVISION" box on cherry-pick/hotfix jobs
# don't bother setting cheetah revision if staging build since this only applies to RC/EU/Fedramp
# fail build if something goes wrong so we don't cause Cheetah tests to get out of sync with environments
#   in the event that this fails and you need to get a hotfix out
#   you can override by unsetting RELEASE_MODE in the frontend-build-release job
#   see: https://jenkins-build.socrata.com/view/frontend-release-pipeline/job/frontend-build-release/configure
function write_cheetah_revision {
  cheetah_revision_file=$1
  version_endpoint=$2

  if [[ -n "$RELEASE_MODE" ]]; then
    echo "$RELEASE_MODE release detected"

    if [[ $RELEASE_MODE == 'cut' || $RESET_CHEETAH_REVISION == 'true' ]]; then
      echo 'retrieving Cheetah revision from api.github'
      cheetah_revision=$(curl -sH "Authorization: token $GITHUB_API_TOKEN" \
        https://api.github.com/repos/socrata/cheetah/branches/master | jq -r '.commit.sha')
    elif [[ $RELEASE_MODE == 'cherry-pick' ]]; then
      echo "retrieving Cheetah revision from RC $version_endpoint"
      cheetah_revision=$(curl -s https://cheetah.rc-socrata.com/"$version_endpoint" | jq -r '.cheetahRevision')
    elif [[ $RELEASE_MODE == 'hotfix' ]]; then
      echo "retrieving Cheetah revision from Fedramp $version_endpoint"
      cheetah_revision=$(curl -s https://cheetah.demo.socrata.com/"$version_endpoint" | jq -r '.cheetahRevision')
    else
      echo "ERROR >> unrecognized release mode $RELEASE_MODE"
      echo 'failing build since this would cause Cheetah tests to get out of sync with environments'
      exit 1
    fi

    if [[ $cheetah_revision =~ [a-f0-9]{40} ]]; then
      echo "writing Cheetah revision: $cheetah_revision to $cheetah_revision_file"
      echo "$cheetah_revision" > "$cheetah_revision_file"
    else
      echo "ERROR >> Cheetah revision: $cheetah_revision is not SHA-like"
      echo 'failing build since this would cause Cheetah tests to get out of sync with environments'
      exit 1
    fi
  fi
}
