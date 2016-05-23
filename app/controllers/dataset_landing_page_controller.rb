class DatasetLandingPageController < ActionController::Base
  def popular_views
    dataset_landing_page = DatasetLandingPage.new

    begin
      popular_views = dataset_landing_page.get_popular_views(params[:id], params[:limit], params[:offset])
    rescue CoreServer::ResourceNotFound
      return render :nothing => true, :status => :not_found
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => popular_views
  end
end
