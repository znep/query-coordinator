class WidgetsController < ApplicationController
  skip_before_filter :require_user
  caches_page :show
  layout 'widgets'

  def show
    @variation = params[:variation]
    if @variation.blank? 
      
      @variation = "normal"
      if !request.referrer.nil? 
        # Check the referrer
        m = request.referrer.match(/^\w+:\/\/([a-zA-Z0-9_\-.]+\.(\w{3}))(:|\/)/)
        
        # TLD Check
        if m && m[1].include?("whitehouse.gov")
          @variation = 'whitehouse'
        elsif m && (m[2] == 'gov' || m[2] == 'mil')
          @variation = 'gov'
        end
      end
      
      redirect_to("/widgets/#{params[:id]}/#{@variation}")
    end
    
    # HACK: Support old template options
    if (!params[:template].blank? &&
        (tm = params[:template].match(/(\w+)_template\.html/)))
      return redirect_to('/widgets/' + params[:id] + '/' + tm[1])
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

    # Force us back to the gov variation if this dataset is categorized government
    if @view.category &&
      @view.category.downcase == 'government' &&
      @variation != 'gov' &&
      
      @variation = 'gov'
    end

    @is_gov_widget = @variation == 'gov' || @variation == 'whitehouse'
  end
end
