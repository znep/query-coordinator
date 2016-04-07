Rails.application.routes.draw do
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  root 'site_chrome#header'

  get '/header' => 'site_chrome#header'
  get '/footer' => 'site_chrome#footer'
end
