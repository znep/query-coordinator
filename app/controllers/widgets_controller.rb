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
  
  DEFAULT_THEME = {
    :style    => { :custom_stylesheet => 'normal',
                   :font_family => "arial, sans-serif",
                   :font_size => "62.5%" },
    :frame    => { :color => "#06386A",
                   :gradient => true,
                   :drop_shadow => true,
                   :title => true,
                   :icon_color => "blue",
                   :display_logo => true,
                   :logo_source => "TODO",
                   :powered_by => true },
    :grid     => { :row_numbers => false,
                   :wrap_header_text => false,
                   :header_icons => false,
                   :row_height => 16,
                   :zebra => true },
    :menu     => { :email => true,
                   :subscribe  => { :rss => true,
                                    :atom => true,
                                    :email => true },
                   :api => true,
                   :download => true,
                   :print => true,
                   :fullscreen => true,
                   :republish => true },
    :meta     => { :comments   => { :show => true, :order => 0, :display_name => 'Comments' },
                   :views      => { :show => true, :order => 1, :display_name => 'Views' },
                   :publishing => { :show => true, :order => 2, :display_name => 'Publishing' },
                   :activity   => { :show => true, :order => 3, :display_name => 'Activity' },
                   :summary    => { :show => true, :order => 4, :display_name => 'Summary' } },
    :behavior => { :rating => true,
                   :save_public_views => true,
                   :interstitial => false,
                   :ga_code => '' }
  }

  def show
    @variation = params[:variation]
    @theme = DEFAULT_THEME

    @options = params[:options]
    if @variation.blank? 
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
    
    #If we're using "meta" variation, add the meta tabs and save filter bar
    if !@options.nil? && @options == "meta"
      @theme[:behavior][:save_public_views] = true

      @theme[:meta].each_value{ |meta_tab| meta_tab[:show] = false }
      @theme[:meta][:comments][:show] = true
      @theme[:meta][:summary][:show] = true
    else
      # They're disabled by default until they're ready
      @theme[:behavior][:save_public_views] = false

      @theme[:meta].each_value{ |meta_tab| meta_tab[:show] = false }
    end
    
    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
        ' cannot be found, or has been deleted.'
      return (render 'shared/error')
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        flash[:error] = 'You do not have permissions to view this ' +
          I18n.t(:blist_name).downcase
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
    
    # Todo: grab the theme for the given token here if applicable

    @meta_description = Helper.instance.meta_description(@view)
    @meta_keywords = Helper.instance.meta_keywords(@view)
    
    @is_gov_widget = @variation == 'gov' || @variation == 'whitehouse'
    
    # Wire in custom behaviors for whitehouse/gov
    @theme[:style][:custom_stylesheet] = @variation
    if @is_gov_widget
      @theme[:behavior][:interstitial] = true
      @theme[:frame][:display_logo] = false
    end
  end
end

class Helper
  include Singleton
  include ApplicationHelper
end
