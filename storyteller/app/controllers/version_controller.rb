class VersionController < ApplicationController
  def show
    render json: {
      version: Rails.application.config.version,
      revision: Storyteller::REVISION_NUMBER,
      buildTimestamp: Storyteller::BUILD_TIMESTAMP,
      bootedTimestamp: Storyteller::BOOTED_TIMESTAMP,
      cheetahRevision: Storyteller::CHEETAH_REVISION_NUMBER
    }
  end
end
