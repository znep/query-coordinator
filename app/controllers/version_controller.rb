class VersionController < ApplicationController
  skip_before_filter :require_user, :index
  
  def index
    Rails.logger.info 'Getting version information'
    respond_to do |format|
      Rails.logger.info "Version information: revision number - #{REVISION_NUMBER}, date - #{REVISION_DATE}"
      format.html do
        @revision_number = REVISION_NUMBER
        @revision_date = Time.at(REVISION_DATE) if REVISION_DATE
      end
      format.json do
        render json: {
          facility: 'frontend',
          revision: REVISION_NUMBER,
          timestamp: REVISION_DATE
        }
      end
    end
  end
end
