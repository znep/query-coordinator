namespace :webpack do

  desc "Webpack all Perspectives JavaScript assets in app/assets/javascripts"
  task :build do
    system "npm run webpack"
  end

end

task :webpack => [ 'webpack:build' ]
