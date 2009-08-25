class VersionController < ApplicationController
  skip_before_filter :require_user, :index
  
  def index
    @revision_number = REVISION_NUMBER
    @revision_date = Time.at(REVISION_DATE)
  end
end
