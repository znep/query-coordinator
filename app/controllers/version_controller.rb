class VersionController < ApplicationController
  def show
    render json: {
      revision: REVISION_NUMBER,
      timestamp: REVISION_DATE
    }
  end
end
