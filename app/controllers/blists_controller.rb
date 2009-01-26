class BlistsController < ApplicationController
  def index
    render(:layout => 'strict')
  end

  def detail
    @id = params[:id]
  end
end
