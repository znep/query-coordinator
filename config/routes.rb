Rails.application.routes.draw do
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".
  mount Chrome::Engine => '/chrome'

  root 'demo#index'
end
