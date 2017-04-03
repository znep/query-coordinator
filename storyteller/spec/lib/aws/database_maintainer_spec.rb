require 'rails_helper'

RSpec.describe Aws::DatabaseMaintainer do
  let(:environment) { 'staging' }
  let(:region) { 'us-west-2' }
  let(:marathon_config_url) { "http://marathon.aws-#{region}-#{environment}.socrata.net/v2/apps/#{environment}/storyteller" }
  let(:rake_application) { spy('rake_application') }
  let(:decima_client) { double('decima_client') }

  let(:subject) { Aws::DatabaseMaintainer.new(environment: environment, region: region) }

  before do
    stub_request(:get, marathon_config_url).
      to_return(status: 200, body: fixture('marathon-storyteller.json'), headers: {'Content-Type' => 'application/json; charset=utf-8'})

    allow(Decima::Client).to receive(:new).and_return(decima_client)
    allow(decima_client).to receive(:get_deploys).
      with(environments: [environment], services: ['storyteller']).
      and_return([instance_double('Decima::Deploy', service_sha: 'f89a7929')])

    allow_any_instance_of(Aws::DatabaseMaintainer).to receive(:decrypted_db_password).and_return('database_password')
    allow_any_instance_of(Aws::DatabaseMaintainer).to receive(:local_repository_sha).and_return('f89a7929abcdef234875ed')

    allow(Rake).to receive(:application).and_return(rake_application)

    allow(Vpn).to receive(:active?).and_return(true)
  end

  after do
    # We set this environment in one of the tests. Make sure we reset it
    Rails.env = 'test'
  end

  describe '#new' do
    it 'accepts args' do
      expect {
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
      }.to_not raise_error
    end

    context 'with invalid environment' do
      let(:environment) { 'zoo' }

      it 'fails on initialization' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error(ArgumentError)
      end
    end

    context 'with invalid region' do
      let(:region) { 'southwest' }

      it 'fails on initialization' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error(ArgumentError)
      end
    end

    context 'when marathon config is unreachable' do
      before do
        stub_request(:get, marathon_config_url).to_return(status: 403)
      end

      it 'raises exception' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error('Could not get environment config from marathon.')
      end
    end

    context 'when deployed version does not match' do
      before do
        allow_any_instance_of(Aws::DatabaseMaintainer).to receive(:local_repository_sha).and_return('987654321abcdef123456')
      end

      it 'fails on initialization' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error('Code mismatch. Try `git pull && git checkout f89a7929` and run again.')
      end
    end

    context 'when no deployed version' do
      before do
        allow(decima_client).to receive(:get_deploys).
          with(environments: [environment], services: ['storyteller']).
          and_return([])
      end

      it 'fails on initialization' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error('Not deployed in the current environment.')
      end
    end

    context 'when VPN is inactive' do
      before do
        allow(Vpn).to receive(:active?).and_return(false)
      end

      it 'fails on initialization' do
        expect {
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
        }.to raise_error('VPN connection is not active.')
      end
    end

    describe 'sets environment from marathon config' do
      before do
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
      end
      it 'sets PG_DB_HOST' do
        expect(ENV['PG_DB_HOST']).to eq('storyteller-test.abcdefghij.us-west-2.rds.amazonaws.com')
      end
      it 'sets PG_DB_NAME' do
        expect(ENV['PG_DB_NAME']).to eq('storyteller_test_db_name')
      end
      it 'sets PG_DB_PORT' do
        expect(ENV['PG_DB_PORT']).to eq('5432')
      end
      it 'sets PG_DB_USER' do
        expect(ENV['PG_DB_USER']).to eq('storyteller_test_user')
      end
      it 'sets CLORTHO_BUCKET' do
        expect(ENV['CLORTHO_BUCKET']).to eq('test-credentials-bucket-credsbucket-abcdefghij')
      end
      it 'sets CLORTHO_PATH' do
        expect(ENV['CLORTHO_PATH']).to eq('storyteller_secrets.sh')
      end
    end

    # Skipping over the decryption part. Don't care to test out the clortho-get code
    # or spend the time to encrypt some new data to be decrypted.
    describe 'sets environment from clortho' do
      let(:db_password) { 'alksjdhf82laksndjf' }
      before do
        allow_any_instance_of(Aws::DatabaseMaintainer).to receive(:decrypted_db_password).and_return(db_password)
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
      end
      it 'sets PG_DB_PASSWORD' do
        expect(ENV['PG_DB_PASSWORD']).to eq(db_password)
      end
    end

    describe 'Rails.env' do
      it 'is set to "aws_migrations"' do
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
        expect(Rails.env).to eq('aws_migrations')
      end
    end

    it 'removes AWS env vars that cause conflicts' do
      expect(ENV).to receive(:delete).with('AWS_S3_BUCKET_NAME')
      expect(ENV).to receive(:delete).with('AWS_ACCESS_KEY_ID')
      expect(ENV).to receive(:delete).with('AWS_SECRET_KEY')

      Aws::DatabaseMaintainer.new(environment: environment, region: region)
    end

    context 'when environment is not staging' do
      let(:environment) { 'rc' }
      let(:app_version) { SemVer.find.format('%M.%m.%p') }
      let(:app_version_for_url) { app_version.gsub('.', '-') }
      let(:marathon_config_url) { "http://marathon.aws-#{region}-#{environment}.socrata.net/v2/apps/#{environment}/storyteller/#{app_version_for_url}" }

      it 'calls marathon with version in endpoint' do
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
        expect(ENV['PG_DB_HOST']).to eq('storyteller-test.abcdefghij.us-west-2.rds.amazonaws.com')
      end

      context 'when environment is eu-west-1-prod' do
        let(:environment) { 'eu-west-1-prod' }
        let(:region) { 'eu-west-1' }
        let(:marathon_config_url) { "http://marathon.aws-#{environment}.socrata.net/v2/apps/#{environment}/storyteller/#{app_version_for_url}" }

        it 'calls marathon with special endpoint' do
          Aws::DatabaseMaintainer.new(environment: environment, region: region)
          expect(ENV['PG_DB_HOST']).to eq('storyteller-test.abcdefghij.us-west-2.rds.amazonaws.com')
        end
      end
    end
  end

  %w( migrate rollback seed ).each do |task|
    describe "##{task}" do
      subject { Aws::DatabaseMaintainer.new(environment: environment, region: region) }

      it "invokes db:#{task} rake task" do
        task_spy = spy('task')
        expect(rake_application).to receive(:[]).with("db:#{task}").and_return(task_spy)
        expect(task_spy).to receive(:invoke)
        subject.send(task)
      end
    end
  end

  describe "#status" do
    subject { Aws::DatabaseMaintainer.new(environment: environment, region: region) }

    it "invokes db:migrate:status rake task" do
      task_spy = spy('task')
      expect(rake_application).to receive(:[]).with("db:migrate:status").and_return(task_spy)
      expect(task_spy).to receive(:invoke)
      subject.status
    end
  end

end
