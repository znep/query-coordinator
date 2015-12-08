class WidgetsController < ApplicationController
  skip_before_filter :require_user, :disable_frame_embedding
  layout 'widgets'

  def show
    begin
      if params[:customization_id] == 'default' ||
        !params[:customization_id].match(/\w{4}-\w{4}/)
        @theme_id = 'default'
        @theme = WidgetCustomization.default_theme(1)
      else
        @theme_id = params[:customization_id]
        @theme = WidgetCustomization.find(params[:customization_id]).customization

        # complain if we see an out of date 4-4, so the rescue catches it
        throw "invalid widget format (version 0)" if @theme[:version] != 1
      end
    rescue
      begin
        @theme_id = CurrentDomain.default_widget_customization_id
        @theme = WidgetCustomization.find(@theme_id).customization

        # complain if we see an out of date 4-4, so the rescue catches it
        throw "invalid widget format (version 0)" if @theme[:version] != 1
      rescue
        # unless people are mucking around with the db directly, this
        # should never happen (only if a domain has no default customization),
        # but let's be safe.
        @theme_id = 'default'
        @theme = WidgetCustomization.default_theme(1)
      end
    end

    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This dataset or view cannot be found, or has been deleted.'
      return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        flash.now[:error] = 'This dataset is currently private.'
        return (render 'shared/error', :status => :unauthorized )
      else
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end
    if !@view.is_public? && !is_mobile? && !@view.can_read?
      flash.now[:error] = 'This dataset is currently private.'
      return (render 'shared/error', :status => :unauthorized)
    end

    @display = @view.display

    needs_view_js @view.id, @view
    if @view.is_form?
      render :action => 'show_form'
    else
      render
    end
  end

  def flag_check
    @view = View.find(params[:id])
    return if @view.nil?

    respond_to do |format|
      format.data { render :json => FeatureFlags.derive(@view, request, true) }
    end
  end
end
