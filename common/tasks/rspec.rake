namespace 'rspec' do
  task :deps do
    bundle('site_chrome', 'check') do |ok, res|
      bundle('site_chrome', 'install') unless ok
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
