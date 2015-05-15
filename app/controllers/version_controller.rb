class VersionController < ApplicationController
  def show
    render json: {
      revision: Storyteller::REVISION_NUMBER,
      buildTimestamp: Storyteller::BUILD_TIMESTAMP,
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP
    }
  end
end
