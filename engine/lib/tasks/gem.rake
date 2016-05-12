namespace :gem do
  desc 'Build Chrome Gem'
  task :build do
    puts("Building chrome-#{Chrome::VERSION}.gem")
    `gem build chrome.gemspec`
  end

  desc 'Publish Chrome Gem'
  task :publish do
    puts("Publishing chrome-#{Chrome::VERSION}.gem")
    `gem push chrome-#{Chrome::VERSION}.gem --host https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local`
  end
end

task :gem => ['gem:build', 'gem:publish']
