class VersionController < ApplicationController
  skip_before_filter :require_logged_in_user

  def show
    render json: {
      revision: Storyteller::REVISION_NUMBER,
      buildTimestamp: Storyteller::BUILD_TIMESTAMP,
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP
    }
  end
end
