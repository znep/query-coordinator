class ColumnsController < ApplicationController
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
      format.data { render :json => 
          {
            :status => "success", 
            :column => @column.save!(params[:blist_id])
          } 
      }
    end
  rescue CoreServerError => e
    respond_to do |format|
      format.data { render :json => 
          {
            :status => "failure", 
            :error => e.error_message 
          } 
      }
    end
  end
end
