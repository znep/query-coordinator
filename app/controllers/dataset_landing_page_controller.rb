class DatasetLandingPageController < ActionController::Base
  def featured_views
    dataset_landing_page = DatasetLandingPage.new

    begin
      featured_views = dataset_landing_page.get_featured_views(params[:id], params[:limit], params[:offset])
    rescue CoreServer::ResourceNotFound
      return render :nothing => true, :status => :not_found
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => featured_views
  end
end
