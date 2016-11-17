namespace :engine do

  task :spec do
    system("cd engine && rspec")
  end

end

