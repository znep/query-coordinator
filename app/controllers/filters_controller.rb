class FiltersController < ApplicationController
  skip_before_filter :require_user

  def index
    @view = View.find(params[:blist_id])

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
