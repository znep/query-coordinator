class FiltersController < ApplicationController
  def index
    @view = View.find(params[:blist_id])

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
