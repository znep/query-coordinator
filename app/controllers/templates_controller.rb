class TemplatesController < ApplicationController
  skip_before_filter :require_user

  def show
    render :partial => params[:id] rescue render :nothing => true, :status => :not_found
  end
end
