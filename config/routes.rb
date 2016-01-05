Rails.application.routes.draw do

  get 'version' => 'version#show'
  get 'post_login' => 'post_login#show'

  scope '/s', constraints: { uid: UNANCHORED_FOUR_BY_FOUR_PATTERN } do
    get '(:vanity_text)/:uid' => 'stories#show'
    get ':uid/create' => 'stories#new'
    get ':uid/copy' => 'stories#copy'
    post ':uid/create' => 'stories#create'
    get '(:vanity_text)/:uid/edit' => 'stories#edit'
    get '(:vanity_text)/:uid/preview' => 'stories#preview'
  end

  get 'themes/custom' => 'themes#custom', defaults: { format: 'css' }

  namespace :api do
    namespace :v1, defaults: { format: 'json' } do
      resources :documents, only: [:create, :show]
      resources :uploads, only: [:create]
      resources :published_stories, only: [:create]

      get 'stories/:uid/drafts/latest' => 'drafts#latest'
      post 'stories/:uid/drafts' => 'drafts#create'
      post 'stories/:uid/published' => 'published#create'
      put 'stories/:uid/permissions' => 'permissions#update'
    end
  end

  namespace :admin do
    resources :themes
  end

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
