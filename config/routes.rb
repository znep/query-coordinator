Rails.application.routes.draw do
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".
  mount SocrataSiteChrome::Engine => '/socrata_site_chrome'

  root 'demo#index'
end
