class GroupingsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])

    @grouped = []
    @ungrouped = []
    groupIds = {}
    @view.query.groupBys.each do |g|
      @grouped << @view.columns.find {|c| c.id == g['columnId']}
      groupIds[g['columnId']] = true
    end

    @agged = []
    @unagged = []
    @view.columns.each do |c|
      if !c.format.nil? && c.format.data.has_key?('grouping_aggregate')
        @agged << c
      else
        @unagged << c
      end
      if !groupIds[c.id]
        @ungrouped << c
      end
    end

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
