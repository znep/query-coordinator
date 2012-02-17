class VersionController < ApplicationController
  skip_before_filter :require_user, :index
  
  def index
    respond_to do |format|
      format.html do
        @revision_number = REVISION_NUMBER
        @revision_date = Time.at(REVISION_DATE)
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
