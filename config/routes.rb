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

  map.connect '/styles/individual/:stylesheet.css', :controller => 'styles', :action => 'individual'
  map.connect '/styles/merged/:stylesheet.css', :controller => 'styles', :action => 'merged'
  map.connect '/styles/widget/:customization_id.css', :controller => 'styles', :action => 'widget'
  map.connect '/styles/current_site.css', :controller => 'styles', :action => 'current_site'

  map.connect '/internal', :controller => 'internal', :action => 'index'
  map.connect '/internal/orgs', :controller => 'internal', :action => 'create_org',
    :conditions => { :method => :post }
  map.connect '/internal/orgs', :controller => 'internal', :action => 'index_orgs'
  map.connect '/internal/orgs/:id', :controller => 'internal',
    :action => 'show_org'
  map.connect '/internal/orgs/:id/domains', :controller => 'internal',
    :action => 'create_domain', :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:id', :controller => 'internal',
    :action => 'show_domain', :requirements => {:id => /(\w|-|\.)+/}
  map.connect '/internal/orgs/:org_id/domains/:domain_id/preview_site_config',
    :controller => 'internal', :action => 'preview_site_config',
    :requirements => {:domain_id => /(\w|-|\.)+/}
  map.connect '/internal/orgs/:org_id/domains/:domain_id/site_config',
    :controller => 'internal', :action => 'create_site_config',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/default_site_config',
    :controller => 'internal', :action => 'set_default_site_config',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/feature',
    :controller => 'internal', :action => 'set_features',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/aliases',
    :controller => 'internal', :action => 'update_aliases',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/account_modules',
    :controller => 'internal', :action => 'add_module_to_domain',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:id',
    :controller => 'internal', :action => 'show_config',
    :requirements => {:domain_id => /(\w|-|\.)+/}
  map.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:id/property',
    :controller => 'internal', :action => 'set_property',
    :requirements => {:domain_id => /(\w|-|\.)+/},
    :conditions => { :method => :post }
  map.connect '/internal/orgs/:org_id/domains/:domain_id/site_config/:config_id/edit_property',
    :controller => 'internal', :action => 'show_property',
    :requirements => {:domain_id => /(\w|-|\.)+/}
  map.connect '/internal/tiers', :controller => 'internal',
    :action => 'index_tiers'
  map.connect '/internal/tiers/:name', :controller => 'internal',
    :action => 'show_tier'
  map.connect '/internal/modules', :controller => 'internal',
    :action => 'index_modules'

  ['administration', 'admin'].each do |as_route|
    map.resources :administration, :as => as_route,
      :collection => {
        :analytics => :get,
        :federations => :get,
        :users => :get,
        :moderation => :get,
        :sdp_templates => :get
      }

    map.with_options :controller => 'administration' do |admin|
      admin.connect as_route + '/users/:userid/:role', :action => 'set_user_role'
      admin.connect as_route + '/users/update', :action => 'set_user_role',
        :conditions => { :method => :post }
      admin.connect as_route + '/sdp_templates', :action => 'sdp_template_create',
        :conditions => { :method => :post }
      admin.connect as_route + '/sdp_templates/:id', :action => 'sdp_template'
      admin.connect as_route + '/sdp_templates/:id/set_default',
        :action => 'sdp_set_default_template'
      admin.connect as_route + '/sdp_templates/:id/delete',
        :action => 'sdp_delete_template'
      admin.connect as_route + '/federations/:id/delete',
        :action => 'delete_federation'
      admin.connect as_route + '/federations/:id/accept',
        :action => 'accept_federation'
      admin.connect as_route + '/federations/:id/reject',
        :action => 'reject_federation'
      admin.connect as_route + '/federations/create',
        :action => 'create_federation', :conditions => { :method => :post }
    end
  end

  map.resources :contacts,
    :collection => {
      :detail => :get,
      :multi_detail => :get
    },
    :member => {
      :contact_detail => :get,
      :group_detail => :get,
    }

  map.data 'data/', :controller => 'data', :action => 'redirect_to_root'
  map.with_options :controller => 'data' do |data|
    data.data_filter        'data/filter',      :action => 'filter'
    data.data_tags          'data/tags',        :action => 'tags'
    data.data_splash        'data/splash',      :action => 'splash'
    data.data_noie          'data/noie',        :action => 'noie'
    data.data_redirected    'data/redirected',  :action => 'redirected'
    data.nominations        'data/nominations', :action => 'nominations'
    data.suggest            'data/suggest',     :action => 'suggest'
  end

  map.resource :search

  map.resource :nominations, :as => 'nominate'

  map.resource :community, :member => { :filter => :get, :activities => :get, :tags => :get }
  map.resource :home
  map.resource :account
  map.resources :suggestions
  map.resources :profile, :member => {
    :create_link => :post,
    :delete_link => :delete,
    :update_link => :put,
    :create_friend => :get,
    :delete_friend => :get,
    :update_account => :put
  }

  # New dataset page
  # Temporary hack for datasets/new so it doesn't get routed to show:
  map.connect '/datasets/new', :controller => :datasets, :action => 'new',
    :conditions => {:has_v4_dataset => true} # unless they have the new grid
  map.connect '/datasets/new', :controller => :blists, :action => 'new'
  map.connect '/datasets/detail', :controller => :blists, :action => 'detail'

  map.resources :datasets,
    :conditions => {:has_v4_dataset => true},
    :member => {
      :widget_preview => :get,
      :edit_metadata => [:get, :post],
      :thumbnail => :get,
      :math_validate => :post,
      :alt => [:get, :post]
    },
    :only => [ :show ] # you see, we actually abandoned RESTful routes, I guess

  map.resource :approval

  # Old dataset page
  ['datasets', 'datasets_old'].each do |as_route|
    map.resources :blists, :as => as_route,
      :collection => { :detail => :get },
      :member => {
        :detail => :get,
        :post_comment => :post,
        :update_comment => [:put, :get],
        :create_favorite => :get,
        :delete_favorite => :get,
        :notify_all_of_changes => :post,
        :modify_permission => :post,
        :alt => :get,
        :save_filter => :post,
        :help_me => :get,
        :embed_code => :get
      } do |blist|
        blist.connect 'stats', :controller => 'stats', :action => 'index'
        blist.resources :columns
        blist.resources :sort_bys
        blist.resources :groupings
        blist.resources :show_hides
        blist.resources :filters
      end
  end

  map.resources :datasets,
    :as => "datasets_new",
    :member => {
      :widget_preview => :get,
      :edit_metadata => [:get, :post]
    }

  # TODO/v4: no longer necessary
  map.connect 'datasets_alt', :controller => 'blists', :action => 'alt_index'

  # TODO/v4: remove me
  map.with_options :conditions => {:has_v4_dataset => true} do |v4_profile|
    v4_profile.connect 'profile/:profile_name/:id', :controller => 'profile',
         :action => 'v4_show', :conditions => { :method => :get },
         :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
    v4_profile.connect 'profile/:profile_name/:id/edit', :controller => 'profile',
         :action => 'v4_edit', :conditions => { :method => :get },
         :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  end

  map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'show', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'update', :conditions => { :method => :put },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  map.connect 'profile/:profile_name/:id/edit', :controller => 'profile',
     :action => 'edit', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  map.connect 'profile/:profile_name/:id/image', :controller => 'profile',
     :action => 'edit_image', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
  map.connect 'profile/:profile_name/:id/account', :controller => 'profile',
     :action => 'edit_account', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}


  # This needs to be more specific than the dataset routes, which will all
  # accept anything/anything/4-4, which matches our widget customization
  # path of widgets/4-4/4-4

  map.connect 'widgets/:id/:customization_id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'widgets/:id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'w/:id/:customization_id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}
  map.connect 'w/:id', :controller => 'widgets',
    :action => 'show', :requirements => {:id => UID_REGEXP}

  # New SEO URL
  map.connect ':category/:view_name/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get, :has_v4_dataset => true}

  map.connect ':category/:view_name/:id/:row_id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/, :row_id => /\d+/},
    :conditions => {:method => :get, :has_v4_dataset => true}

  map.connect ':category/:view_name/:id/widget_preview', :controller => 'datasets',
    :action => 'widget_preview',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get, :has_v4_dataset => true}

  map.connect ':category/:view_name/:id/edit_metadata', :controller => 'datasets',
    :action => 'edit_metadata',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => [:get, :post], :has_v4_dataset => true}

  map.connect ':category/:view_name/:id/alt', :controller => 'datasets',
    :action => 'alt',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => [:get, :post], :has_v4_dataset => true}

  map.connect ':category/:view_name/:id/thumbnail', :controller => 'datasets',
    :action => 'thumbnail',
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/},
    :conditions => {:method => :get}

  # New short URLs
  map.connect 'dataset/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get, :has_v4_dataset => true}

  map.connect 'd/:id', :controller => 'datasets',
    :action => 'show',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get, :has_v4_dataset => true}

  # For screenshotting only
  map.connect 'r/:id/:name', :controller => 'datasets',
    :action => 'bare',
    :requirements => {:id => UID_REGEXP},
    :conditions => {:method => :get}


  # Old SEO URLs
  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}
  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'update', :conditions => { :method => :put },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # TODO: Deprecated
  map.connect ':category/:view_name/:id/stats', :controller => 'stats',
    :action => 'index', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # TEMPORARY: Until balboa is stable on production
  map.connect ':category/:view_name/:id/balboa_stats', :controller => 'datasets',
    :action => 'stats', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/:action', :controller => 'blists',
    :conditions => { :method => :get }, :requirements => {:id => UID_REGEXP,
      :view_name => /(\w|-)+/, :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/email', :controller => 'blists',
    :action => 'email', :conditions => { :method => :post }, 
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/:action/:type', :controller => 'blists',
    :conditions => { :method => :get }, :requirements => {:id => UID_REGEXP,
      :view_name => /(\w|-)+/, :type => /(\w|-)+/, :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/create_share', :controller => 'blists',
  :action => 'create_share', :conditions => { :method => :post },
  :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
    :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/create_calendar', :controller => 'blists',
  :action => 'create_calendar', :conditions => { :method => :post },
  :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
    :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/create_visualization',
    :controller => 'blists', :action => 'create_visualization',
    :conditions => { :method => :post },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :type => /(\w|-)+/, :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/create_form', :controller => 'blists',
  :action => 'create_form', :conditions => { :method => :post },
  :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
    :category => /(\w|-)+/}

  # Support /dataset and /d short URLs for old page
  map.connect 'dataset/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'd/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'dataset/:id/meta_tab_header', :controller => 'blists', :action => 'meta_tab_header'
  map.connect 'dataset/:id/meta_tab', :controller => 'blists', :action => 'meta_tab'

  map.connect 'customization/new', :controller => 'blists', :action => 'new_customization',
    :conditions => { :method => :get }, :format => 'data'
  map.connect 'customization/create', :controller => 'blists', :action => 'create_customization',
    :conditions => { :method => :put }, :format => 'data'

  map.connect 'widgets_preview/:id', :controller => 'widgets_preview', :action => 'show'

  map.connect 'new_image', :controller => 'themes', :action => 'new_image'

  map.connect 'stylesheets/theme/:id.css', :controller => 'themes', :action => 'theme'

  # Seattle Data-Policy hack
  map.connect '/data-policy', :controller => "data_policy", :action => "index"

  # The /version page
  map.connect '/version', :controller => "version", :action => "index"
  
  # Popups
  map.connect '/popup/:action', :controller => 'popup'
  
  map.root :controller => "data", :action => "show"

  map.import '/upload', :controller => 'blists', :action => 'upload' 
  map.import '/upload_alt', :controller => 'blists', :action => 'upload_alt'
  map.import_redirect '/upload/redirect', :controller => 'imports', :action => 'redirect'
  map.forgot_password '/forgot_password', :controller => 'accounts', :action => 'v4_forgot_password',
    :conditions => {:has_v4_dataset => true}
  map.forgot_password '/forgot_password', :controller => 'accounts', :action => 'forgot_password'
  map.reset_password '/reset_password/:uid/:reset_code', :controller => 'accounts', :action => 'v4_reset_password',
    :conditions => {:uid => UID_REGEXP, :has_v4_dataset => true}
  map.reset_password '/reset_password/:uid/:reset_code', :controller => 'accounts', :action => 'reset_password',
    :conditions => {:uid => UID_REGEXP}

  map.with_options :protocol => "https", :port => SslRequirement.port_for_protocol('https') do |https|
    https.login '/login', :controller => 'user_sessions', :action => 'v4_new',
      :conditions => {:has_v4_dataset => true}
    https.login '/login', :controller => 'user_sessions', :action => 'new'
    https.login_json '/login.json', :controller => 'user_sessions', :action => 'create', :format => 'json'
    https.logout '/logout', :controller => 'user_sessions', :action => 'destroy'
    https.signup '/signup', :controller => 'accounts', :action => 'v4_new',
      :conditions => {:has_v4_dataset => true}
    https.signup '/signup', :controller => 'accounts', :action => 'new'
    https.signup_json '/signup.json', :controller => 'accounts', :action => 'create', :format => 'json'
    https.accounts_json '/accounts.json', :controller => 'accounts', :action => 'update', :format => 'json'
    https.rpx_return_login '/login/rpx_return_login', :controller => 'rpx', :action => 'v4_return_login',
      :conditions => {:has_v4_dataset => true}
    https.rpx_return_login '/login/rpx_return_login', :controller => 'rpx', :action => 'return_login'
    https.rpx_return_signup '/login/rpx_return_signup', :controller => 'rpx', :action => 'return_signup'
    https.rpx_login '/login/rpx_login', :controller => 'rpx', :action => 'login'
    https.rpx_signup '/login/rpx_signup', :controller => 'rpx', :action => 'signup'
    https.add_rpx_token '/account/add_rpx_token', :controller => 'accounts', :action => 'add_rpx_token'
  end

  map.resources :user_sessions
  map.connect '/site_config/:config_id',
    :controller => 'user_sessions', :action => 'site_config'
  map.connect '/clear_site_config',
    :controller => 'user_sessions', :action => 'clear_site_config'

  map.connect '/robots.txt',
    :controller => 'robots_txt', :action => 'show'

  # Static content
  ['about', 'solution', 'company-info', 'press', 'developers', 'benchmark-study'].each do |static_section|
    controller_name = static_section.underscore.camelize
    map.connect "/#{static_section}", :controller => controller_name
    map.connect "/#{static_section}/:page", :controller => controller_name, :action => 'show'
  end
  ['terms-of-service', 'privacy', 'contact-us', 'try-it-free', 'sales',
   'accessibility', 'pdf', 'turnkey', 'turnkey-video', 'turnkey-confirmation'].each do |static_toplevel|
    map.connect "/#{static_toplevel}", :controller => 'static', :action => 'show', :page => static_toplevel
  end
  map.about '/about', :controller => 'about'
  
  map.with_options :controller => 'invitation' do |invitation|
    invitation.invite             'invite',                 :action => 'invite'
    invitation.create_invitation  'invitation/create',      :action => 'create'
    invitation.show_invitation    'invitation/show/:id',    :action => 'show'
    invitation.accept_invitation  'invitation/accept/:id',  :action => 'accept'
  end

  # Non-production environments get a special controller for test actions
  unless Rails.env.production?
    map.connect '/test_page/:action', :controller => 'test_pages'
  end
  
  # See how all your routes lay out with "rake routes"
end
