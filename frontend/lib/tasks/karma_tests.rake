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

      cmd = "node --max_old_space_size=4096 ./node_modules/karma/bin/karma start karma/#{dir}/karma.conf.js --singleRun #{!watch} --browsers #{browser} --reporters #{reporter}"

      if watch
        puts "Executing the following command with no timeout:\n#{cmd}"
        fail("#{dir} Karma tests failed (exit code: #{$?.exitstatus})") unless system(cmd)
      else
        timeout_secs = ENV['KARMA_TIMEOUT_SECONDS'] || 300

        puts "Executing the following command with #{timeout_secs} second timeout:\n#{cmd}"
        begin
          Timeout.timeout(timeout_secs) do
            fail("#{dir} Karma tests failed (exit code: #{$?.exitstatus})") unless system(cmd)
          end
        rescue Timeout::Error
          fail("#{dir} Karma tests failed due to time out")
        end
      end

      puts "#{dir} Karma tests completed without failure."
    end

    # ADD NEW TEST SUITES HERE
    {
      'adminActivityFeed' => 'update_admin_activity_feed_translations',
      'adminGoals' => 'update_admin_goals_translations',
      'adminUsersV2' => 'update_admin_users_v2_translations',
      'catalogLandingPage' => 'update_catalog_landing_page_translations',
      'common' => 'update_common_translations',
      'dataCards' => 'update_datacards_translations',
      'datasetLandingPage' => 'update_dataset_landing_page_translations',
      'datasetManagementUI' => 'update_dataset_management_ui_translations',
      'internalAssetManager' => 'update_internal_asset_manager_translations',
      'opMeasure' => 'update_op_measure_translations',
      'signin' => 'update_signin_translations',
      'visualizationCanvas' => 'update_visualization_canvas_translations',

      'exampleTestSuite' => nil,
      'oldUx' => nil,
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
      'test:karma:translations:update_admin_activity_feed_translations',
      'test:karma:translations:update_admin_goals_translations',
      'test:karma:translations:update_admin_users_v2_translations',
      'test:karma:translations:update_catalog_landing_page_translations',
      'test:karma:translations:update_common_translations',
      'test:karma:translations:update_datacards_translations',
      'test:karma:translations:update_dataset_landing_page_translations',
      'test:karma:translations:update_dataset_management_ui_translations',
      'test:karma:translations:update_internal_asset_manager_translations',
      'test:karma:translations:update_op_measure_translations',
      'test:karma:translations:update_signin_translations',
      'test:karma:translations:update_visualization_canvas_translations'
    ]
    desc 'parallel'
    task :parallel => parallel_deps do
      cmd = 'node karma/parallelize.js'
      puts cmd
      exit($?.exitstatus) unless system(cmd)
    end

    desc 'mock translations in support of Karma tests'
    namespace :translations do
      # Task helper to reduce repetition.
      #
      # Use a blank key in the translation map to indicate that the translations
      # at the corresponding path should be located at the root of the output.
      # Use a dot delimiter to indicate nested paths in the YAML source.
      #
      # The fewer transformations your app makes between the YAML source and the
      # exported output, the happier you will be.
      def update_translations(translation_map, destination_file, export = 'export default')
        translations_filename = 'config/locales/en.yml'
        all_translations = YAML.load_file(translations_filename)['en']

        translations = translation_map.reduce({}) do |acc, (key, path)|
          translation_group = all_translations.dig(*path.split('.'))

          if key.present?
            acc[key] = if acc.key?(key)
              acc[key].merge(translation_group)
            else
              translation_group
            end
          else
            acc.merge!(translation_group)
          end

          acc
        end

        translations = all_translations if translations.empty?

        File.write(destination_file, "#{export} #{translations.to_json.html_safe};")
      end

      task :update_common_translations do
        translation_map = {
          common: 'common',
          dataset_landing_page: 'dataset_landing_page'
        }

        update_translations(
          translation_map,
          'karma/common/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      desc 'Helper task that creates a js file that injects translation into browser'
      task :update_datacards_translations do
        translation_map = {
          '': 'angular.dataCards'
        }

        update_translations(
          translation_map,
          'karma/dataCards/mockTranslations.js',
          export = 'window.translations ='
        )
      end

      task :update_catalog_landing_page_translations do
        translation_map = {
          '': 'catalog_landing_page',
          common: 'common',
          data_types: 'core.data_types'
        }

        update_translations(
          translation_map,
          'karma/catalogLandingPage/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      task :update_dataset_landing_page_translations do
        translation_map = {
          '': 'dataset_landing_page',
          data_types: 'core.data_types',
          common: 'common'
        }

        update_translations(
          translation_map,
          'karma/datasetLandingPage/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      task :update_internal_asset_manager_translations do
        translation_map = {
          '': 'internal_asset_manager',
          common: 'common'
        }

        update_translations(
          translation_map,
          'karma/internalAssetManager/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      task :update_dataset_management_ui_translations do
        translation_map = {
          '': 'dataset_management_ui',
          data_types: 'core.data_types',
          edit_metadata: 'screens.edit_metadata',
          schema_preview: 'dataset_landing_page.schema_preview',
          common: 'common'
        }

        update_translations(
          translation_map,
          'karma/datasetManagementUI/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      task :update_admin_goals_translations do
        translation_map = {
          '': 'govstat'
        }

        update_translations(
          translation_map,
          'karma/adminGoals/mockTranslations.js'
        )
      end

      task :update_admin_activity_feed_translations do
        translation_map = {
          '': 'screens.admin.jobs'
        }

        update_translations(
          translation_map,
          'karma/adminActivityFeed/mockTranslations.js'
        )
      end

      task :update_admin_users_v2_translations do
        translation_map = {
          '': 'users'
        }

        update_translations(
          translation_map,
          'karma/adminUsersV2/mockTranslations.js',
          export = 'module.exports ='
        )
      end

      task :update_visualization_canvas_translations do
        translation_map = {
          '': 'visualization_canvas'
        }

        update_translations(
          translation_map,
          'karma/visualizationCanvas/mockTranslations.js'
        )
      end

      task :update_op_measure_translations do
        translation_map = {
          '': 'open_performance'
        }

        update_translations(
          translation_map,
          'karma/opMeasure/mockTranslations.js'
        )
      end

      task :update_signin_translations do
        translation_map = {}

        update_translations(
          translation_map,
          'karma/signin/mockTranslations.js',
          export = 'module.exports ='
        )
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
      'karma:opMeasure',
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
