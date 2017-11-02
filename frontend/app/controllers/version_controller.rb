class VersionController < ApplicationController
  skip_before_filter :require_user, :index, :set_meta

  def index
    Rails.logger.info 'Getting version information'
    respond_to do |format|
      Rails.logger.info "Version information: revision number - #{REVISION_NUMBER}, date - #{REVISION_DATE}"
      format.html do
        @revision_number = REVISION_NUMBER
        @revision_date = Time.at(REVISION_DATE) if REVISION_DATE
        @cheetah_revision_number = CHEETAH_REVISION_NUMBER
      end
      format.json do
        render json: {
          facility: 'frontend',
          version: Frontend.version,
          revision: REVISION_NUMBER,
          timestamp: REVISION_DATE,
          cheetahRevision: CHEETAH_REVISION_NUMBER
        }
      end
    end
  end
end
