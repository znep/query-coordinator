class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show]
  layout 'dataset_v2'

  def show
    @view = View.find(params[:id])
  end
end
