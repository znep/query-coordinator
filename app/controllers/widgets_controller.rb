class WidgetsController < ApplicationController
  skip_before_filter :require_user
  caches_page :show
  layout 'widgets'

  def show
    @variation = params[:variation]
    if (@variation.blank? && request.referrer &&
        (m = request.referrer.match(/^\w+:\/\/[a-zA-Z0-9_\-.]+\.(\w{3})(:|\/)/)))
      if m[1] == 'gov' || m[1] == 'mil'
        redirect_to('/widgets/' + params[:id] + '/gov')
      end
    end
    # HACK: Support old template options
    if (!params[:template].blank? &&
        (tm = params[:template].match(/(\w+)_template\.html/)))
      redirect_to('/widgets/' + params[:id] + '/' + tm[1])
    end

    begin
      @view = View.find(params[:id])
    rescue CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        flash[:error] = 'You do not have permissions to view this ' +
          I18n.t(:blist_name).downcase
        return (render 'shared/error')
      elsif e.error_code == 'not_found'
        flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
          ' cannot be found, or has been deleted.'
        return (render 'shared/error')
      else
        flash[:error] = e.error_message
        return (render 'shared/error')
      end
    end
    if !@view.can_read()
      flash[:error] = 'You do not have permissions to view this ' +
        I18n.t(:blist_name).downcase
      return (render 'shared/error')
    end

    if @variation.blank? && @view.category &&
      @view.category.downcase == 'government'
      @variation = 'gov'
    end
    @is_gov_widget = @variation == 'gov' || @variation == 'whitehouse'
  end
end
