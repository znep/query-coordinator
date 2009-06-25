class WidgetsPreviewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_preview'
  
  def show
    @view = View.find(params[:id])
  end
  
end
