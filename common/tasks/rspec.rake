namespace 'rspec' do
  task :deps do
    npm('site_chrome', 'run check-dependencies') do |ok, res|
      unless ok
        npm('site_chrome', 'install')
      end
    end
  end

  task :runonce do
    rspec 'site_chrome'
  end

  task :watch do
    guard 'site_chrome'
  end
end

desc 'Run all Ruby tests'
task spec: %w[rspec:deps rspec:runonce]

desc 'Watch Ruby test files'
task spec_watch: %w[rspec:deps rspec:watch]
