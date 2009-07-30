class ColumnsController < ApplicationController
  # TODO: Customize this so that rendering an error also renders an error
  # message instead of being relatively useless.
  rescue_from('CoreServer::CoreServerError') { |exception| render_500 }

  def show
    @view_id = params[:blist_id]
    @column = Column.find(params[:blist_id], params[:id])
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
  end
end
