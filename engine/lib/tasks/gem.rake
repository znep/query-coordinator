namespace :socrata_site_chrome do
  namespace :gem do
    desc 'Cleaning old gem versions'
    task :clean do
      Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')
      puts `rm socrata_site_chrome-*.gem`
    end

    desc 'Build Chrome Gem'
    task :build do
      puts `npm install`
      puts("Building socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem")
      Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')
      puts `gem build socrata_site_chrome.gemspec`
    end

    desc 'Publish Chrome Gem'
    task :publish do
      puts("Publishing socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem")
      Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')
      puts `gem push socrata_site_chrome-#{SocrataSiteChrome::VERSION}.gem --host https://socrata.artifactoryonline.com/socrata/api/gems/rubygems-virtual`
      # NOTE: the --host path cannot end in a slash. If it does you will get a mysterious 405 error
      puts 'Tagging the version in Git'
      puts `rake app:tag`
    end
  end

  task :gem => ['gem:clean', 'gem:build', 'gem:publish']
end
