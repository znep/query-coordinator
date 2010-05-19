class WidgetsPreviewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_preview'
  
  def show
    @view = View.find(params[:id])
    @meta_description = @view.meta_description
    @meta_keywords = @view.meta_keywords
  end
  
end
