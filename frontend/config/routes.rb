Rails.application.routes.draw do
  # NOTE: Currently socrata-analytics.js is dependent on path structure for accurately tracking metrics.
  # If you decide to change how pages are routed please reflect your changes in socrata-analytics 'determine_page_type'

  # Note: When debugging in the Rails console, it is often helpful to review the methods implemented here:
  # puts Rails.application.routes.url_helpers.methods.sort
  # Also, one can test the helpers with the Applications instance. e.g. app.view_url

  mount SocrataSiteChrome::Engine => 'socrata_site_chrome'

  # styling routes
  scope :path => '/styles', :controller => 'styles' do
    get '/individual/:path.css', :action => 'individual',
      :constraints => { :path => /(\w|-|\.|\/)+/ }
    get '/merged/:stylesheet.css', :action => 'merged'
    get '/widget/:customization_id.css', :action => 'widget'
    get '/current_site.css', :action => 'current_site'
    get '/govstat_site.css', :action => 'govstat_site'
  end

  # optional locale scope for all routes to teach rails how to make links
  scope '(:locale)', :locale => /en|it|es|fr|zh|nyan/ do

    # Open Performance pages
    get '/stat/version(.:format)' => 'odysseus#version'
    scope :controller => 'odysseus'do
      scope :action => 'chromeless' do
        get '/stat/goals/single/:goal_id/embed'
        get '/stat/goals/single/:goal_id/embed/edit'
        get '/stat/goals/:dashboard_id/:category_id/:goal_id/embed'
      end

      # Goal narratives are in the process of being migrated to the Storyteller infrastructure.
      # These two routes are for a goal's "classic" view using the old narrative renderer.
      # We will redirect the user to Storyteller if the "classic" view is nonsensical
      # for this goal.
      get '/stat/goals/single/:goal_id/view', :action => 'classic_single_goal'
      get '/stat/goals/:dashboard_id/:category_id/:goal_id/view', :action => 'classic_goal'
      get '/stat/goals/:dashboard_id/:category_id/:goal_id/edit-classic', :action => 'classic_goal_edit'
      get '/stat/goals/single/:goal_id/edit-classic', :action => 'classic_single_goal_edit'

      # Dashboards can be seen with public anonymity by appending /preview.
      get '/stat/goals/:dashboard_id/preview', :action => 'dashboard_preview'

      scope :action => 'index' do
        get '/stat', :as => 'govstat_root'
        get '/stat/goals', :as => 'govstat_goals'
        get '/stat/my/goals', :as => 'govstat_my_goals'
        get '/stat/goals/single/:goal_id/edit', :as => 'govstat_single_goal_edit'
        get '/stat/goals/:dashboard_id', :as => 'govstat_dashboard'
        get '/stat/goals/:dashboard_id/edit', :as => 'govstat_dashboard_edit'
        match '/stat/goals/:dashboard_id/:category_id/:goal_id/edit', :as => 'govstat_goal_edit', :via => [:get, :post]

        # These two routes will shortly be repointed to Storyteller.
        # They represent the counterpart to the "classic" views above.
        # We should still be able to serve these while we work to get Storyteller ready.
        get '/stat/goals/single/:goal_id', :as => 'govstat_single_goal'
        get '/stat/goals/:dashboard_id/:category_id/:goal_id', :as => 'govstat_goal'

        # EN-18858: Direct OP data catalog links to SIAM if it is enabled
        get '/stat/data',
          :to => redirect('/admin/assets'),
          :constraints => FeatureFlags::RoutingConstraint.new(:use_internal_asset_manager)
        get '/stat/data',
          :as => 'govstat_data',
          :constraints => !FeatureFlags::RoutingConstraint.new(:use_internal_asset_manager)
      end
    end

    scope :path => '/internal', :controller => 'internal' do
      get '/', :action => 'index'
      get '/analytics', :action => 'analytics'
      get '/tiers', :action => 'index_tiers'
      get '/tiers/:name', :action => 'show_tier'
      get '/modules', :action => 'index_modules'
      get '/demos', :action => 'demos'

      namespace :demos do
        scope :controller => 'demos' do
          get '/', :action => 'index'
        end

        scope :controller => 'icons' do
          get '/icons', :action => 'index'
        end

        scope :controller => 'components' do
          get '/components', :action => 'index'

          # Automatically add a route for each demo page.
          match 'components(/:action)', :via => :get
        end

        scope :controller => 'elements' do
          get '/elements', :action => 'index'

          # Automatically add a route for each demo page.
          match 'elements(/:action)', :via => :get
        end

        scope :controller => 'visualizations' do
          get '/visualizations', :action => 'index'

          # Automatically add a route for each demo page.
          match 'visualizations(/:action)', :via => :get
        end
      end

      get :config_info
      get :domains_summary
      get :organization_list
      get :feature_flag_report
      get :signaller_version
      post :update_feature_flags_on_multiple_domains
      post :set_environment_feature_flag

      get :find_deleted_user
      post :find_deleted_user
      post :undelete_user

      post '/orgs', :action => 'create_org'
      get '/orgs', :action => 'index_orgs'
      get '/orgs/:org_id', :action => 'show_org', :as => 'show_org'
      post '/orgs/:org_id/domains', :action => 'create_domain'
      post '/rename_org/:org_id', :action => 'rename_org', :as => 'rename_org'

      scope :path => '(/orgs/:org_id)/domains/:domain_id',
        :constraints => {:domain_id => /(\w|-|\.)+/} do
        get '', :action => 'show_domain', :as => 'show_domain'
        post '', :action => 'update_domain', :as => 'update_domain'
        get '/data', :action => 'show_domain', :format => :json, :as => 'show_domain_data'
        post '/default_site_config', :action => 'set_default_site_config'
        post '/delete_domain', :action => 'delete_domain'
        post '/undelete_domain', :action => 'undelete_domain'
        post '/delete_config/:config_id', :action => 'delete_site_config', :as => 'delete_site_config'
        post '/rename_config/:config_id', :action => 'rename_site_config', :as => 'rename_config'
        post '/feature', :action => 'set_features', :as => 'set_features'
        post '/aliases', :action => 'update_aliases', :as => 'update_aliases'
        post '/module_feature', :action => 'add_a_module_feature', :as => 'add_module_feature'
        post '/account_modules', :action => 'add_module_to_domain'
        post '/flush_cache', :action => 'flush_cache'
        get '/feature_flags(/:category)', :action => 'feature_flags', :as => 'feature_flags_config'
        post '/set_feature_flags', :action => 'set_feature_flags', :as => 'update_feature_flags'

        scope :path => '/site_config' do
          post '', :action => 'create_site_config', :as => 'create_site_config'
          scope :path => '/:config_id' do
            get '', :action => 'show_config', :as => :show_config
            post '/property', :action => 'set_property', :as => 'set_property'
            get '/edit_property', :action => 'show_property', :as => 'show_property'
          end
        end
      end
    end

    scope :controller => 'internal_asset_manager' do
      get '/admin/assets',
        :action => 'show',
        :constraints => Constraints::InternalAssetManagerBetaConstraint.new

      get '/admin/datasets',
        :action => 'show',
        :constraints => FeatureFlags::RoutingConstraint.new(:use_internal_asset_manager)
    end

    scope :controller => 'approvals' do
      get '/admin/approvals',
        :action => 'show',
        :constraints => FeatureFlags::RoutingConstraint.new(:enable_approvals_beta)
    end

    scope :path => '/admin', :controller => 'administration' do
      get '/', :action => :index
      get :analytics
      get :federations
      get :users
      get :comment_moderation
      get :sdp_templates
      get :datasets # Once we no longer use the use_internal_asset_manager feature flag, 💀 this route
      post :initialize_asset_inventory
      get :data_slate, :as => 'canvas_admin', :action => 'canvas_pages'
      get 'data_slate/create', :as => 'canvas_create', :action => 'create_canvas_page'
      post 'data_slate/create', :action => 'post_canvas_page'
      get 'geo', :action => :georegions, :as => 'georegions_administration'
      get 'geo/candidate/:id', :action => :georegion_candidate, :format => 'json'
      get 'geo/:id', :action => :georegion, :format => 'json'
      get 'geo/:id/configure', :action => :configure_boundary
      post 'geo', :action => :add_georegion
      post 'geo/poll', :action => :poll_georegion_jobs
      match 'geo/:id/enable', :action => :enable_georegion, :via => [:put, :post]
      match 'geo/:id/disable', :action => :disable_georegion, :via => [:put, :post]
      match 'geo/:id/:default_flag', :action => :set_georegion_default_status, :via => [:put, :post]
      match 'geo/:id', :action => :edit_georegion, :via => [:put, :post]
      delete 'geo/:id', :action => :remove_georegion
      get :home, :as => 'home_administration'
      get :metadata, :as => 'metadata_administration'

      scope :controller => 'administration/activity_feed', :path => '/jobs' do
        get '', to: redirect('/admin/activity_feed')
        get '/:id', to: redirect('/admin/activity_feed/%{id}')
      end

      scope :controller => 'administration/activity_feed', :path => '/activity_feed' do
        get '', :action => :index, :as => 'activity_feed_administration'
        get '/:id', :action => 'show'
      end

      scope :controller => 'administration/roles', :path => '/roles' do
        get '', :action => :index, :as => 'roles_administration'
      end

      get :views
      put :save_featured_views
      get :goals

      scope :controller => 'administration/routing_approval', :path => '/routing_approval' do
        get '', :action => :index, :as => 'routing_approval_administration'

        get '/queue', :action => 'queue'
        post '/view/:id/set/:approval_type', :action => 'approve_view', :constraints => {:id => Frontend::UID_REGEXP}
        get '/manage', :action => 'manage'
        post '/manage', :action => 'manage_save'
      end

      scope :controller => 'administration/connector', :path => '/connectors' do
        get '/', :action => 'connectors', :as => 'connectors'
        post '/', :action => 'create_connector'
        get '/new', :action => 'new_connector', :as => 'new_connector'
        get '/:server_id/edit', :action => 'edit_connector', :as => 'edit_connector'
        get '/:server_id', :action => 'show_connector', :as => 'show_connector'
        post '/:server_id', :action => 'update_connector', :as => 'update_connector'
        delete '/:server_id/delete', :action => 'delete_connector'
      end

      put '/users/:user_id/promote/:role', :action => 'set_user_role'
      put '/users/update', :action => 'set_user_role'
      post '/users/:user_id/reset_password', :action => 'reset_user_password'
      post '/users/:user_id/enable_account', :action => 're_enable_user'
      delete '/users/future/:id/delete', :action => 'delete_future_user'
      post '/users/bulk_create', :action => 'bulk_create_users'
      post '/sdp_templates', :action => 'sdp_template_create'
      get '/sdp_templates/:id', :action => 'sdp_template'
      put '/sdp_templates/:id/set_default', :action => 'sdp_set_default_template'
      delete '/sdp_templates/:id/delete', :action => 'sdp_delete_template'
      delete '/federations/:id/delete', :action => 'delete_federation'
      post '/federations/:id/accept', :action => 'accept_federation'
      post '/federations/:id/reject', :action => 'reject_federation'
      post '/federations/create', :action => 'create_federation'

      post '/metadata/:fieldset/create', :action => 'create_metadata_field'
      put '/metadata/save_field', :action => 'save_metadata_field'
      delete '/metadata/:fieldset/delete', :action => 'delete_metadata_fieldset'
      post '/metadata/create_fieldset', :action => 'create_metadata_fieldset'
      delete '/metadata/:fieldset/:index/delete', :action => 'delete_metadata_field'
      put '/metadata/:fieldset/:index/toggle/:option', :action => 'toggle_metadata_option'
      put '/metadata/:fieldset/:field/move/:direction', :action => 'move_metadata_field'
      post '/metadata/create_category', :action => 'create_category'
      post '/metadata/update_category', :action => 'update_category'
      delete '/metadata/delete_category', :action => 'delete_category'
      post '/home/stories', :action => 'create_story'
      put '/home/stories/:id/:other', :action => 'move_story'
      put '/home/stories/appearance', :action => 'update_stories_appearance'
      get '/home/stories/appearance', :action => 'stories_appearance'
      get '/home/story/new', :action => 'new_story'
      match '/home/story/:id', :action => 'edit_story', :via => [:get, :post]
      delete '/home/story/:id/delete', :action => 'delete_story'
      post '/home/catalog_config', :action => 'modify_catalog_config'
      post '/datasets/sidebar_config', :action => 'modify_sidebar_config'
      post '/views/:id/set/:approved', :action => 'set_view_moderation_status',
        :constraints => {:id => Frontend::UID_REGEXP}

      get '/configuration', :action => 'configuration'
      get '/flag_out_of_date', :action => 'flag_out_of_date'

      get '/asset_inventory', :action => 'asset_inventory'
    end

    # Site Chrome is the custom header/footer (chrome like a car bumper, right?)
    get '/admin/site_chrome', :to => redirect('/admin/site_appearance')
    get '/admin/site_appearance', :as => 'edit_site_appearance', :controller => 'site_appearance', :action => 'edit'
    put '/admin/site_appearance', :as => 'update_site_appearance', :controller => 'site_appearance', :action => 'update'

    get '/templates/:id', :controller => 'remote_partials', :action => :templates
    get '/modals/:id', :controller => 'remote_partials', :action => :modals

    get '/translations/*locale_parts' => 'translations#get'

    # Note! The order of matchers in this file is important. Please don't move this line without thorough testing.
    scope :controller => 'catalog_landing_page' do
      scope :path => '/catalog_landing_page' do
        get '/manage', :action => :manage
        put '/manage', :action => :manage_write
      end
      get '*custom_path', :action => 'show', :constraints => Constraints::CatalogLandingPageConstraint.new
    end

    resource :browse, :controller => 'browse', :except => [ :create ] do
      collection do
        get :embed
        get :select_dataset
        get :select_georegion
        get :domain_info
      end
    end

    resources :nominate, :controller => 'nominations', :only => [ :index, :show, :new ]
    resources :videos, :only => [ :index ] do
      collection do
        get :popup
      end
    end

    # For legacy support reasons, make /home and /datasets go somewhere reasonable
    get '/home' => 'profile#index'
    get '/datasets' => 'profile#index'

    get '/analytics' => 'analytics#index'
    post '/analytics/add/:domain_entity/:metric' => 'analytics#add'
    post '/analytics/add' => 'analytics#add_all'

    scope :controller => 'profile', :path => '/profile',
          :constraints => {:id => Frontend::UID_REGEXP, :profile_name => /(\w|-)+/} do
      get 'account', :action => 'generic_account', :as => 'generic_account'
      get ':profile_name/:id/create_friend', :action => 'create_friend'
      get ':profile_name/:id/delete_friend', :action => 'delete_friend'
      # Profile SEO urls (only add here if the action has a view with it;
      # otherwise just add to the :member key in the profile resource above.)
      get ':profile_name/:id', :action => 'show', :as => 'profile'
      put ':profile_name/:id', :action => 'update', :as => 'profile_update'
      get ':profile_name/:id/edit', :action => 'edit', :as => 'edit_profile'
      get ':profile_name/:id/image', :action => 'edit_image', :as => 'image_profile'
      get ':profile_name/:id/app_tokens', :action => 'edit_app_tokens', :as => 'app_tokens'
      get ':profile_name/:id/app_tokens/:token_id', :action => 'show_app_token', :as => 'app_token'
      get 'app_tokens', :action => 'edit_app_tokens'
      match ':profile_name/:id/app_token/:token_id', :action => 'edit_app_token', :as => 'edit_app_token', :via => [:get, :post]
      post ':profile_name/:id/app_token/:token_id/delete', :action => 'delete_app_token', :as => 'delete_app_token'
      get ':profile_name/:id/account', :action => 'edit_account', :as => 'profile_account'
      get 'account', :action => 'edit_account'
    end

    resources :profile do
      member do
        get :create_friend
        get :delete_friend
      end
    end

    scope :controller => 'widgets', :constraints => {:id => Frontend::UID_REGEXP} do
      get 'widgets/:id/:customization_id', :action => 'show'
      get 'widgets/:id', :action => 'show'
      get 'w/:id/:customization_id', :action => 'show', :as => 'widget'
      get 'w/:id', :action => 'show', :as => 'themeless_widget'
    end

    resources :datasets, :only => [ :show, :new, :create ] do
      collection do
        get :upload
        get :external
        get :external_download
      end
      member do
        get :about
        post :validate_contact_owner
        post :contact_dataset_owner
        post :save_filter
        post :modify_permission
        post :post_comment
        post :update_rating
        match :email, :via => [:get, :post]
        get :append
        get :contact
        get :thumbnail
        get :working_copy
        get :publish
        get :delete_working_copy
      end
    end

    resources :resource do
      member do
        get :show
      end
    end

    scope :controller => 'catalog_landing_page', :path => '/browse', :constraints => Constraints::CatalogLandingPageConstraint.new do
      get '/', :action => 'show'
    end

    scope :controller => 'dataset_landing_page', :path => '/dataset_landing_page', :constraints => { :id => Frontend::UID_REGEXP } do
      get '/:id/related_views', :action => 'related_views'
      get '/:id/featured_content', :action => 'get_featured_content'
      post '/:id/featured_content', :action => 'post_featured_content'
      delete '/:id/featured_content/:position', :action => 'delete_featured_content'
      get '/formatted_view/:id', :action => 'get_formatted_view_by_id'
      get '/:id/derived_views', :action => 'get_derived_views'
    end

    scope :controller => 'visualization_canvas', :path => '/visualization_canvas', :constraints => { :id => Frontend::UID_REGEXP } do
      post '/', :action => 'create'
      put '/:id', :action => 'update'
    end

    scope :controller => 'new_ux_bootstrap', :constraints => { :id => Frontend::UID_REGEXP } do
      get '/view/bootstrap/:id', :action => 'bootstrap', :app => 'dataCards', as: 'new_data_lens'
      get '/dataset/:id/lens/new', :action => 'bootstrap', :app => 'dataCards'
    end

    # don't change the order of these two
    post '/view/vif.png', :controller => 'polaroid', :action => 'proxy_request'
    post '/view/vif', :controller => 'data_lens', :action => 'view_vif', :app => 'dataCards'

    scope :controller => 'data_lens', :constraints => Constraints::DataLensConstraint.new do
      # NOTE: The dataCards angular app is capable of rendering multiple views (Pages and Dataset Metadata, for instance).
      # As of 9/24/2014, the angular app itself figures out what particular view to render.
      # So if you change these routes, make sure public/javascripts/angular/dataCards/app.js is also updated to
      # reflect the changes.
      match '/view/:id', :action => 'data_lens', :app => 'dataCards', :as => :opendata_cards_view, :via => [:get, :post, :put, :delete]
    end

    get 'cetera/users', :controller => 'cetera', :action => 'fuzzy_user_search'
    get 'cetera/autocomplete', :controller => 'cetera', :action => 'autocomplete'

    scope do
      # Data Lens endpoint for a standalone add card page that uses dataset metadata
      match '/component/visualization/add', {
        :controller => 'data_lens',
        :action => 'visualization_add',
        :app => 'dataCards',
        :via => [:get, :post, :put]
      }

      # Used by Storyteller to visualize classic visualizations
      # as embeds.
      get '/component/visualization/v0/show', {
        :controller => 'classic_visualization',
        :action => 'show',
        :via => [:get, :post]
      }

      # Used by Polaroid and ImP to snap pictures of classic
      # visualizations.
      #
      # TODO: Use this endpoint and deprecate the Storyteller-specific
      # one above.
      get '/component/visualization/v0/:id', {
        :controller => 'classic_visualization',
        :action => 'show_by_id'
      }

      get '/component/visualization/v1/socrata-visualizations-loader.js', {
        :controller => 'visualization_embed_v1',
        :action => 'loader'
      }

      get '/component/visualization/v1/socrata-visualizations-embed.js', {
        :controller => 'visualization_embed_v1',
        :action => 'embed'
      }

    end

    # Dataset SEO URLs (only add here if the action has a view with it;
    # otherwise just add to the :member key in the datasets resource above.)
    scope '/:category/:view_name/:id', :controller => 'datasets', :constraints => Constraints::ResourceConstraint.new do
      get '/:row_id', :action => 'show', :as => :view_row, :constraints => { :row_id => /\d+/ }, :bypass_dslp => true
      get '/data', :action => 'show', :as => :data_grid, :bypass_dslp => true
      get '/widget_preview', :action => 'widget_preview', :as => :preview_view_widget
      get '/edit', :action => 'edit', :as => :edit_view
      get '/edit_rr', :action => 'edit_rr', :as => :edit_view_rr
      get '/thumbnail', :action => 'thumbnail', :as => :view_thumbnail
      get '/stats', :action => 'stats', :as => :view_stats
      get '/form_success', :action => 'form_success', :as => :view_form_success
      get '/about', :action => 'about', :as => :about_view
      get '/revisions/current(*rest_of_path)', :action => 'current_revision', :as => :current_revision
      get '/revisions/:revision_seq(*rest_of_path)', :action => 'show_revision', :as => :show_revision
      get '/visualization', :action => 'create_visualization_canvas'
      match '/alt', :action => 'alt', :via => [:get, :post], :as => :alt_view
      match '/flags', :action => 'flag_check', :via => [:get, :post], :as => :flag_check
      match '/edit_metadata', :action => 'edit_metadata', :via => [:get, :post], :as => :edit_view_metadata

      # Overloaded route matcher for SEO purposes.
      # The route structure is identical in each case; the handler for the route
      # is determined by the constraint that is satisfied.
      get '', :to => 'data_lens#data_lens', :app => 'dataCards', :constraints => Constraints::DataLensConstraint.new

      # Fallback: let DatasetsController#show handle it, since it was the original
      # catch-all for SEO-friendly routes (including charts, calendars, etc.).
      get '', :action => 'show', :as => :view
    end

    get 'proxy/wkt_to_wkid' => 'datasets#wkt_to_wkid'

    scope :controller => 'datasets', :constraints => { :id => Frontend::UID_REGEXP } do
      # Redirect bounce for metric snatching
      get 'download/:id/:type', :action => 'download', :constraints => {:type => /.*/}, :as => 'metric_redirect'

      # Short URLs
      get 'blob/:id', :action => 'blob'
      get 'dataset/:id', :action => 'show'
      get 'dataset/:id/stats', :action => 'stats'
      get 'dataset/:id/about', :action => 'about'
      get 'dataset/:id/edit', :action => 'edit'

      # The ":as" option, provides the short_view_url helper method
      get 'd/:id', :action => 'show', :as => :short_view
      get 'd/:id/alt', :action => 'alt'
      get 'd/:id/stats', :action => 'stats'
      get 'd/:id/about', :action => 'about'
      get 'd/:id/data', :action => 'show', :bypass_dslp => true
      match 'd/:id/edit_metadata', :action => 'edit_metadata', :via => [:get, :post]
      get 'd/:id/visualization', :action => 'create_visualization_canvas', :as => :create_visualization_canvas
      get 'd/:id/edit', :action => 'edit'

      get 'd/:id/revisions/current(*rest_of_path)', :action => 'current_revision'
      get 'd/:id/revisions/:revision_seq(*rest_of_path)', :action => 'show_revision'

      get 'd/:id/:row_id', :action => 'show', :constraints => {:row_id => /\d+/}, :bypass_dslp => true
    end

    # Semantic web cannoical URLs
    %w{resource id}.each do |prefix|
      get "#{prefix}/:name(/:row_id)(.:format)" => 'resources#show'
    end

    scope :controller => 'datasets', :constraints => {:id => Frontend::UID_REGEXP} do
      get ':category/:view_name/:id/stats', :action => 'stats',
        :constraints => {:view_name => /(\w|-)+/, :category => /(\w|-)+/}
      get ':category/:view_name/:id/about', :action => 'about',
        :constraints => {:view_name => /(\w|-)+/, :category => /(\w|-)+/}
    end
    # For screenshotting only

    # The /version page
    get '/version(.:format)' => 'version#index'

    # Consul liveness check
    get '/consul_checks/active' => 'consul_checks#active'

    # Static error pages to be mirrored and served outside of our infrastructure.
    get '/static_sitewide_messages/:action', :controller => 'static_sitewide_messages'

    # Auth/login/register paths
    match '/forgot_password', :to => 'accounts#forgot_password', :as => 'forgot_password', :via => [:get, :post]
    match '/reset_password/:uid/:reset_code', :to => 'accounts#reset_password', :as => 'reset_password',
      :via => [:get, :post], :conditions => { :uid => Frontend::UID_REGEXP }
    match '/verify_email', :to => 'accounts#verify_email', :as => 'verify_email', :via => [:get, :post]

    if Frontend.auth0_configured?
      scope :protocol => 'https' do
        get '/auth/auth0/connections' => 'auth0#connections', :as => 'auth0_connections'
        get '/auth/auth0/callback' => 'auth0#callback', :as => 'auth0_callback'
        match '/auth/auth0/link' => 'auth0#link', :as => 'auth0_link', via: [:get, :post]
      end
    end

    scope :protocol => 'https', :port => APP_CONFIG.ssl_port do
      post '/login.json', :to => 'user_sessions#create', :format => 'json', :as => 'login_json'
      get '/login', :to => 'user_sessions#new', :as => 'login'
      post '/login/extend', :to => 'user_sessions#extend', :as => 'login_extend'
      get '/logout', :to => 'user_sessions#destroy', :as => 'logout'
      get '/logout/expire_if_idle', :to => 'user_sessions#expire_if_idle', :as => 'expire_if_idle'
      get '/signed_out', :to => 'user_sessions#signed_out', :as => 'signed_out'
      post '/signup.json', :to => 'accounts#create', :format => 'json', :as => 'signup_json'
      get '/signup', :to => 'accounts#new', :as => 'signup'
      post '/signup', :to => 'accounts#create', :as => 'signup_submit'
      post '/accounts.json', :to => 'accounts#update', :format => 'json', :as => 'accounts_json'
      match  '/profile/:id/update_account', :to => 'profile#update_account', :as => 'update_account_profile',
        :via => [:post, :put], :constraints => { :id => Frontend::UID_REGEXP }
      get '/oauth/authorize' => 'oauth#authorize'
      get '/notifications' => 'notifications#index'
      post '/notifications/setLastNotificationSeenAt' => 'notifications#set_last_notification_seen_at'
    end

    resource :account
    resources :user_sessions

    get '/robots.txt' => 'robots_txt#show'

    get '/opensearch.xml' => 'open_search#show'

    # Non-production environments get a special controller for test actions
    unless Rails.env.production?
      get '/test_page/:action', :controller => 'test_pages'
    end

    # Govstat pages
    scope :controller => 'govstat' do
      get '/manage/reports', :action => 'manage_reports'
      get '/manage/site_config', :action => 'manage_config'
    end

    # V1 page metadata endpoints
    scope :controller => 'page_metadata' do
      post '/metadata/v1/page', :to => 'page_metadata#create'
      put '/metadata/v1/page/:id', :to => 'page_metadata#update', :constraints => { :id => Frontend::UID_REGEXP }
      delete '/metadata/v1/page/:id', :to => 'page_metadata#destroy', :constraints => { :id => Frontend::UID_REGEXP }
    end

    scope :controller => 'data_lens' do
      post '/geo/initiate', :to => 'data_lens#initiate_region_coding'
      get '/geo/status', :to => 'data_lens#region_coding_status'
    end

    # Custom pages, catalogs, facets
    scope :controller => 'custom_content' do
      # Canvas 1
      get '/page/:page_name', :action => 'show_page'
      get '/catalog/:page_name', :action => 'show_page'
      get '/facet/:facet_name', :action => 'show_facet_listing'
      get '/facet/:facet_name/:facet_value', :action => 'show_facet_page', :constraints => { :facet_value => /.*/ }
      get '/styles/:page_type/:config_name.css', :action => 'stylesheet',
        :constraints => { :page_type => /homepage|page|facet_(listing|page)/i }

      #####################################
      ####### WARNING GREEDY ROUTE! #######
      #####################################

      # Canvas 2
      get '/template/:id', :action => 'template'
      get '*path.*ext', :action => 'page'
      get '*path', :action => 'page'
      root :action => 'page'

      # This goes after the global handler so that it never actual gets
      # called; we still do want slate to handle these pages but we also
      # want named routes
      get '/developers/docs/:resource', :action => 'page', :as => 'developer_docs'
    end

  end

  # See how all your routes lay out with "rake routes"
end
