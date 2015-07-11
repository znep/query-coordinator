namespace :test do
  Rake::Task[:test].enhance do
    system('rspec')
  end
end
