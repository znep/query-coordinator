class WidgetsPreviewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_preview'
  
  def show
    @view = View.find(params[:id])
    @meta_description = Helper.instance.meta_description(@view)
    @meta_keywords = Helper.instance.meta_keywords(@view)
  end
  
end

class Helper
  include Singleton
  include ApplicationHelper
end