Rails.application.routes.draw do

  # Health and version routes
  get 'health' => 'health#show'
  get 'version' => 'version#show'
  get 'consul_checks/active' => 'consul_checks#active'

  # Routes supporting locale prefix.
  scope '(:locale)', :locale => /#{I18n.available_locales.join("|")}/ do
    # Login success handler
    get 'post_login' => 'post_login#show'

    # Routes for interacting with Perspectives
    scope 's', constraints: { uid: UNANCHORED_FOUR_BY_FOUR_PATTERN } do
      get '(:vanity_text)/:uid' => 'stories#show', as: 'story'
      get ':uid/create' => 'stories#new'
      get ':uid/copy' => 'stories#copy'
      post ':uid/create' => 'stories#create'
      get '(:vanity_text)/:uid/about' => 'stories#about'
      get '(:vanity_text)/:uid/edit' => 'stories#edit'
      get '(:vanity_text)/:uid/stats' => 'stories#stats'
      get '(:vanity_text)/:uid/preview' => 'stories#preview', as: 'preview'
      get '(:vanity_text)/:uid/tile' => 'stories#tile', as: 'tile'
      get '(:vanity_text)/:uid/widget' => 'stories#tile'
    end

    # Routes for interacting with Goals
    # Note that these routes are accessible without
    # the /stories global prefix (see config.ru, specifically
    # re: UriRewriteMiddleware).
    scope 'stat/goals', module: 'stat' do
      get 'single/:uid' => 'goals#show'
      get 'single/:uid/edit' => 'goals#edit'
      get 'single/:uid/edit-story' => 'goals#edit'
      get 'single/:uid/preview' => 'goals#preview'

      # This route doesn't need a fully-qualified equivalent; it's not a user-
      # facing page, just a target for a form submission.
      get 'single/:uid/copy' => 'goals#copy'

      get ':dashboard/:category/:uid' => 'goals#show'
      get ':dashboard/:category/:uid/edit' => 'goals#edit'
      get ':dashboard/:category/:uid/edit-story' => 'goals#edit'
      get ':dashboard/:category/:uid/preview' => 'goals#preview'
    end

    # Story theme configuration routes
    namespace :admin do
      resources :themes
    end
  end

  # API routes
  # Note that these routes are accessible without
  # the /stories global prefix (see config.ru).
  namespace :api do
    # for Perspectives
    namespace :v1, defaults: { format: 'json' } do
      resources :documents, only: [:create, :show]
      resources :uploads, only: [:create]
      resources :published_stories, only: [:create]

      get 'stories/:uid/drafts/latest' => 'drafts#latest'
      post 'stories/:uid/drafts' => 'drafts#create'

      get 'stories/:uid/published/latest' => 'published#latest'
      post 'stories/:uid/published' => 'published#create'

      put 'stories/:uid/permissions' => 'permissions#update'

      put 'documents/:id/crop' => 'documents#crop'

      get 'getty-images/search' => 'getty_images#search'
      get 'getty-images/:id' => 'getty_images#show', as: 'getty_image'
    end

    # for Goals
    namespace :stat do
      namespace :v3, defaults: { format: 'json' } do
        get 'goals' => 'goals#index'
      end
      namespace :v1, defaults: { format: 'json' } do
        namespace :goals do
          get ':uid/narrative/published/latest' => 'published#latest'
          post ':uid/narrative/published' => 'published#create'

          get ':uid/narrative/drafts/latest' => 'drafts#latest'
          post ':uid/narrative/drafts' => 'drafts#create'

          put ':uid/narrative/permissions' => 'permissions#update'
        end
      end
    end
  end

  # Search proxy routes
  get '/search/users/hasStoriesRights' => 'license_check#user_has_stories_rights?', defaults: { format: 'json' }

  # Story theme CSS generator
  get 'themes/custom' => 'themes#custom', defaults: { format: 'css' }

  # Mounts the site-chrome engine
  mount SocrataSiteChrome::Engine => '/socrata_site_chrome'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
