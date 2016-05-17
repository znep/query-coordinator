require 'rails_helper'

describe EsriCrawler do

  let(:host) { 'host' }
  let(:port) { 2030 }
  let(:base_url) { "http://#{host}:#{port}" }
  let(:stub_contents)  do
    {
      :headers => {'X-Socrata-Host' => host},
      :body => {}
    }
  end

  describe 'Crawler Requests' do
    before(:each) do
      allow(EsriCrawler).to receive(:hostname).and_return(host)
      allow(EsriCrawler).to receive(:port).and_return(port)
      allow(CurrentDomain).to receive(:cname).and_return(host)
    end


    context '#get' do
      let(:endpoint) { "#{base_url}/meow" }

      it 'raises BadRequest for responses code 400' do
        stub_request(:get, endpoint).with(stub_contents).to_return(
          :status => 400,
          :headers => {}
        )
        expect { EsriCrawler.get_request('/meow') }.to raise_error(EsriCrawler::BadRequest)
      end

      it 'can return an error response with bad JSON' do
        stub_request(:get, endpoint).with(stub_contents).to_return(
          :status => 400,
          :headers => {},
          :body => 'hello there'
        )

        expect { EsriCrawler.get_request('/meow') }.to raise_error(
          EsriCrawler::BadRequest, 'hello there')
      end

      it 'raises ResourceNotFound for status code 404' do
        stub_request(:get, endpoint).with(stub_contents).to_return(
          :status => 404,
          :headers => {},
          :body => 'hello there'
        )
        expect { EsriCrawler.get_request('/meow') }.to raise_error(EsriCrawler::ResourceNotFound)
      end

      it 'raises ServerError for status code 500' do
        stub_request(:get, endpoint).with(stub_contents).to_return(
          :status => 500,
          :headers => {},
          :body => "{'error' => 'it was a monster mash!'}"
        )
        expect { EsriCrawler.get_request('/meow') }.to raise_error(EsriCrawler::ServerError)
      end
    end

    context '#post' do
      let(:endpoint) { "#{base_url}/meow" }

      it 'raises BadRequest for responses code 400' do
        stub_request(:post, endpoint).with(stub_contents).to_return(:status => 400, :headers => {})
        expect { EsriCrawler.post_request('/meow', {}) }.to raise_error(EsriCrawler::BadRequest)
      end

      it 'can return an error response with bad JSON' do
        stub_request(:post, endpoint).with(stub_contents).to_return(
          :status => 400,
          :headers => {},
          :body => 'hello there'
        )
        expect { EsriCrawler.post_request('/meow', {}) }.to raise_error(EsriCrawler::BadRequest, 'hello there')
      end

      it 'raises ResourceNotFound for status code 404' do
        stub_request(:post, endpoint).with(stub_contents).to_return(
          :status => 404,
          :headers => {},
          :body => 'hello there'
        )
        expect { EsriCrawler.post_request('/meow', {}) }.to raise_error(EsriCrawler::ResourceNotFound)
      end

      it 'raises ServerError for status code 500' do
        stub_request(:post, endpoint).with(stub_contents).to_return(
          :status => 500,
          :headers => {},
          :body => "{'error' => 'it was a monster mash!'}"
        )
        expect { EsriCrawler.post_request('/meow', {}) }.to raise_error(EsriCrawler::ServerError, "{'error' => 'it was a monster mash!'}" )
      end

      it 'jsonifies the submitted body and returned body' do
        body = {'socrata_domain' => 'localhost', 'esri_domain' => 'sampleserver.com'}
        stub_contents[:body] = body.to_json
        stub_request(:post, endpoint).with(stub_contents).to_return(:status => 200, :body => '{}')
        expect(EsriCrawler.post_request('/meow', body)).to eq({})
      end
    end

    context '#patch' do
      let(:endpoint) { "#{base_url}/meow" }

      it 'raises BadRequest for responses code 400' do
        stub_request(:patch, endpoint).with(stub_contents).to_return(:status => 400, :headers => {})
        expect { EsriCrawler.patch_request('/meow', {}) }.to raise_error(EsriCrawler::BadRequest)
      end

      it 'can return an error response with bad JSON' do
        stub_request(:patch, endpoint).with(stub_contents).to_return(
          :status => 400,
          :headers => {},
          :body => 'hello there'
        )

        expect { EsriCrawler.patch_request('/meow', {}) }.to raise_error(EsriCrawler::BadRequest, 'hello there')
      end

      it 'raises ResourceNotFound for status code 404' do
        stub_request(:patch, endpoint).with(stub_contents).to_return(
          :status => 404,
          :headers => {},
          :body => 'hello there'
        )
        expect { EsriCrawler.patch_request('/meow', {}) }.to raise_error(EsriCrawler::ResourceNotFound)
      end

      it 'raises ServerError for status code 500' do
        stub_request(:patch, endpoint).with(stub_contents).to_return(
          :status => 500,
          :headers => {},
          :body => "{'error' => 'it was a monster mash!'}"
        )
        expect { EsriCrawler.patch_request('/meow', {}) }.to raise_error(EsriCrawler::ServerError, "{'error' => 'it was a monster mash!'}" )
      end
    end

    context '#delete' do
      let(:endpoint) { "#{base_url}/meow" }

      it 'raises BadRequest for responses code 400' do
        stub_request(:delete, endpoint).with(stub_contents).to_return(:status => 400, :headers => {})
        expect { EsriCrawler.delete_request('/meow') }.to raise_error(EsriCrawler::BadRequest)
      end

      it 'can return an error response with bad JSON' do
        stub_request(:delete, endpoint).with(stub_contents).to_return(
          :status => 400,
          :headers => {},
          :body => 'hello there'
        )

        expect { EsriCrawler.delete_request('/meow') }.to raise_error(EsriCrawler::BadRequest, 'hello there')
      end

      it 'raises ResourceNotFound for status code 404' do
        stub_request(:delete, endpoint).with(stub_contents).to_return(
          :status => 404,
          :headers => {},
          :body => 'hello there'
        )
        expect { EsriCrawler.delete_request('/meow') }.to raise_error(EsriCrawler::ResourceNotFound)
      end

      it 'raises ServerError for status code 500' do
        stub_request(:delete, endpoint).with(stub_contents).to_return(
          :status => 500,
          :headers => {},
          :body => "{'error' => 'it was a monster mash!'}"
        )
        expect { EsriCrawler.delete_request('/meow') }.to raise_error(EsriCrawler::ServerError, "{'error' => 'it was a monster mash!'}" )
      end
    end
  end

  describe 'In config settings' do

    before(:each) do
      allow(APP_CONFIG).to receive(:esri_crawler_hostname).and_return(host)
      allow(APP_CONFIG).to receive(:esri_crawler_port).and_return(port)
    end

    context '#hostname' do
      it 'returns the APP_CONFIG value' do
        expect(EsriCrawler.hostname).to eq(host)
      end
    end

    context '#port' do
      it 'returns the APP_CONFIG value' do
        expect(EsriCrawler.port).to eq(port)
      end
    end
  end
end
