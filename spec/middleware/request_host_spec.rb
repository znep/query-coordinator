require 'request_host'

describe RequestHost do
  let(:app) { double(:app) }

  subject { RequestHost.new(app) }

  describe 'the environment hash' do
    let(:env) { {} }

    let(:environment_hash_without_x_socrata_host) do
      {
        "REQUEST_METHOD"=>"GET",
        "REQUEST_URI"=>"http://domain.in.host.header.com/some_path?query=value",
        "SCRIPT_NAME"=>"/some_path",
        "SERVER_NAME"=>"domain.in.host.header.com",
        "SERVER_PORT"=>"80",
        "HTTP_HOST"=>"domain.in.host.header.com",
        "REQUEST_PATH"=>"/stories/admin",
        "ORIGINAL_FULLPATH"=>"/stories/admin",
        "ORIGINAL_SCRIPT_NAME"=>"/stories",
      }
    end

    it 'calls app with the same env hash' do
      expect(app).to receive(:call).with(env) # blank
      subject.call(env)
    end

    context 'when the X-Socrata-Host header is set' do
      let(:env) do
        environment_hash_without_x_socrata_host.merge(
          "HTTP_X_SOCRATA_HOST" => "domain.in.x.socrata.host.header.com"
        )
      end

      it 'replaces the existing SERVER_NAME with the contents of the header' do
        expect(app).to receive(:call).with(
          hash_including('SERVER_NAME' => 'domain.in.x.socrata.host.header.com')
        )

        subject.call(env.deep_dup)
      end

      it 'replaces the existing HTTP_HOST with the contents of the header' do
        expect(app).to receive(:call).with(
          hash_including('HTTP_HOST' => 'domain.in.x.socrata.host.header.com')
        )

        subject.call(env.deep_dup)
      end

      context 'with a valid REQUEST_URI' do
        it 'rewrites the existing REQUEST_URI use X-Socrata-Host as the domain' do
          expect(app).to receive(:call).with(
            hash_including(
              'REQUEST_URI' => 'http://domain.in.x.socrata.host.header.com/some_path?query=value'
            )
          )
          subject.call(env.deep_dup)
        end
      end

      # Rack catches these sorts of things for us, but let's be safe.
      context 'with an invalid REQUEST_URI' do
        it 'raises URI::InvalidURIError' do
          expect do
            subject.call(
              env.merge(
                'REQUEST_URI' => '0.0.0.0/something bad'
              )
            )
          end.to raise_error(URI::InvalidURIError)
        end
      end
    end

    context 'when the X-Socrata-Host header is not set' do
      let(:env) do
        environment_hash_without_x_socrata_host
      end

      it 'keeps the existing SERVER_NAME' do
        expect(app).to receive(:call).with(
          hash_including('SERVER_NAME' => 'domain.in.host.header.com')
        )

        subject.call(environment_hash_without_x_socrata_host.deep_dup)
      end

      it 'keeps the existing HTTP_HOST' do
        expect(app).to receive(:call).with(
          hash_including('HTTP_HOST' => 'domain.in.host.header.com')
        )

        subject.call(environment_hash_without_x_socrata_host.deep_dup)
      end

      it 'keeps the existing REQUEST_URI' do
        expect(app).to receive(:call).with(
          hash_including('REQUEST_URI' => 'http://domain.in.host.header.com/some_path?query=value')
        )

        subject.call(environment_hash_without_x_socrata_host.deep_dup)
      end
    end
  end
end
