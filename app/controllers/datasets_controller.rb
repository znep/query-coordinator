class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show]

  def show
    @view_id = params[:id]
  end
end
