class WidgetsNewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_new'

  def show
    if params[:customization_id].blank? ||
       params[:customization_id] == 'normal' ||  # support older
       params[:customization_id] == 'black'      # widget format
      return redirect_to(params.merge!(
        :customization_id => CurrentDomain.default_widget_customization_id))
    elsif !params[:customization_id].match(/\w{4}-\w{4}/) &&
           params[:customization_id] != 'default'
      return render_404
    end

    begin
      if params[:customization_id] == 'default'
        @theme = WidgetCustomization.default_theme(1)
      else
        @theme = WidgetCustomization.find(params[:customization_id]).customization
      end
    rescue CoreServer::ResourceNotFound
      begin
        @theme = WidgetCustomization.find(CurrentDomain.default_widget_customization_id).customization
      rescue CoreServer::CoreServerError => e
        # unless people are mucking around with the db directly, this
        # should never happen (only if a domain has no default customization),
        # but let's be safe.
        @theme = WidgetCustomization.default_theme(1)
      end
    end

    if !@theme[:version].present?
      return redirect_to(params.merge!(:controller => 'widgets', :action => 'show'))
    end

    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
        ' cannot be found, or has been deleted.'
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
    if !@view.is_public?
      flash.now[:error] = 'This dataset is currently private.'
      return (render 'shared/error', :status => :unauthorized)
    end

    @display = @view.display

    if @view.is_form?
      render :action => 'show_form'
    else
      render
    end
  end
end
