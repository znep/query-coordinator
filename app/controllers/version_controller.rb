class VersionController < ApplicationController
  def show
    render json: {
      revision: Storyteller::REVISION_NUMBER,
      buildTimestamp: Storyteller::REVISION_DATE,
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP
    }
  end
end
