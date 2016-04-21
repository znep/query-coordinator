Chrome::Engine.routes.draw do

  get 'themes/custom' => 'themes#custom', defaults: { format: 'css' }

end
