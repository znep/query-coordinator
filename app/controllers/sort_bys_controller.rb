class SortBysController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])
    @selected = @view.sortBys || []
    @unselected = @view.columns.reject do |c| 
      @selected.select { |s| c.id == s.viewColumnId }.size > 0 ||
      !c.is_sortable?
    end

    @unselected.collect! do |s| 
      {
       "id" => nil, 
       "position" => 0, 
       "viewColumnId" => s.id,
      }
    end

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
      format.html { redirect_to @view.href }
    end
  end
end
