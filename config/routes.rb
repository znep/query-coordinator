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
    data.data_api_popup     'data/api_popup',   :action => 'api_popup'
  end
  
  map.resource :community, :member => { :filter => :get, :activities => :get, :tags => :get }
  map.resource :home
  map.resource :account
  map.resources :profile, :member => { 
    :create_link => :post, 
    :delete_link => :delete,
    :update_link => :put,
    :create_friend => :get,
    :delete_friend => :get
  }

  map.resources :blists,
    :collection => { :detail => :get },
    :member => {
      :detail => :get,
      :post_comment => :post,
      :update_comment => [:put, :get],
      :create_favorite => :get,
      :delete_favorite => :get,
      :notify_all_of_changes => :post
    } do |blist|
      blist.connect 'stats', :controller => 'stats', :action => 'index'
      blist.resources :columns
      blist.resources :sort_bys
    end

  map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'show', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
   map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'update', :conditions => { :method => :put },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}

   # This needs to be more specific than the dataset routes, which will all
   # accept anything/anything/4-4, which matches our widget customization
   # path of widgets/4-4/4-4
   map.connect 'widgets/:id/:customization_id', :controller => 'widgets',
     :action => 'show', :requirements => {:id => UID_REGEXP, :customization_id => UID_REGEXP}

  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}
  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'update', :conditions => { :method => :put },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # NOTE: I'm not sure if there's a way to map a child resource to a connected
  # route without restating this ugly route definition. If there is, we should
  # probably use that instead of this.
  map.connect ':category/:view_name/:id/stats', :controller => 'stats',
    :action => 'index', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}
      
  map.connect ':category/:view_name/:id/about', :controller => 'blists',
    :action => 'about', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/publish', :controller => 'blists',
    :action => 'publish', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/print', :controller => 'blists',
    :action => 'print', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/email', :controller => 'blists',
    :action => 'email', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/flag/:type', :controller => 'blists',
    :action => 'flag', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
      :category => /(\w|-)+/}
  
  map.connect ':category/:view_name/:id/share', :controller => 'blists',
    :action => 'share', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
      :category => /(\w|-)+/}
      
  map.connect ':category/:view_name/:id/create_share', :controller => 'blists',
    :action => 'create_share', :conditions => { :method => :post },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
      :category => /(\w|-)+/}

  map.connect ':category/:view_name/:id/delete_share', :controller => 'blists',
    :action => 'delete_share', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/, :type => /(\w|-)+/,
      :category => /(\w|-)+/}

  # Support /blists, /datasets, and /d short URLs
  map.connect 'dataset/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'd/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'dataset/:id/meta_tab_header', :controller => 'blists', :action => 'meta_tab_header'
  map.connect 'dataset/:id/meta_tab', :controller => 'blists', :action => 'meta_tab'

  map.connect 'widgets/:id/:variation/:options', :controller => 'widgets', :action => 'show'
  map.connect 'widgets/:id/:variation/:options.data', :controller => 'widgets', :action => 'show', :format => 'data'
  map.connect 'widgets/:id/:variation', :controller => 'widgets', :action => 'show'
  map.connect 'widgets/:id/:variation.data', :controller => 'widgets', :action => 'show', :format => 'data'
  map.connect 'widgets/:id', :controller => 'widgets', :action => 'show'
  map.connect 'widgets/:id.data', :controller => 'widgets', :action => 'show', :format => 'data'

  map.connect 'customization/new', :controller => 'blists', :action => 'new_customization',
    :conditions => { :method => :get }, :format => 'data'
  map.connect 'customization/create', :controller => 'blists', :action => 'create_customization',
    :conditions => { :method => :put }, :format => 'data'

  map.connect 'widgets_preview/:id', :controller => 'widgets_preview', :action => 'show'

  map.connect 'widgets_meta/:id/meta_tab_header', :controller => 'widgets', :action => 'meta_tab_header'
  map.connect 'widgets_meta/:id/meta_tab', :controller => 'widgets', :action => 'meta_tab'

  map.connect 'new_image', :controller => 'themes', :action => 'new_image'

  map.connect 'stylesheets/theme/:id.css', :controller => 'themes', :action => 'theme'
  
  map.connect 'stats_popup', :controller => 'stats', :action => 'popup'
  map.connect 'stats_screenshot', :controller => 'stats', :action => 'screenshot'

  # The /version page
  map.connect '/version', :controller => "version", :action => "index"
  
  map.root :controller => "data", :action => "show"

  map.import '/upload', :controller => 'blists', :action => 'upload' 
  map.import_redirect '/upload/redirect', :controller => 'imports', :action => 'redirect'
  map.forgot_password '/forgot_password', :controller => 'accounts', :action => 'forgot_password'
  map.reset_password '/reset_password/:uid/:reset_code', :controller => 'accounts', :action => 'reset_password',
    :uid => UID_REGEXP

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
  end

  map.resources :user_sessions

  # Static content
  ['about', 'solution', 'company-info', 'press'].each do |static_section|
    controller_name = static_section.underscore.camelize
    map.connect "/#{static_section}", :controller => controller_name
    map.connect "/#{static_section}/:page", :controller => controller_name, :action => 'show'
  end
  ['terms-of-service', 'privacy', 'contact-us', 'try-it-free'].each do |static_toplevel|
    map.connect "/#{static_toplevel}", :controller => 'static', :action => 'show', :page => static_toplevel
  end
  map.sales '/sales', :controller => 'static', :action => 'sales'
  map.about '/about', :controller => 'about'
  
  map.with_options :controller => 'invitation' do |invitation|
    invitation.invite             'invite',                 :action => 'invite'
    invitation.create_invitation  'invitation/create',      :action => 'create'
    invitation.show_invitation    'invitation/show/:id',    :action => 'show'
    invitation.accept_invitation  'invitation/accept/:id',  :action => 'accept'
  end
  
  # See how all your routes lay out with "rake routes"
end
