class BlistsController < ApplicationController
  def index
    @bodyClass = 'home'
    render(:layout => 'strict')
  end

  def detail
    @id = params[:id]
  end
end
