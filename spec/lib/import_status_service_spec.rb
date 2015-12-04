describe ImportStatusService do

  before(:each) do
    allow(ImportStatusService).to receive(:hostname).and_return('localhost')
    allow(ImportStatusService).to receive(:port).and_return(8082)
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
  end

  it 'returns the JSON body when given a 200' do
    stub_request(:get, 'http://localhost:8082/activity').
         with(:headers => {'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 200, :body => '{"foo":2}', :headers => {})

    expect(ImportStatusService::get('/activity')).to eq({
      'foo' => 2
    })
  end

  it 'throws a ResourceNotFound error when given a 404' do
    stub_request(:get, 'http://localhost:8082/activity').
         with(:headers => {'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 404, :body => '', :headers => {})

    expect { ImportStatusService::get('/activity') }.to raise_exception(ImportStatusService::ResourceNotFound)
  end

  it 'throws a ServerError when given a 500' do
    stub_request(:get, 'http://localhost:8082/activity').
         with(:headers => {'X-Socrata-Host'=>'localhost'}).
         to_return(:status => 500, :body => '', :headers => {})

    expect { ImportStatusService::get('/activity') }.to raise_exception(ImportStatusService::ServerError)
  end

end