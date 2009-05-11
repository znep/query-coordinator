class AboutController < ApplicationController
  skip_before_filter :require_user

  rescue_from ActionView::MissingTemplate do |exception|
    render_404
  end

  def index
  end

  def show
    render :action => params[:page]
  end
end
