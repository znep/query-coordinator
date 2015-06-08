require 'rails_helper'

RSpec.describe Aws::DatabaseMaintainer do
  let(:environment) { 'staging' }
  let(:region) { 'us-west-2' }
  let(:marathon_config_url) { "http://marathon.aws-us-west-2-#{environment}.socrata.net/v2/apps/#{environment}/storyteller" }
  let(:rake_application) { spy('rake_application') }

  let(:subject) { Aws::DatabaseMaintainer.new(environment: environment, region: region) }

  before do
    stub_request(:get, marathon_config_url).
      to_return(status: 200, body: fixture('marathon-storyteller.json'), headers: {'Content-Type' => 'application/json; charset=utf-8'})

    allow_any_instance_of(Aws::DatabaseMaintainer).to receive(:decrypted_db_password).and_return('database_password')
    allow(Rake).to receive(:application).and_return(rake_application)
  end

  after do
    # We set this environment in one of the tests. Make sure we reset it
    ENV['RAILS_ENV'] = 'test'
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

    describe 'sets environment from marathon config' do
      before do
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
      end
      it 'sets PG_DB_HOST' do
        expect(ENV['PG_DB_HOST']).to eq('storyteller-staging.abcdefghij.us-west-2.rds.amazonaws.com')
      end
      it 'sets PG_DB_NAME' do
        expect(ENV['PG_DB_NAME']).to eq('storyteller_production')
      end
      it 'sets PG_DB_PORT' do
        expect(ENV['PG_DB_PORT']).to eq('5432')
      end
      it 'sets PG_DB_USER' do
        expect(ENV['PG_DB_USER']).to eq('storyteller_rwc')
      end
      it 'sets CLORTHO_BUCKET' do
        expect(ENV['CLORTHO_BUCKET']).to eq('staging-credentials-bucket-credsbucket-abcdefghij')
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

    describe 'sets up rake' do
      before do
        Aws::DatabaseMaintainer.new(environment: environment, region: region)
      end
      # it 'sets RAILS_ENV' do
      #   expect(ENV['RAILS_ENV']).to eq('aws_migrations')
      # end
      it 'inits and loads rakefile' do
        expect(rake_application).to have_received(:init)
        expect(rake_application).to have_received(:load_rakefile)
      end
    end
  end

  %w( migrate rollback seed ).each do |task|
    describe "##{task}" do
      subject { Aws::DatabaseMaintainer.new(environment: environment, region: region) }

      it 'sets different environment for migrations' do
        expect(ActiveRecord::Base).to receive(:establish_connection).with(:aws_migrations)
        expect(ActiveRecord::Base).to receive(:establish_connection).with(ENV['RAILS_ENV'].to_sym)
        subject.send(task)
      end

      it "invokes db:#{task} rake task" do
        task_spy = spy('task')
        expect(rake_application).to receive(:[]).with("db:#{task}").and_return(task_spy)
        expect(task_spy).to receive(:invoke)
        subject.send(task)
      end
    end
  end
end
