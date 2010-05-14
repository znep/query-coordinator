class WidgetsNewController < ApplicationController
  skip_before_filter :require_user
  layout 'widgets_new'

  def show
    if params[:customization_id].blank?
      return redirect_to(params.merge!(
        :customization_id => CurrentDomain.default_widget_customization_id))
    end

    begin
      @widget_customization = WidgetCustomization.find(params[:customization_id])
    rescue CoreServer::CoreServerError => e
      flash.now[:error] = e.error_message
      return (render 'shared/error', :status => :not_found)
    end

    @theme = @widget_customization.customization

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
  end
end