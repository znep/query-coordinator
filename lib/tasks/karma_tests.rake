namespace :test do

  # Helper task that creates a js file that injects translation into browser.
  task :update_datacards_translations do
    translations_filename = 'config/locales/en.yml'
    output_filename = 'karma/dataCards/mockTranslations.js'
    translations = YAML.load_file(translations_filename)['en']['angular']['dataCards']
    File.write(output_filename, 'window.translations = ' + translations.to_json.html_safe + ';')
  end

  namespace :js do
    def run_karma(dir, args = {})
      watch = args.watch == 'true'
      browser = args.browser || 'PhantomJS'
      reporter = args.reporter || 'dots,coverage'

      if browser =~ /^phantom/i then
        browser = 'PhantomJS'
      elsif browser =~ /^chrome/i then
        browser = 'Chrome'
      elsif browser =~ /^firefox/i then
        browser = 'Firefox'
      end

      cmd = "./node_modules/karma/bin/karma start karma/#{dir}/karma.conf.js --singleRun #{!watch} --browsers #{browser} --reporters #{reporter}"
      puts cmd
      fail($?.exitstatus) unless system(cmd)
    end

    task :dataCards, [:watch, :browser, :reporter] => 'update_datacards_translations' do |task, args|
      run_karma('dataCards', args)
    end

    task :oldUx, [:watch, :browser, :reporter] do |task, args|
      run_karma('oldUx', args)
    end
  end

  task :js, [:watch, :browser, :reporter] => ['js:dataCards', 'js:oldUx']

  # Keep this <= the maximum concurrency listed on the SauceLabs account dashboard. Otherwise timeouts will occur.
  MAX_SAUCELABS_CONCURRENT_RUNS = 6
  SUPPORTED_BROWSERS = JSON.parse(open('supported_browsers.json').read())

  # IMPORTANT: If you add/remove/change test groups,
  # please update karma.conf.js (look for the calls to isTestGroupIncluded).
  # If you don't, your tests may be executed multiple times per run.
  TEST_GROUPS = %w(services controllers directives-card-layout directives-maps directives-other filters integration models util)

  desc "Run all karma tests and update test-coverage result"
  task :karma => 'update_datacards_translations' do
    # Manually enable the coverage reporter. It isn't enabled by default as the instrumentation step makes
    # the product code unintelligible.
    cmd = './node_modules/karma/bin/karma start karma/dataCards/karma.conf.js --browsers PhantomJS --singleRun true --reporters dots,coverage'
    cmd += ' && ./node_modules/karma/bin/karma start karma/old-ux/karma.conf.js --browsers PhantomJS --singleRun true --reporters dots,coverage'
    fail($?.exitstatus) unless system(cmd)
  end

  def get_supported_browser_launcher_names(critical_only, browser_families)
    def name_for_browser_instance(browser_name, instance)
      "saucelabs #{browser_name} #{instance['version']} #{instance['platform']}".downcase
    end

    all_supported_browser_families = SUPPORTED_BROWSERS.keys();
    unsupported_browser_families = browser_families - all_supported_browser_families

    unless unsupported_browser_families.empty?
      raise "Unsupported browser families: #{unsupported_browser_families}. Supported families: #{all_supported_browser_families}"
    end

    browser_names = []
    critical_browser_names = []
    SUPPORTED_BROWSERS.each do |browser_name, browser_instances|
      if browser_families.include?(browser_name)
        browser_instances.each do |instance|
          instance_name = name_for_browser_instance(browser_name, instance)
          browser_names.push(instance_name)
          if instance['critical']
            critical_browser_names.push(instance_name)
          end
        end
      end
    end

    critical_only ? critical_browser_names : browser_names
  end

  def exclude_everything_but(sole_included_group)
    TEST_GROUPS - [ sole_included_group ]
  end

  desc 'Run karma tests in SauceLabs. Accepts CRITICAL_BROWSERS_ONLY=true|false and BROWSER_FAMILIES="comma separated browser names" ENV variables'
  task :karma_sauce do
    env_browser_families = ENV['BROWSER_FAMILIES']
    browser_families =
      if env_browser_families then
        env_browser_families.downcase.split(',').collect(&:strip)
      else
        SUPPORTED_BROWSERS.keys()
      end

    critical_only = ENV['CRITICAL_BROWSERS_ONLY'] == 'true'

    browser_names = get_supported_browser_launcher_names(critical_only, browser_families)

    if browser_names.empty?
      raise "No browsers found that match constraints: CRITICAL_BROWSERS_ONLY=#{critical_only} BROWSER_FAMILIES=#{browser_families.join(', ')}"
    end

    puts "About to launch SauceLabs test run against #{browser_names.length} browser(s). Last chance to terminate cleanly (5s)"
    sleep 5
    puts "Launching in batches of #{MAX_SAUCELABS_CONCURRENT_RUNS} browsers"

    # Split the test run into batches, and run each batch separately.
    # This is for memory consumption reasons.
    # There are issues with leaking memory in karma and angular-mocks.
    group_a_excludes = exclude_everything_but('directives-maps')
    group_b_excludes = exclude_everything_but('directives-card-layout')
    group_c_excludes = exclude_everything_but('directives-other')
    group_remainder_excludes = TEST_GROUPS - (group_a_excludes & group_b_excludes & group_c_excludes)

    [ group_a_excludes, group_b_excludes, group_remainder_excludes ].each do |excluded_groups|
      browser_names.each_slice(MAX_SAUCELABS_CONCURRENT_RUNS) do |this_slice_browser_names|
        puts "Launching batch: #{this_slice_browser_names} minus groups: #{excluded_groups}"
        command = "karma start karma/dataCards/karma.conf.js --browsers \"#{this_slice_browser_names.join(',')}\" --exclude-groups \"#{excluded_groups.join(',')}\" --singleRun true"
        success = system(command)
        raise 'Data Lens Karma test failure' unless success
      end
    end

    puts "Launching Old UX Tests for: #{browser_names}"
    command = "karma start karma/old-ux/karma.conf.js --browsers \"#{browser_names.join(',')}\" --singleRun true"
    success = system(command)
    raise 'Old UX Karma test failure' unless success

    puts 'Overall run passed without failures'

  end

  desc "Publish test-coverage result to geckoboard dashboard"
  task :publish_coverage_to_dashboard do
    # We maintain an internal dashboard at socratametrics.geckoboard.com.
    # One of the widgets is a code coverage meter for the frontend unit tests.
    # Since our Jenkins builds are not exposed to the internet, to populate this meter
    # we must push the coverage results up to geckoboard ourselves. This task looks at the latest
    # coverage run (rake test:karma) and updates the widget.

    geckoboard_api_key = 'b84ed380a729972213e3452b5c8de8b7'
    widget_url = URI.parse('https://push.geckoboard.com/v1/send/106298-84d0c65a-5787-4109-87c6-3fc24e8b1958')

    coverage_report_file_path = 'karma/coverage-reports/dataCards/cobertura-coverage.xml'
    coverage_rate_warn_level = 0.70

    raise "Coverage file doesn't exist, you may want to run rake test:karma first" unless File.exist?(coverage_report_file_path)
    coverage_report_file = File.open(coverage_report_file_path)
    coverage_report = Nokogiri::XML(coverage_report_file)
    coverage_report_file.close()

    branch_rate = coverage_report.xpath('//coverage/@branch-rate')[0].value.to_f
    line_rate = coverage_report.xpath('//coverage/@line-rate')[0].value.to_f

    # Coverage quality is currently a totally arbitrary determination using
    # branch rate (ignoring other metrics).
    # We convey this determination via doomguy health condition.
    # These image keys are assets on staging.
    image_key = case
    when branch_rate < 0.30
      '1978D953-C861-4842-BC71-91FFF1D6B20F'
    when branch_rate < 0.60
      '2E2B4085-5C75-490C-85A3-8E31DC44DFFF'
    when branch_rate < 0.70
      'E35F7C26-3D05-421D-A1F9-A686C07A2006'
    when branch_rate < 0.80
      'DC1DB1B7-51DD-4E06-A97B-E8FB35D8BD1E'
    when branch_rate < 0.90
      '4BDEC170-D2C3-47BF-9F07-3DA98FEEEC8D'
    else
      '2FD479DF-FD36-429A-9A58-3E7F66FB8A56'
    end

    widget_config = {
      'api_key' => geckoboard_api_key,
      'data' => {
        'item' => [
          {
            'text' => "
              <div><img src='https://opendata.test-socrata.com/api/assets/#{image_key}' style='position: relative; left: calc(50% - 25px);'></img></div>
              <div style='text-align: center; font-size: 80%; margin-top: 30px;'>Branch: #{'%.0f%' % (100 * branch_rate)}<br />Line: #{'%.0f%' % (100 * line_rate)}</div>
              ",
            'type' => branch_rate < coverage_rate_warn_level ? '1' : '0'
          }
        ]
      }
    }

    http = Net::HTTP::new(widget_url.host, widget_url.port)
    http.use_ssl = true
    request = Net::HTTP::Post.new(widget_url.request_uri)
    request.body = JSON.dump(widget_config)
    response = http.request(request)

    if response.kind_of?(Net::HTTPSuccess)
      puts 'Coverage results pushed to dashboard'
    else
      raise 'Unable to post coverage dashboard results'
    end
  end
end

Rake::Task[:test].enhance { Rake::Task["test:js"].invoke }
