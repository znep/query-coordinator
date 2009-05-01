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

  map.resources :contacts,
    :collection => {
      :detail => :get,
      :multi_detail => :get
    },
    :member => {
      :contact_detail => :get,
      :group_detail => :get,
    }
  map.resource :discover, :member => { :filter => :get, :swf => :get }
  map.resource :community, :member => { :filter => :get }
  map.resource :home
  map.resource :account
  map.resource :profile

  map.resources :blists,
    :collection => { :detail => :get },
    :member => {
      :detail => :get,
      :post_comment => :post,
      :update_comment => [:put, :get],
      :create_favorite => :post,
      :delete_favorite => :post
    }
  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'show', :conditions => { :method => :get },
    :requirements => {:id => /\w{4}-\w{4}/, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}
  map.connect ':category/:view_name/:id', :controller => 'blists',
    :action => 'update', :conditions => { :method => :put },
    :requirements => {:id => /\w{4}-\w{4}/, :view_name => /(\w|-)+/,
      :category => /(\w|-)+/}

  # You can have the root of your site routed with map.root -- just remember to delete public/index.html.
  map.root :controller => "discovers", :action => "show"
  map.login '/login', :controller => 'user_sessions', :action => 'new'
  map.logout '/logout', :controller => 'user_sessions', :action => 'destroy'
  map.signup '/signup', :controller => 'accounts', :action => 'new'

  # See how all your routes lay out with "rake routes"
  map.resources :user_sessions

  # Install the default routes as the lowest priority.
  # Note: These default routes make all actions in every controller accessible via GET requests. You should
  # consider removing the them or commenting them out if you're using named routes and resources.
#  map.connect ':controller/:id'
#  map.connect ':controller/:id.:format'
#  map.connect ':controller/:action/:id'
#  map.connect ':controller/:action/:id.:format'
end
