import sinon from 'sinon';
const formAPI = {
  setProperty: sinon.spy(),
  setModel: sinon.spy(),
  setDirtyProperty: sinon.spy(),
  removeDirtyProperty: sinon.spy()
};

export default formAPI;
