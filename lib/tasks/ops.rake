require 'mrdialog'
require_relative 'ops/aws_credentials'
require_relative 'ops/vpn'
require_relative 'ops/jenkins'
require_relative 'ops/ops_ui'
require_relative 'ops/new_release_ui'

namespace :ops do
  desc 'Check if the datacenter VPN is active'
  task :check_vpn do

    raise 'VPN not connected' unless Vpn.active?
  end

  desc 'Check if the user has proper AWS credentials'
  task :check_aws_creds do

    dialog = MRDialog.new
    missing_creds = []

    check = lambda do |env, check_passed|
      puts("#{env} => #{check_passed ? 'OK' : 'MISSING'}")
      missing_creds.push(env) unless check_passed
    end

    check.call('AWS Production', AwsCredentials.has_credentials_for?('prod'))
    check.call('AWS Staging', AwsCredentials.has_credentials_for?('staging'))
    check.call('AWS West Europe', AwsCredentials.has_credentials_for?('eu-west-1-prod'))

    if missing_creds.empty?
      puts('Credentials present.')
    else
      raise "Missing AWS credentials in ~/.aws/credentials: #{missing_creds.join}"
    end
  end

  namespace :jenkins do
    desc 'Check if the user has proper Jenkins credentials'
    task :check_creds do

      Jenkins.assert_auth_configured
    end

    desc 'Find the jenkins build associated with a release sha'
    task :find_build_number_from_sha, :sha do |t, args|
      sha = args[:sha]
      build = Jenkins.find_frontend_release_build(sha)
      if build
        puts "Build number: #{build}"
      else
        puts "SHA not found in any build."
      end
    end
  end

  desc 'Perform operational/deploy tasks using an interactive UI'
  task :ui do
    ui = OpsUi.new
    ui.open
  end

  namespace :ui do
    desc 'Create a new release and build it'
    task :new_release do
      NewReleaseUi.new.open
    end
  end
end

desc 'Perform operational/deploy tasks using an interactive UI'
task :ops => 'ops:ui'
