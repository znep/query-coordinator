namespace :gem do
  desc 'Build Chrome Gem'
  task :build do
    puts("Building socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem")
    Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')
    puts `gem build socrata_site_chrome.gemspec`
  end

  desc 'Publish Chrome Gem'
  task :publish do
    puts("Publishing socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem")
    Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')
    puts `gem push socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem --host https://socrata.artifactoryonline.com/socrata/api/gems/ruby-local/`
  end
end

task :gem => ['gem:build', 'gem:publish']
