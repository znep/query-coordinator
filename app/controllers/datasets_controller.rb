class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show, :widget_preview]
  layout 'dataset_v2'

  def show
    if !CurrentDomain.module_available?('new_datasets_page')
      return render_404
    end

    @view = get_view(params[:id])
    return if @view.nil?

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

  end

  def widget_preview
    @view = get_view(params[:id])
    return if @view.nil?

    @customization_id = params[:customization_id]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?

    render :layout => 'plain'
  end

protected
  def get_view(id)
    begin
      view = View.find(id)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' or view cannot be found, or has been deleted.'
      render 'shared/error', :status => :not_found
      return nil
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return nil
      elsif e.error_code == 'permission_denied'
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :forbidden
        return nil
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return nil
      end
    end

    if (view.is_form? ? !view.can_add : !view.can_read())
      require_user(true)
      return nil
    end

    return view
  end
end
