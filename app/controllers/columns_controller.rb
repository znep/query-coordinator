class ColumnsController < ApplicationController
  def render_500_error(exception)
    respond_to do |format|
      format.all { render :text => {:error => exception.error_message}.to_json, :status => 500}
    end
    true
  end

  def create
    column_json = JSON.parse(params[:json])
    @parent = params[:parent]
    respond_to do |format|
      format.all { render(:json => Column.create(params[:blist_id], column_json, @parent)) }
    end
  rescue CoreServer::CoreServerError => e
    render_500_error(e)
  end

  def new
    @view_id = params[:blist_id]
    @column = Column.parse("{}")
    @parent = params[:parent]
    @type = params[:type]

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def show
    @view = View.find(params[:blist_id])
    @column = Column.find(params[:blist_id], params[:id])
    @parent = params[:parent]
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def update 
    @column = Column.find(params[:blist_id], params[:id])
    column_json = JSON.parse(params[:json])

    @column.update(column_json)

    respond_to do |format|
      format.data { render :json => @column.save!(params[:blist_id]) }
    end
  rescue CoreServer::CoreServerError => e
    render_500_error(e)
  end
end
