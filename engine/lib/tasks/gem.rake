namespace :socrata_site_chrome do
  namespace :gem do
    desc "Build release #{SocrataSiteChrome::VERSION} of gem and push to socrata_site_chrome-#{SocrataSiteChrome::VERSION}"
    task :release do
      puts "Previously released version of socrata_site_chrome gem: #{previously_released_version}"
      if previously_released_version?
        puts "socrata-site-chrome-#{SocrataSiteChrome::VERSION} has already been released. Skipping."
        next
      end

      puts `npm install`
      Dir.chdir("#{Dir.pwd}/engine") unless Dir.pwd.ends_with?('engine')

      puts `bin/push_base_locale -y`
      abort('Could not push to LocaleApp') unless $?.success?

      puts `bin/pull_translations`
      # pull_translations will fail regularly because it can't write to a log File
      # so we check to make sure that we actually downloaded locale files.
      abort('Did not successfully download locales') unless File.exists?('config/locales/es.yml')

      puts `rake release`
      abort('Failed to release gem.') unless $?.success?
    end

    private

    def previously_released_version?
      current_version = Gem::Version.new(SocrataSiteChrome::VERSION)
      released_version = Gem::Version.new(previously_released_version)
      current_version < released_version
    end

    def previously_released_version
      @previously_released_version ||= $1 if `gem search socrata_site_chrome -r`.strip =~ /\((.+)\)$/
    end
  end

  task :gem => ['gem:release']
end
