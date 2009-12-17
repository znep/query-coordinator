class SortBysController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])

    @selected = []
    if !params[:sorts].nil?
      @selected = params[:sorts].split(',').map do |s|
        parts = s.split(':')
        {'columnId' => parts[0].to_i, 'asc' => parts[1] == 'asc'}
      end
    elsif !@view.query.orderBys.nil?
      @selected = @view.query.orderBys.map {|o|
          {'columnId' => o['expression']['columnId'].to_i, 'asc' => o['ascending']}}
    end

    @unselected = []
    if !params[:unsorts].nil?
      @unselected = params[:unsorts].split(',').map {|u| {'columnId' => u.to_i}}
    else
      @unselected = @view.columns.reject do |c|
        @selected.select { |s| c.id == s['columnId'] }.size > 0 ||
          !c.is_sortable? ||
          (@view.is_grouped? && !c.is_grouped?(@view) && !c.is_group_aggregate?)
      end.collect { |s| {"columnId" => s.id} }
    end

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
