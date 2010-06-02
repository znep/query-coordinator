class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show]
  layout 'dataset_v2'

  def show

    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' or view cannot be found, or has been deleted.'
            return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        return require_user(true)
      elsif e.error_code == 'permission_denied'
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :forbidden)
      else
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    if (@view.is_form? ? !@view.can_add : !@view.can_read())
      return require_user(true)
    end

    if !current_user
      @user_session = UserSession.new
    end

    # Add this back once we flip this over to the main page
    # See if it matches the authoritative URL; if not, redirect
#    if request.path != @view.href
#      # Log redirects in development
#      if ENV["RAILS_ENV"] != 'production' &&
#        request.path =~ /^\/dataset\/\w{4}-\w{4}/
#        logger.info("Doing a dataset redirect from #{request.referrer}")
#      end
#      redirect_to(@view.href + '?' + request.query_string)
#    end

    @view.register_opening

  end
end
