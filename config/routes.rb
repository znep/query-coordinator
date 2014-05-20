# encoding: utf-8

Frontend::Application.routes do

  UID_REGEXP = /\w{4}-\w{4}/

  # styling routes
  scope :path => '/styles', :controller => 'styles' do
    get '/individual/:stylesheet.css', :action => 'individual',
      :constraints => { :stylesheet => /(\w|-|\.)+/ }
    get '/merged/:stylesheet.css', :action => 'merged'
    get '/widget/:customization_id.css', :action => 'widget'
    get '/current_site.css', :action => 'current_site'
    get '/govstat_site.css', :action => 'govstat_site'
  end

  # optional locale scope for all routes to teach rails how to make links
  scope '(:locale)', :locale => /en|it|es|fr|zh|nyan/ do

    scope :path => '/api_foundry', :controller => 'api_foundry' do
      get '/forge/:id', :action => 'forge'
      get '/customize/:id', :action => 'customize'
      get '/manage/:id/apps/setThrottle', :action => 'setThrottle'
      delete '/manage/:id/apps/rmThrottle', :action => 'rmThrottle'
      get '/manage/:id',                :action => 'manage', :admin_section => 'admin_list'
      get '/manage/:id/permission',     :action => 'manage', :admin_section => 'permission'
      get '/manage/:id/apps',           :action => 'manage', :admin_section => 'apps_list'
      get '/manage/:id/apps/:token',    :action => 'manage', :admin_section => 'apps_edit'
      get '/manage/:id/metrics',        :action => 'manage', :admin_section => 'metrics'
      get '/manage/:id/naming',         :action => 'manage', :admin_section => 'naming_list'
      get '/manage/:id/rename',         :action => 'manage', :admin_section => 'rename'
      get '/manage/:id/naming/:column', :action => 'manage', :admin_section => 'naming_edit'
      get '/manage/:id/transfer',       :action => 'manage', :admin_section => 'transfer'
      get '/manage/:id/delete',         :action => 'manage', :admin_section => 'delete'
    end

    scope :path => '/intercessio', :controller => 'intercessio' do
      get '/request/*path', :action => 'request_async'
      get '/request/*path.*ext', :action => 'request_async'
      get '/receive/:token', :action => 'request_receive'
      get '/status/:token', :action => 'request_status'
    end

    # New frontend pages
    scope :controller => 'odysseus', :action => 'index' do
      match '/stat', :as => 'govstat_root'
      match '/stat/goals', :as => 'govstat_goals'
      match '/stat/my/goals', :as => 'govstat_my_goals'
      match '/stat/goals/single/:goal_id', :as => 'govstat_single_goal'
      match '/stat/goals/single/:goal_id/edit', :as => 'govstat_single_goal_edit'
      match '/stat/goals/:dashboard_id', :as => 'govstat_dashboard'
      match '/stat/goals/:dashboard_id/edit', :as => 'govstat_dashboard_edit'
      match '/stat/goals/:dashboard_id/:category_id/:goal_id', :as => 'govstat_goal'
      match '/stat/goals/:dashboard_id/:category_id/:goal_id/edit', :as => 'govstat_goal_edit'
      match '/stat/data', :as => 'govstat_data'
    end

    # TEMPORARY HACK for edmonton
    scope :controller => 'odysseus', :action => 'index' do
      match '/edmonton-dash'
    end

    scope :path => '/internal', :controller => 'internal' do
      match '/', :action => 'index'
      match '/analytics', :action => 'analytics'
      post '/orgs', :action => 'create_org'
      match '/orgs', :action => 'index_orgs'
      match '/orgs/:id', :action => 'show_org'
      match '/orgs/:id/domains', :action => 'create_domain', :via => :post
      match '/orgs/:org_id/domains/:id', :action => 'show_domain',
        :constraints => {:id => /(\w|-|\.)+/}
      match '/orgs/:org_id/domains/:domain_id/site_config',
        :action => 'create_site_config', :constraints => {:domain_id => /(\w|-|\.)+/},
        :conditions => { :method => :post }
      match '/orgs/:org_id/domains/:domain_id/default_site_config',
        :action => 'set_default_site_config', :constraints => {:domain_id => /(\w|-|\.)+/},
        :conditions => { :method => :post }
      match '/orgs/:org_id/domains/:domain_id/feature',
        :action => 'set_features', :constraints => {:domain_id => /(\w|-|\.)+/},
        :conditions => { :method => :post }
      match '/orgs/:org_id/domains/:domain_id/aliases',
        :action => 'update_aliases', :constraints => {:domain_id => /(\w|-|\.)+/},
        :conditions => { :method => :post }
      post '/orgs/:org_id/domains/:domain_id/account_modules',
        :action => 'add_module_to_domain', :constraints => {:domain_id => /(\w|-|\.)+/}
      match '/domains/:domain_id/flush_cache',
        :action => 'flush_cache', :constraints => {:domain_id => /(\w|-|\.)+/}
      match '/orgs/:org_id/domains/:domain_id/feature_flags',
        :action => 'feature_flags', :constraints => {:domain_id => /(\w|-|\.)+/}
      post '/orgs/:org_id/domains/:domain_id/set_feature_flags',
        :action => 'set_feature_flags', :constraints => {:domain_id => /(\w|-|\.)+/}
      match '/orgs/:org_id/domains/:domain_id/site_config/:id',
        :action => 'show_config', :constraints => {:domain_id => /(\w|-|\.)+/}
      post '/orgs/:org_id/domains/:domain_id/site_config/:id/property',
        :action => 'set_property', :constraints => {:domain_id => /(\w|-|\.)+/}
      match '/orgs/:org_id/domains/:domain_id/site_config/:config_id/edit_property',
        :action => 'show_property', :constraints => {:domain_id => /(\w|-|\.)+/}
      match '/tiers', :action => 'index_tiers'
      match '/tiers/:name', :action => 'show_tier'
      match '/modules', :action => 'index_modules'
    end

    scope :path => '/admin', :controller => 'administration' do
      get '/', :action => :index
      get :analytics
      get :federations
      get :users
      get :comment_moderation
      get :sdp_templates
      get :datasets
      get :data_slate, :as => 'canvas_admin', :action => 'canvas_pages'
      get 'data_slate/create', :as => 'canvas_create', :action => 'create_canvas_page'
      post 'data_slate/create', :as => 'canvas_create', :action => 'post_canvas_page'
      get :home, :as => 'home_administration'
      get :metadata, :as => 'metadata_administration'
      get :views
      put :save_featured_views
      get :catalog_widget
      get :routing_approval, :as => 'routing_approval_administration'
      match '/tos', :via => [:get, :post]

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
        :constraints => {:id => UID_REGEXP}
      get '/routing_approval/queue', :action => 'routing_approval_queue'
      post '/routing_approval/view/:id/set/:approval_type',
        :action => 'approve_view', :constraints => {:id => UID_REGEXP}
      get '/routing_approval/manage', :action => 'routing_approval_manage'
      post '/routing_approval/manage', :action => 'routing_approval_manage_save'

      get '/configuration', :action => 'configuration'
      get '/flag_out_of_date', :action => 'flag_out_of_date'
    end

    get '/templates/:id', :controller => 'remote_partials', :action => :templates
    get '/modals/:id', :controller => 'remote_partials', :action => :modals

    get '/translations/*locale_parts' => 'translations#get'

    resource :browse, :controller => 'browse', :except => [ :create ] do
      collection do
        get :embed
        get :select_dataset
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

    scope :controller => 'console' do
      get 'console', :action => 'index'
    end

    scope :controller => 'profile', :path => '/profile',
          :constraints => {:id => UID_REGEXP, :profile_name => /(\w|-)+/} do
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
      match ':profile_name/:id/app_token/:token_id', :action => 'edit_app_token', :as => 'edit_app_token'
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

    scope :controller => 'widgets', :constraints => {:id => UID_REGEXP} do
      get 'widgets/:id/:customization_id', :action => 'show'
      get 'widgets/:id', :action => 'show'
      get 'w/:id/:customization_id', :action => 'show', :as => 'widget'
      get 'w/:id', :action => 'show', :as => 'themeless_widget'
    end

    resources :datasets, :only => [ :show, :new ] do
      collection do
        get :upload
        get :external
        get :external_download
      end
      member do
        get :about
        post :validate_contact_owner
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

    resources :resource, :controller => 'ResourcesController' do
      member do
        get :show
      end
    end

    # Dataset SEO URLs (only add here if the action has a view with it;
    # otherwise just add to the :member key in the datasets resource above.)
    scope :controller => 'datasets', :constraints => {:id => UID_REGEXP,
          :view_name => /(\w|-)+/, :category => /(\w|-)+/} do

      get ':category/:view_name/:id', :action => 'show', :as => :view
      get ':category/:view_name/:id/:row_id', :action => 'show',
        :constraints => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
          :category => /(\w|-)+/, :row_id => /\d+/}, :as => :view_row
      get ':category/:view_name/:id/widget_preview', :action => 'widget_preview', :as => :preview_view_widget
      get ':category/:view_name/:id/edit', :action => 'edit', :as => :edit_view
      get ':category/:view_name/:id/edit_rr', :action => 'edit_rr', :as => :edit_view_rr
      get ':category/:view_name/:id/thumbnail', :action => 'thumbnail', :as => :view_thumbnail
      get ':category/:view_name/:id/stats', :action => 'stats', :as => :view_stats
      get ':category/:view_name/:id/form_success', :action => 'form_success', :as => :view_form_success
      get ':category/:view_name/:id/form_error', :action => 'form_error', :as => :view_form_error
      get ':category/:view_name/:id/about', :action => 'about', :as => :about_view
      match ':category/:view_name/:id/alt', :action => 'alt',
        :via => [:get, :post], :as => :alt_view
      match ':category/:view_name/:id/flags', :action => 'flag_check',
        :via => [:get, :post], :as => :flag_check
      match ':category/:view_name/:id/edit_metadata', :action => 'edit_metadata',
        :via => [:get, :post], :as => :edit_view_metadata
    end

    get 'proxy/verify_layer_url' => 'datasets#verify_layer_url'
    get 'proxy/wkt_to_wkid' => 'datasets#wkt_to_wkid'

    scope :controller => 'datasets', :constraints => {:id => UID_REGEXP} do
      # Redirect bounce for metric snatching
      get 'download/:id/:type', :action => 'download',
        :constraints => {:type => /.*/},
        :as => 'metric_redirect'

      # Short URLs
      get 'blob/:id', :action => 'blob'
      get 'dataset/:id', :action => 'show'
      get 'd/:id', :action => 'show', :as => :short_view

      get 'd/:id/:row_id', :action => 'show',
        :constraints => {:row_id => /\d+/}
    end

    # Semantic web cannoical URLs
    %w{resource id}.each do |prefix|
      get "#{prefix}/:name(/:row_id)(.:format)" => 'resources#show'
    end

    scope :controller => 'datasets', :constraints => {:id => UID_REGEXP} do
      get 'r/:id/:name', :action => 'bare'
      get ':category/:view_name/:id/stats', :action => 'stats',
        :constraints => {:view_name => /(\w|-)+/, :category => /(\w|-)+/}
    end
    # For screenshotting only

    # The /version page
    get '/version(.:format)' => 'version#index'

    # Auth/login/register paths
    match '/forgot_password', :to => 'accounts#forgot_password', :as => 'forgot_password'
    match '/reset_password/:uid/:reset_code', :to => 'accounts#reset_password', :as => 'reset_password',
      :conditions => {:uid => UID_REGEXP}

    scope :protocol => "https", :port => APP_CONFIG['ssl_port'] || 443 do
      match '/login.json', :to => 'user_sessions#create', :format => 'json', :as => 'login_json'
      match '/login', :to => 'user_sessions#new', :as => 'login'
      match '/login/extend', :to => 'user_sessions#extend', :as => 'login_extend'
      match '/logout', :to => 'user_sessions#destroy', :as => 'logout'
      match '/logout/expire_if_idle', :to => 'user_sessions#expire_if_idle', :as => 'expire_if_idle'
      match '/signup.json', :to => 'accounts#create', :format => 'json', :as => 'signup_json'
      get '/signup', :to => 'accounts#new', :as => 'signup'
      post '/signup', :to => 'accounts#create', :as => 'signup_submit'
      match '/accounts.json', :to => 'accounts#update', :format => 'json', :as => 'accounts_json'
      match '/login/rpx_return_login', :to => 'rpx#return_login', :as => 'rpx_return_login'
      match '/login/rpx_return_signup', :to => 'rpx#return_signup', :as => 'rpx_return_signup'
      match '/login/rpx_login', :to => 'rpx#login', :as => 'rpx_login'
      match '/login/rpx_signup', :to => 'rpx#signup', :as => 'rpx_signup'
      match '/account/add_rpx_token', :to => 'accounts#add_rpx_token', :as => 'add_rpx_token'
      match  '/profile/:id/update_account', :to => 'profile#update_account', :as => 'update_account_profile',
        :via => [:post, :put], :constraints => { :id => UID_REGEXP }
      match '/oauth/authorize' => 'oauth#authorize'
    end

    resource :account
    resources :user_sessions

    match '/robots.txt' => 'robots_txt#show'

    match '/opensearch.xml' => 'open_search#show'

    # Non-production environments get a special controller for test actions
    unless Rails.env.production?
      match '/test_page/:action', :controller => 'test_pages'
    end

    # Govstat pages
    scope :controller => 'govstat' do
      match '/goals-new', :action => 'goals'

      match '/goal/:id', :action => 'goal_page', :constraints => { :id => UID_REGEXP }

      match '/manage', :action => 'manage'
      match '/manage/data', :action => 'manage_data'
      match '/manage/reports', :action => 'manage_reports'
      match '/manage/site_config', :action => 'manage_config'
      get '/manage/template', :action => 'manage_template'
      post '/manage/template', :action => 'manage_template_update'
    end

    # Custom pages, catalogs, facets
    scope :controller => 'custom_content' do
      # Canvas 1
      match '/page/:page_name', :action => 'show_page'
      match '/catalog/:page_name', :action => 'show_page'
      match '/facet/:facet_name', :action => 'show_facet_listing'
      match '/facet/:facet_name/:facet_value', :action => 'show_facet_page',
        :constraints => { :facet_value => /.*/ }
      match '/styles/:page_type/:config_name.css', :action => 'stylesheet',
        :constraints => { :page_type => /homepage|page|facet_(listing|page)/i }

      # Canvas 2
      match '/template/:id', :action => 'template'
      match '*path.*ext', :action => 'page'
      match '*path', :action => 'page'
      root :action => 'page'

      # This goes after the global handler so that it never actual gets
      # called; we still do want slate to handle these pages but we also
      # want named routes
      get '/developers/docs/:resource', :action => 'page', :as => 'developer_docs'
    end

  end

  # See how all your routes lay out with "rake routes"
end
