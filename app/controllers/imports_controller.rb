class ImportsController < ApplicationController
  def new
    redirect_to(:controller => 'blists', :action => 'upload', :status => 301)
  end

  def redirect
    view = View.find(params[:id])

    redirect_to view.href + '?mode=edit'
  end
end
