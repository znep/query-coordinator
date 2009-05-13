class ImportsController < ApplicationController
  def new
    @body_class = 'import'
  end

  def redirect
    view = View.find(params[:id])

    redirect_to view.href + '?mode=edit'
  end
end
