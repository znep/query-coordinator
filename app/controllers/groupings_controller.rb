class GroupingsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])
    @is_temp = params[:isTempView] == 'true'

    groups = []
    if !params[:groups].nil?
      groups = params[:groups].split(',')
    elsif !@view.query.nil? && !@view.query.groupBys.nil?
      groups = @view.query.groupBys.map {|g| g['columnId'].to_s}
    end
    @grouped = []
    groupIds = {}
    groups.each do |g|
      @grouped << @view.columns.find {|c| c.id.to_s == g}
      groupIds[g] = true
    end

    aggs = []
    if !params[:aggs].nil?
      aggs = params[:aggs].split(',').map do |a|
        parts = a.split(':')
        {'id' => parts[0], 'func' => parts[1]}
      end
    else
      aggs = @view.columns.find_all {|c| !c.format.nil? &&
        !c.format.grouping_aggregate.nil?}.map {|c|
          {'id' => c.id.to_s, 'func' => c.format.grouping_aggregate}}
    end
    @agged = []
    aggedIds = {}
    aggs.each do |a|
      col = @view.columns.find {|c| c.id.to_s == a['id']}
      col.data['format'] ||= {}
      col.data['format']['grouping_aggregate'] = a['func']
      @agged << col
      aggedIds[a['id']] = true
    end

    @unagged = []
    @ungrouped = []
    @view.columns.each do |c|
      next if c.is_nested_table

      if aggedIds[c.id.to_s].nil?
        @unagged << c
      end
      if groupIds[c.id.to_s].nil?
        @ungrouped << c
      end
    end

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
