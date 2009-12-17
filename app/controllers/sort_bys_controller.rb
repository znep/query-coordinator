class SortBysController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])

    @selected = []
    if !params[:sorts].nil?
      @selected = params[:sorts].split(',').map do |s|
        parts = s.split(':')
        {'id' => parts[0].to_i, 'viewColumnId' => parts[1].to_i,
          'asc' => parts[2] == 'asc'}
      end
    elsif !@view.sortBys.nil?
      @selected = @view.sortBys.map {|s|
          {'id' => s.id, 'viewColumnId' => s.viewColumnId,
            'asc' => s.asc?}}
    end

    @unselected = []
    if !params[:unsorts].nil?
      @unselected = params[:unsorts].split(',').map {|u| {'viewColumnId' => u.to_i}}
    else
      @unselected = @view.columns.reject do |c|
        @selected.select { |s| c.id == s['viewColumnId'] }.size > 0 ||
          !c.is_sortable? ||
          (@view.is_grouped? && !c.is_grouped?(@view) && !c.is_group_aggregate?)
      end.collect { |s| {"viewColumnId" => s.id} }
    end

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
