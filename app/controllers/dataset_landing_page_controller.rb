class DatasetLandingPageController < ApplicationController
  include ApplicationHelper
  include CommonMetadataMethods

  before_filter :hook_auth_controller
  before_filter :initialize_current_user

  def popular_views
    begin
      popular_views = dataset_landing_page.get_popular_views(
        params[:id],
        forwardable_session_cookies,
        request_id,
        params[:limit],
        params[:offset]
      )
    rescue CoreServer::ResourceNotFound
      return render :nothing => true, :status => :not_found
    rescue CoreServer::CoreServerError
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => popular_views
  end

  def get_featured_content
    begin
      featured_content = dataset_landing_page.get_featured_content(params[:id])
    rescue CoreServer::ResourceNotFound
      return render :nothing => true, :status => :not_found
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => featured_content
  end

  def get_related_views
    # can be name, date, or most_accessed
    sort_by = params[:sort_by] || 'most_accessed'

    begin
      related_content = dataset_landing_page.get_related_views(params[:id], sort_by)
    rescue CoreServer::ResourceNotFound
      return render :nothing => true, :status => :not_found
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => related_content
  end

  def post_featured_content
    begin
      featured_item = dataset_landing_page.add_featured_content(params[:id], request.body.read)
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => featured_item
  end

  def delete_featured_content
    begin
      featured_item = dataset_landing_page.delete_featured_content(params[:id], params[:position])
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => featured_item
  end

  def get_formatted_view_by_id
    begin
      view = dataset_landing_page.get_formatted_view_widget_by_id(params[:id])
    rescue CoreServer::CoreServerError => e
      return render :nothing => true, :status => :internal_server_error
    end

    render :json => view
  end

  private

  def initialize_current_user
    current_user_session
  end

  def dataset_landing_page
    @dataset_landing_page ||= DatasetLandingPage.new
  end
end
