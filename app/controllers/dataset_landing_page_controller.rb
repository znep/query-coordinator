class DatasetLandingPageController < ApplicationController
  include ApplicationHelper
  include CommonMetadataMethods

  skip_before_filter :require_user

  def related_views
    begin
      related_views = dataset_landing_page.get_derived_views(
        params[:id],
        forwardable_session_cookies,
        request_id,
        params[:limit],
        params[:offset]
      )
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => related_views
  end

  def get_featured_content
    begin
      featured_content = dataset_landing_page.get_featured_content(
        params[:id],
        forwardable_session_cookies,
        request_id
      )
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => featured_content
  end

  def get_derived_views
    # can be name, date, or most_accessed
    sort_by = params[:sort_by] || 'most_accessed'

    begin
      derived_content = dataset_landing_page.get_derived_views(
        params[:id],
        forwardable_session_cookies,
        request_id,
        nil,
        nil,
        sort_by
      )
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => derived_content
  end

  def post_featured_content
    begin
      featured_item = dataset_landing_page.add_featured_content(
        params[:id],
        request.body.read,
        forwardable_session_cookies,
        request_id
      )
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => featured_item
  end

  def delete_featured_content
    begin
      featured_item = dataset_landing_page.delete_featured_content(params[:id], params[:position])
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => featured_item
  end

  def get_formatted_view_by_id
    begin
      view = dataset_landing_page.get_formatted_view_widget_by_id(
        params[:id],
        forwardable_session_cookies,
        request_id
      )
    rescue CoreServer::ResourceNotFound => error
      return render :json => error.message, :status => :not_found
    rescue CoreServer::CoreServerError => error
      return render :json => error.message, :status => :internal_server_error
    end

    render :json => view
  end

  private

  def dataset_landing_page
    @dataset_landing_page ||= DatasetLandingPage.new
  end
end
