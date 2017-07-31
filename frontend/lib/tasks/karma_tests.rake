require 'timeout'

namespace :test do

  desc 'Run the Karma test suites'
  namespace :karma do

    def run_karma(dir, args = {})
      watch = args.watch == 'true'
      browser = args.browser || 'ChromeNoSandboxHeadless'
      reporter = args.reporter || 'mocha'

      # Normalize case.
      if browser =~ /^ChromeNoSandboxHeadless$/i then
        browser = 'ChromeNoSandboxHeadless'
      elsif browser =~ /^chrome$/i then
        browser = 'Chrome'
      elsif browser =~ /^firefox/i then
        browser = 'Firefox'
      end

      timeout_secs = ENV['KARMA_TIMEOUT_SECONDS'] || 300

      cmd = "node --max_old_space_size=4096 ./node_modules/karma/bin/karma start karma/#{dir}/karma.conf.js --singleRun #{!watch} --browsers #{browser} --reporters #{reporter}"
      puts "Executing the following command with #{timeout_secs} second timeout:\n#{cmd}"
      begin
        Timeout.timeout(timeout_secs) do
          fail("#{dir} Karma tests failed (exit code: #{$?.exitstatus})") unless system(cmd)
        end
      rescue Timeout::Error
        fail("#{dir} Karma tests failed due to time out")
      end
      puts "#{dir} Karma tests completed without failure."
    end

    # ADD NEW TEST SUITES HERE
    {
      'catalogLandingPage' => 'update_catalog_landing_page_translations',
      'common' => 'update_common_translations',
      'dataCards' => 'update_datacards_translations',
      'datasetLandingPage' => 'update_dataset_landing_page_translations',
      'adminGoals' => 'update_admin_goals_translations',
      'adminActivityFeed' => 'update_admin_activity_feed_translations',
      'adminUsersV2' => 'update_admin_users_v2_translations',
      'internalAssetManager' => 'update_internal_asset_manager_translations',
      'datasetManagementUI' => 'update_dataset_management_ui_translations',
      'visualizationCanvas' => 'update_visualization_canvas_translations',
      'signin' => 'update_signin_translations',
      'oldUx' => nil,
      'exampleTestSuite' => nil,
      'visualization_embed' => nil
    }.each do |task_name, dependency|
      desc task_name
      task_args = { %i(watch browser reporter) => "translations:#{dependency}" }
      task task_name, dependency ? task_args : task_args.keys.first do |_, args|
        run_karma(task_name, args)
      end
    end

    # an opinionated JS test runner for a parallelized single run
    parallel_deps = [
      'test:karma:translations:update_common_translations',
      'test:karma:translations:update_catalog_landing_page_translations',
      'test:karma:translations:update_datacards_translations',
      'test:karma:translations:update_dataset_landing_page_translations',
      'test:karma:translations:update_internal_asset_manager_translations',
      'test:karma:translations:update_admin_goals_translations',
      'test:karma:translations:update_admin_activity_feed_translations',
      'test:karma:translations:update_admin_users_v2_translations',
      'test:karma:translations:update_dataset_management_ui_translations',
      'test:karma:translations:update_visualization_canvas_translations',
      'test:karma:translations:update_signin_translations'
    ]
    desc 'parallel'
    task :parallel => parallel_deps do
      cmd = 'node karma/parallelize.js'
      puts cmd
      exit($?.exitstatus) unless system(cmd)
    end

    desc 'mock translations in support of Karma tests'
    namespace :translations do
      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_common_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/common/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = {
          :common => all_translations['common'],
          :dataset_landing_page => all_translations['dataset_landing_page']
        }
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_datacards_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/dataCards/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['angular']['dataCards']
        File.write(output_filename, 'window.translations = ' + translations.to_json.html_safe + ';')
      end

      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_catalog_landing_page_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/catalogLandingPage/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['catalog_landing_page'].merge(
          common: all_translations['common'],
          data_types: all_translations['core']['data_types']
        )
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_dataset_landing_page_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/datasetLandingPage/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['dataset_landing_page'].merge(
          data_types: all_translations['core']['data_types'],
        )

        common = all_translations['common']

        if translations.key?('common')
          translations['common'] = translations['common'].merge(common)
        else
          translations = translations.merge(common: common)
        end

        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'update_internal_asset_manager_translations'
      task :update_internal_asset_manager_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/internalAssetManager/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['internal_asset_manager'].merge(
          common: all_translations['common']
        )
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'update_dataset_management_ui_translations'
      task :update_dataset_management_ui_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/datasetManagementUI/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = all_translations['dataset_management_ui'].merge(
          data_types: all_translations['core']['data_types'],
          edit_metadata: all_translations['screens']['edit_metadata'],
          schema_preview: all_translations['dataset_landing_page']['schema_preview']

        )

        common = all_translations['common']

        if translations.key?('common')
          translations['common'] = translations['common'].merge(common)
        else
          translations = translations.merge(common: common)
        end

        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end

      desc 'update_admin_goals_translations'
      task :update_admin_goals_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/adminGoals/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['govstat']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_admin_activity_feed_translations'
      task :update_admin_activity_feed_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/adminActivityFeed/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['screens']['admin']['jobs']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_admin_users_v2_translations'
      task :update_admin_users_v2_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/adminUsersV2/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['screens']['admin']['jobs']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_visualization_canvas_translations'
      task :update_visualization_canvas_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/visualizationCanvas/mockTranslations.js'
        translations = YAML.load_file(translations_filename)['en']['visualization_canvas']
        File.write(output_filename, "export default #{translations.to_json.html_safe};")
      end

      desc 'update_signin_translations'
      task :update_signin_translations do
        translations_filename = 'config/locales/en.yml'
        output_filename = 'karma/signin/mockTranslations.js'
        all_translations = YAML.load_file(translations_filename)['en']
        translations = {
          screens: {
            sign_in: all_translations['screens']['sign_in']
          }
        }
        File.write(output_filename, "module.exports = #{translations.to_json.html_safe};")
      end
    end

    desc 'run all the karma tasks'
    task :all, [:watch, :browser, :reporter] => [
      'karma:adminGoals',
      'karma:adminActivityFeed',
      'karma:adminUsersV2',
      'karma:catalogLandingPage',
      'karma:common',
      'karma:dataCards',
      'karma:datasetLandingPage',
      'karma:datasetManagementUI',
      'karma:internalAssetManager',
      'karma:oldUx',
      'karma:signin',
      'karma:visualizationCanvas',
      'karma:visualization_embed'
    ]
  end

  # Fun fact: A "feature" of rake is that any text after ". " in a description is silently truncated.
  # It will only show up if one invokes rake with the "-D" option to display full task descriptions.
  desc 'run all the karma tests, ex: rake test:karma[,,dots] # reporter == dots'
  task :karma, [:watch, :browser, :reporter] => 'test:karma:all'

end
