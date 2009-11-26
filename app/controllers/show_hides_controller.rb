class ShowHidesController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])
    @selected = []
    @unselected = []
    @view.columns.each do |c|
      if c.flag?('hidden')
        @unselected << c
      else
        @selected << c
      end
    end

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
