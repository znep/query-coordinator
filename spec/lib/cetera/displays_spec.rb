require 'rails_helper'

describe Cetera::Displays do
  include TestHelperMethods

  it 'should handle a dataset' do
    dataset = Cetera::Displays::Dataset
    expect(dataset.name).to eq('table')
    expect(dataset.title).to eq('Table')
    expect(dataset.type).to eq('blist')
  end

  it 'should handle a file' do
    file = Cetera::Displays::File
    expect(file.name).to eq('non-tabular file or document')
    expect(file.type).to eq('blob')
  end

  it 'should handle a link' do
    link = Cetera::Displays::Link
    expect(link.name).to eq('external dataset')
    expect(link.type).to eq('href')
  end

  it 'should handle a map' do
    map = Cetera::Displays::Map
    expect(map.name).to eq('map')
    expect(map.type).to eq('map')
  end
end
