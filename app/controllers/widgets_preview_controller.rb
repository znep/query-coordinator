class WidgetsPreviewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_preview'
  
  def show
    @view = View.find(params[:id])
    @meta_description = @view.meta_description
    @meta_keywords = @view.meta_keywords

    @customization_id = params[:variation]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?
  end
  
end
