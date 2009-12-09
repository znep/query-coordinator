class GroupingsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  def index
    @view = View.find(params[:blist_id])
    @grouped = []
    @ungrouped = []
    @agged = []
    @unagged = []
    @view.columns.each do |c|
      @ungrouped << c
      @unagged << c
    end

    @aggregate_functions = [
      {'name' => 'Sum', 'value' => 'sum'},
      {'name' => 'Count', 'value' => 'count'},
      {'name' => 'Average', 'value' => 'avg'},
      {'name' => 'Minimum', 'value' => 'min'},
      {'name' => 'Maximum', 'value' => 'max'}
    ]

    respond_to do |format|
      format.html { redirect_to @view.href }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
