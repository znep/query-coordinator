class ColumnsController < ApplicationController
  # TODO: Customize this so that rendering an error also renders an error
  # message instead of being relatively useless.
  rescue_from('CoreServer::CoreServerError') { |exception| render_500_error(exception) }

  def render_500_error(exception)
    set_locale
    respond_to do |format|
      format.all { render :text => {:error => exception.error_message}.to_json, :status => 500}
    end
    true
  end

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
