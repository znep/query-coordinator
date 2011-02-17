ActionController::Routing::Routes.draw do |map|
  # The priority is based upon order of creation: first created -> highest priority.

  # Sample of regular route:
  #   map.connect 'products/:id', :controller => 'catalog', :action => 'view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   map.purchase 'products/:id/purchase', :controller => 'catalog', :action => 'purchase'
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   map.resources :products

  # Sample resource route with options:
  #   map.resources :products, :member => { :short => :get, :toggle => :post }, :collection => { :sold => :get }

  # Sample resource route with sub-resources:
  #   map.resources :products, :has_many => [ :comments, :sales ], :has_one => :seller

  # Sample resource route with more complex sub-resources
  #   map.resources :products do |products|
  #     products.resources :comments
  #     products.resources :sales, :collection => { :recent => :get }
  #   end

  # Sample resource route within a namespace:
  #   map.namespace :admin do |admin|
  #     # Directs /admin/products/* to Admin::ProductsController (app/controllers/admin/products_controller.rb)
  #     admin.resources :products
  #   end
  UID_REGEXP = /\w{4}-\w{4}/

  # styling routes
  map.connect '/styles/individual/:stylesheet.css', :controller => 'styles', :action => 'individual'
  map.connect '/styles/merged/:stylesheet.css', :controller => 'styles', :action => 'merged'
  map.connect '/styles/widget/:customization_id.css', :controller => 'styles', :action => 'widget'
  map.connect '/styles/current_site.css', :controller => 'styles', :action => 'current_site'
  Jammit::Routes.draw(map)

  map.with_options :controller => 'internal' do |internal|
    internal.connect '/internal', :action => 'index'
    internal.connect '/internal/analytics', :action => 'analytics'
    internal.connect '/internal/orgs', :action => 'create_org',
      :conditions => { :method => :post }
    internal.connect '/internal/orgs', :action => 'index_orgs'
    internal.connect '/internal/orgs/:id', :controller => 'internal',
      :action => 'show_org'
    internal.connect '/internal/orgs/:id/domains', :controller => 'internal',
      :action => 'create_domain', :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:id', :controller => 'internal',
      :action => 'show_domain', :requirements => {:id => /(\w|-|\.)+/}
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/preview_site_config',
      :action => 'preview_site_config', :requirements => {:domain_id => /(\w|-|\.)+/}
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/site_config',
      :action => 'create_site_config', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/default_site_config',
      :action => 'set_default_site_config', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/feature',
      :action => 'set_features', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/aliases',
      :action => 'update_aliases', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/account_modules',
      :action => 'add_module_to_domain', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:id',
      :action => 'show_config', :requirements => {:domain_id => /(\w|-|\.)+/}
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:id/property',
      :action => 'set_property', :requirements => {:domain_id => /(\w|-|\.)+/},
      :conditions => { :method => :post }
    internal.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:config_id/edit_property',
      :action => 'show_property', :requirements => {:domain_id => /(\w|-|\.)+/}
    internal.connect '/internal/tiers', :controller => 'internal',
      :action => 'index_tiers'
    internal.connect '/internal/tiers/:name', :controller => 'internal',
      :action => 'show_tier'
    internal.connect '/internal/modules', :controller => 'internal',
      :action => 'index_modules'
  end

  map.resources :administration, :as => 'admin',
    :collection => {
      :analytics => :get,
      :federations => :get,
      :users => :get,
      :comment_moderation => :get,
      :sdp_templates => :get,
      :datasets => :get,
      :select_dataset => :get,
      :verify_layer_url => :get,
      :home => :get,
      :metadata => :get,
      :views => :get,
      :save_featured_views => :put
  }

  map.with_options :controller => 'administration' do |admin|
    admin.connect '/admin/users/:user_id/promote/:role', :action => 'set_user_role',
      :conditions => { :method => :put }
    admin.connect '/admin/users/update', :action => 'set_user_role',
      :conditions => { :method => :put }
    admin.connect '/admin/users/:user_id/reset_password', :action => 'reset_user_password',
      :conditions => { :method => :post }
    admin.connect '/admin/users/future/:id/delete', :action => 'delete_future_user',
      :conditions => { :method => :delete }
    admin.connect '/admin/users/bulk_create', :action => 'bulk_create_users',
      :conditions => { :method => :post }
    admin.connect '/admin/sdp_templates', :action => 'sdp_template_create',
      :conditions => { :method => :post }
    admin.connect '/admin/sdp_templates/:id', :action => 'sdp_template',
      :conditions => { :method => :get }
    admin.connect '/admin/sdp_templates/:id/set_default', :action => 'sdp_set_default_template',
      :conditions => { :method => :put }
    admin.connect '/admin/sdp_templates/:id/delete', :action => 'sdp_delete_template',
      :conditions => { :method => :delete }
    admin.connect '/admin/federations/:id/delete', :action => 'delete_federation',
      :conditions => { :method => :delete }
    admin.connect '/admin/federations/:id/accept', :action => 'accept_federation',
      :conditions => { :method => :post }
    admin.connect '/admin/federations/:id/reject', :action => 'reject_federation',
      :conditions => { :method => :post }
    admin.connect '/admin/federations/create', :action => 'create_federation',
      :conditions => { :method => :post }
    admin.connect '/admin/metadata/:fieldset/create', :action => 'create_metadata_field',
      :conditions => { :method => :post }
    admin.connect '/admin/metadata/:fieldset/delete', :action => 'delete_metadata_fieldset',
      :conditions => { :method => :delete }
    admin.connect '/admin/metadata/create_fieldset', :action => 'create_metadata_fieldset',
      :conditions => { :method => :post }
    admin.connect '/admin/metadata/:fieldset/:index/delete', :action => 'delete_metadata_field',
      :conditions => { :method => :delete }
    admin.connect '/admin/metadata/:fieldset/:index/toggle_required', :action => 'toggle_metadata_required',
      :conditions => { :method => :put }
    admin.connect '/admin/metadata/:fieldset/:field/move/:direction', :action => 'move_metadata_field',
      :conditions => { :method => :put }
    admin.connect '/admin/metadata/create_category', :action => 'create_category',
      :conditions => { :method => :post }
    admin.connect '/admin/metadata/delete_category', :action => 'delete_category',
      :conditions => { :method => :delete }
    admin.connect '/admin/home/stories', :action => 'create_story',
      :conditions => { :method => :post }
    admin.connect '/admin/home/stories/appearance', :action => 'update_stories_appearance',
      :conditions => { :method => :put }
    admin.connect '/admin/home/stories/appearance', :action => 'stories_appearance',
      :conditions => { :method => :get }
    admin.connect '/admin/home/story/new', :action => 'new_story',
      :conditions => { :method => :get }
    admin.connect '/admin/home/story/:id', :action => 'edit_story',
      :conditions => { :method => [:get, :post] }
    admin.connect '/admin/home/story/:id/delete', :action => 'delete_story',
      :conditions => { :method => :delete }
    admin.connect '/admin/datasets/sidebar_config',
      :action => 'modify_sidebar_config', :conditions => { :method => :post }
    admin.connect '/admin/views/:id/set/:approved',
      :action => 'set_view_moderation_status', :conditions => { :method => :post },
      :requirements => {:id => UID_REGEXP}
  end

  map.resource :browse, :controller => 'browse'
  map.resource :nominations, :as => 'nominate'
  map.resources :videos, :only => [ :index ], :collection => { :popup => :get }

  # For legacy support reasons, make /home and /datasets go somewhere reasonable
  map.connect '/home',     :controller => :profile, :action => 'index'
  map.connect '/datasets', :controller => :profile, :action => 'index'

  map.connect '/analytics', :controller => :analytics, :action => 'index'

  # Profile SEO urls (only add here if the action has a view with it;
  # otherwise just add to the :member key in the profile resource above.)
  map.with_options :controller => 'profile' do |profile|
    profile.connect 'profile/:profile_name/:id',
         :action => 'show', :conditions => { :method => :get },
         :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/:profile_name/:id',
       :action => 'update', :conditions => { :method => :put },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/:profile_name/:id/edit',
         :action => 'edit', :conditions => { :method => :get },
         :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/:profile_name/:id/image',
       :action => 'edit_image', :conditions => { :method => :get },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/:profile_name/:id/app_tokens',
       :action => 'edit_app_tokens', :conditions => { :method => :get },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/app_tokens',
       :action => 'edit_app_tokens', :conditions => { :method => :get }
    profile.connect 'profile/:profile_name/:id/app_token/new',
       :action => 'create_app_token', :conditions => { :method => :post },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.connect 'profile/:profile_name/:id/app_token/:token_id/delete',
       :action => 'delete_app_token', :conditions => { :method => :post },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    profile.profile_account 'profile/:profile_name/:id/account',
       :action => 'edit_account', :conditions => { :method => :get },
       :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  end

  map.resources :profile, :member => {
    :create_friend => :get,
    :delete_friend => :get
    # :update_account => :put has been moved to the https block below, because it sends a password in cleartext.
  }

  map.connect 'widgets/:id/:customization_id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'widgets/:id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'w/:id/:customization_id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'w/:id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}

  map.resources :datasets,
    :collection => {
      :upload => :get
    },
    :member => {
      :math_validate => :post,
      :save_filter => :post,
      :modify_permission => :post,
      :post_comment => :post,
      :email => [:get, :post],
      :append => :get,
      :contact => :get,
      :thumbnail => :get
    },
    :only => [ :show, :new ]

  # Dataset SEO URLs (only add here if the action has a view with it;
  # otherwise just add to the :member key in the datasets resource above.)
  map.connect ':category/:view_name/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get}

  map.connect ':category/:view_name/:id/:row_id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/, :row_id => /\d+/},
    :conditions => {:method => :get}

  map.connect ':category/:view_name/:id/widget_preview', :controller => 'datasets',
    :action => 'widget_preview',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get}

  map.connect ':category/:view_name/:id/edit_metadata', :controller => 'datasets',
    :action => 'edit_metadata',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => [:get, :post]}

  map.connect ':category/:view_name/:id/edit_rr', :controller => 'datasets',
    :action => 'edit_rr', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/alt', :controller => 'datasets',
    :action => 'alt',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => [:get, :post]}

  map.connect ':category/:view_name/:id/thumbnail', :controller => 'datasets',
    :action => 'thumbnail',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get}

  map.connect ':category/:view_name/:id/stats', :controller => 'datasets',
    :action => 'stats', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/form_success', :controller => 'datasets',
    :action => 'form_success', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/form_error', :controller => 'datasets',
    :action => 'form_error', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # Short URLs
  map.connect 'dataset/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get}

  map.connect 'd/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get}

  map.connect 'd/:id/:row_id', :controller => 'datasets', :action => 'show',
    :requirements => {:id => UID_REGEXP, :row_id => /\d+/},
    :conditions => {:method => :get}


  # Semantic web cannoical URLs
  map.connect 'resource/:name', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'resource/:name.:format', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'resource/:name/:row_id', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'resource/:name/:row_id.:format', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  # Repeat semantic web.  Add id as alias to resource
  map.connect 'id/:name', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'id/:name.:format', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'id/:name/:row_id', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}

  map.connect 'id/:name/:row_id.:format', :controller => 'resources',
    :action => 'show',
    :conditions => {:method => :get}
  # end Semantic web cannoical URLs

  # For screenshotting only
  map.connect 'r/:id/:name', :controller => 'datasets',
    :action => 'bare',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get}

  map.connect ':category/:view_name/:id/stats', :controller => 'datasets',
    :action => 'stats', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # The /version page
  map.connect '/version', :controller => "version", :action => "index"

  # Auth/login/register paths
  map.forgot_password '/forgot_password', :controller => 'accounts', :action => 'forgot_password'
  map.reset_password '/reset_password/:uid/:reset_code', :controller => 'accounts', :action => 'reset_password',
    :conditions => {:uid => UID_REGEXP}

  map.with_options :protocol => "https", :port => SslRequirement.port_for_protocol('https') do |https|
    https.login '/login', :controller => 'user_sessions', :action => 'new'
    https.login_json '/login.json', :controller => 'user_sessions', :action => 'create', :format => 'json'
    https.logout '/logout', :controller => 'user_sessions', :action => 'destroy'
    https.signup '/signup', :controller => 'accounts', :action => 'new'
    https.signup_json '/signup.json', :controller => 'accounts', :action => 'create', :format => 'json'
    https.accounts_json '/accounts.json', :controller => 'accounts', :action => 'update', :format => 'json'
    https.rpx_return_login '/login/rpx_return_login', :controller => 'rpx', :action => 'return_login'
    https.rpx_return_signup '/login/rpx_return_signup', :controller => 'rpx', :action => 'return_signup'
    https.rpx_login '/login/rpx_login', :controller => 'rpx', :action => 'login'
    https.rpx_signup '/login/rpx_signup', :controller => 'rpx', :action => 'signup'
    https.add_rpx_token '/account/add_rpx_token', :controller => 'accounts', :action => 'add_rpx_token'
    https.update_account_profile '/profile/:id/update_account', :controller => 'profile', :action => 'update_account',
      :conditions => { :method => [:post, :put] }, :requirements => { :id => UID_REGEXP }
  end

  map.resource :account
  map.resources :user_sessions
  map.connect '/site_config/:config_id',
    :controller => 'user_sessions', :action => 'site_config'
  map.connect '/clear_site_config',
    :controller => 'user_sessions', :action => 'clear_site_config'

  map.connect '/robots.txt',
    :controller => 'robots_txt', :action => 'show'

  map.connect '/opensearch.xml',
    :controller => 'open_search', :action => 'show'

  # Seattle Data-Policy hack
  map.connect '/data-policy', :controller => "data_policy", :action => "index"

  # Non-production environments get a special controller for test actions
  unless Rails.env.production?
    map.connect '/test_page/:action', :controller => 'test_pages'
  end

  map.root :controller => "homepage", :action => "show"

  # See how all your routes lay out with "rake routes"
end
