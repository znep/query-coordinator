class WidgetsController < ApplicationController
  skip_before_filter :require_user
  caches_page :show
  layout 'widgets'

  GOV_OVERRIDES = %w{
    hhs.gov
    acf.hhs.gov
    aoa.gov
    ahrq.gov
    atsdr.cdc.gov
    cdc.gov
    cms.hhs.gov
    fda.gov
    hrsa.gov
    ihs.gov
    nih.gov
    oig.hhs.gov
    samhsa.gov
    gsa.gov
  }

  def show
    @variation = params[:variation]
    if @variation.blank? 
      
      @variation = "normal"
      if !request.referrer.nil? 
        # Check the referrer
        m = request.referrer.match(/^\w+:\/\/([a-zA-Z0-9_\-.]+\.(\w{3}))(:|\/)/)
        
        # TLD Check, until we have GSA approval marking
        if m && m[1].include?("whitehouse.gov")
          @variation = 'whitehouse'
        elsif m && !GOV_OVERRIDES.reject { |domain| !m[1].include? domain }.empty?
          @variation = 'gov'
        end
      end
      
      return redirect_to("/widgets/#{params[:id]}/#{@variation}")
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

    @meta_description = Helper.instance.meta_description(@view)
    @meta_keywords = Helper.instance.meta_keywords(@view)
    
    @is_gov_widget = @variation == 'gov' || @variation == 'whitehouse'
  end
end

class Helper
  include Singleton
  include ApplicationHelper
end
