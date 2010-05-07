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
    @used_cols = []
    groupIds = {}
    groups.each do |g|
      col = @view.columns.find {|c| c.id.to_s == g}
      @grouped << col if !col.nil?
      @used_cols << g
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
      @used_cols << col.id.to_s
      aggedIds[a['id']] = true
    end

    @unagged = []
    @ungrouped = []
    any_drill_downs = false
    @view.columns.each do |c|
      next if c.is_nested_table || c.client_type == 'tag' ||
        c.client_type == 'document_obsolete' || c.client_type == 'photo_obsolete' ||
        c.client_type == 'document' || c.client_type == 'photo' ||
        c.client_type == 'phone' || c.client_type == 'picklist'

      if aggedIds[c.id.to_s].nil?
        @unagged << c
      end
      if groupIds[c.id.to_s].nil?
        @ungrouped << c
      end

      any_drill_downs = true if c.format && c.format.drill_down == 'true'
    end

    @drill_down = any_drill_downs || @grouped.empty?

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
