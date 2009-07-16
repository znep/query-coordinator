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
    end

  map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'show', :conditions => { :method => :get },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
   map.connect 'profile/:profile_name/:id', :controller => 'profile',
     :action => 'update', :conditions => { :method => :put },
     :requirements => {:id => UID_REGEXP, :profile_name => /(\w|-)+/}
     
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

  map.connect ':category/:view_name/:id/print', :controller => 'blists',
    :action => 'print', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # Support /blists, /datasets, and /d short URLs
  map.connect 'dataset/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'd/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => UID_REGEXP}

  map.connect 'widgets/:id/:variation', :controller => 'widgets', :action => 'show'
  map.connect 'widgets/:id', :controller => 'widgets', :action => 'show'
  
  map.connect 'widgets_preview/:id', :controller => 'widgets_preview', :action => 'show'

  map.root :controller => "data", :action => "show"

  map.import '/upload', :controller => 'blists', :action => 'upload' 
  map.import_redirect '/upload/redirect', :controller => 'imports', :action => 'redirect'
  map.login '/login', :controller => 'user_sessions', :action => 'new'
  map.logout '/logout', :controller => 'user_sessions', :action => 'destroy'
  map.signup '/signup', :controller => 'accounts', :action => 'new'
  map.forgot_password '/forgot_password', :controller => 'accounts', :action => 'forgot_password'
  map.reset_password '/reset_password/:uid/:reset_code', :controller => 'accounts', :action => 'reset_password',
    :uid => UID_REGEXP

  map.resources :user_sessions

  # Static content
  ['about', 'solution', 'company-info', 'press'].each do |static_section|
    controller_name = static_section.underscore.camelize
    map.connect "/#{static_section}", :controller => controller_name
    map.connect "/#{static_section}/:page", :controller => controller_name, :action => 'show'
  end
  ['terms-of-service', 'privacy', 'contact-us'].each do |static_toplevel|
    map.connect "/#{static_toplevel}", :controller => 'static', :action => 'show', :page => static_toplevel
  end
  map.sales '/sales', :controller => 'static', :action => 'sales'
  
  map.with_options :controller => 'invitation' do |invitation|
    invitation.invite             'invite',                 :action => 'invite'
    invitation.create_invitation  'invitation/create',      :action => 'create'
    invitation.show_invitation    'invitation/show/:id',    :action => 'show'
    invitation.accept_invitation  'invitation/accept/:id',  :action => 'accept'
  end
  
  # See how all your routes lay out with "rake routes"
end
