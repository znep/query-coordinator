class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show, :widget_preview]
  layout 'dataset_v2'

  def show
    @view = get_view(params[:id])
    return if @view.nil?

    if !current_user
      @user_session = UserSession.new
    end

    # See if it matches the authoritative URL; if not, redirect (but only if we
    # aren't cheating and showing them the new datasets page)
    if request.path != @view.href && CurrentDomain.module_available?('new_datasets_page')
      # Log redirects in development
      if Rails.env.production? && request.path =~ /^\/dataset\/\w{4}-\w{4}/
        logger.info("Doing a dataset redirect from #{request.referrer}")
      end
      redirect_to(@view.href + '?' + request.query_string)
    end

  end

  def widget_preview
    @view = get_view(params[:id])
    return if @view.nil?

    @customization_id = params[:customization_id]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?

    render :layout => 'plain'
  end

  def edit_metadata
    if params[:view].nil?
      @view = get_view(params[:id])
      return if @view.nil?
    else
      if params[:view][:metadata] && params[:view][:metadata][:attachments]
        params[:view][:metadata][:attachments].delete_if { |a| a[:delete].present? }
      end
      begin
        # This sucks, but is necessary for the accessible version
        if params[:attachment_new]
          if (params[:view][:metadata].nil? || params[:view][:metadata][:attachments].nil?)
            params[:view].deep_merge!({ :metadata => { :attachments => []} } )
          end

          attachment = JSON.parse(
            CoreServer::Base.connection.multipart_post_file('/assets',
              params[:attachment_new]))

          params[:view][:metadata][:attachments] << {:blobId => attachment['id'],
            :filename => attachment['nameForOutput'],
            :name => attachment['nameForOutput']}
        end
        @view = View.update_attributes!(params[:id], params[:view])
        flash.now[:notice] = "The metadata has been updated."
      rescue CoreServer::CoreServerError => e
        return respond_to do |format|
          flash.now[:error] = "An error occurred during your request: #{e.error_message}"
        end
      end
    end
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

    if (view.is_form? ? !view.can_add? : !view.can_read?)
      require_user(true)
      return nil
    end

    return view
  end
end
