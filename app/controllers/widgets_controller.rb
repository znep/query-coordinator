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
    @theme = WidgetCustomization.default_theme

    @options = params[:options]
    if @variation.blank? && params[:customization_id].blank?
      @variation = 'normal'

      if !request.referrer.nil? 
        # Check the referrer
        m = request.referrer.match(/^\w+:\/\/([a-zA-Z0-9_\-.]+\.(\w{3}))(:|\/)/)
        
        # TLD Check, until we have GSA approval marking
        if m && m[1].include?("whitehouse.gov")
          @variation = 'whitehouse'
        elsif m && GOV_OVERRIDES.any? { |domain| m[1].include? domain }
          @variation = 'gov'
        end
      end
      
      return redirect_to(params.merge!(:controller => "widgets", :action => "show", :variation => @variation))
      
    end
    
    # HACK: Support old template options
    if (!params[:template].blank? &&
        (tm = params[:template].match(/(\w+)_template\.html/)))
      return redirect_to('/widgets/' + params[:id] + '/' + tm[1])
    end
    
    if params[:customization_id]
      begin
        @theme.merge!(WidgetCustomization.find(params[:customization_id]).customization)
      rescue CoreServer::CoreServerError => e
        flash[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
        ' cannot be found, or has been deleted.'
      return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        flash[:error] = 'You do not have permissions to view this ' +
          I18n.t(:blist_name).downcase
        return (render 'shared/error', :status => :unauthorized )
      else
        flash[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end
    if !@view.can_read()
      flash[:error] = 'You do not have permissions to view this ' +
        I18n.t(:blist_name).downcase
      return (render 'shared/error', :status => :unauthorized)
    end

    @meta_description = Helper.instance.meta_description(@view)
    @meta_keywords = Helper.instance.meta_keywords(@view)
    
    @is_gov_widget = @variation == 'gov' || @variation == 'whitehouse'
    
    # Wire in custom behaviors for whitehouse/gov
    @theme[:style][:custom_stylesheet] = @variation
    if @variation == 'whitehouse'
      @theme[:meta].each_value{ |meta_tab| meta_tab[:show] = false }
    end
    if @is_gov_widget
      @theme[:behavior][:interstitial] = true
      @theme[:frame][:logo] = 'none'
    end

    # Wire in custom behaviors for black
    if @variation == 'black'
      @theme[:frame][:color] = '#666666'
    end
  end
  
  def meta_tab_header
    if (!params[:tab])
      return
    end
    
    @tabKey = params[:tab]
    @view = View.find(params[:id])
    render_tab_header(@tabKey, @view)
  end
  
  def meta_tab
    if (!params[:tab])
      return
    end
    
    @tabKey = params[:tab]
    @view = View.find(params[:id])
    if (@tabKey == "activity")
      @view_activities = Activity.find({:viewId => @view.id})
    end
    render_tab(@tabKey, @view)
  end

private
  def render_tab_header(name, view)
    locals = {:view => view, :page_single => false,
                        :allow_edit => false, :in_widget => true,
                        :allow_commenting => false }

    widget_partial_path = File.join(Rails.root, 'app', 'views', 'widgets', "_info_#{name}_header.erb")
    if File.exist? widget_partial_path
      render :partial => "info_#{name}_header", :locals => locals
    else
      render :partial => "blists/info_#{name}_header", :locals => locals
    end
  end

  def render_tab(name, view)
    locals = { :view => view, :page_single => false,
                            :allow_edit => false, :in_widget => true,
                            :allow_commenting => false,
                            :customization_id => params[:customization_id] }

    widget_partial_path = File.join(Rails.root, 'app', 'views', 'widgets', "_meta_tab_#{name}.erb")
    if File.exist? widget_partial_path
      render :partial => "meta_tab_#{name}", :locals => locals
    else
      render :partial => "blists/meta_tab_#{name}", :locals => locals
    end
  end
end

class Helper
  include Singleton
  include ApplicationHelper
end
