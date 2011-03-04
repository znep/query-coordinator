namespace :deploy do
  desc "Move cleartext javascripts out of public so they don't get served"
  task :move_resources do
    FileUtils.mv('public/javascripts', 'app/javascripts')
  end
end
