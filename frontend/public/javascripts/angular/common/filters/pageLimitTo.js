module.exports = function() {
  return function(data, pagenumber, maxresult) {
    var start = pagenumber * 10;
    var end = start + maxresult;
    if (end > data.length) {
      end = data.length;
    }
    return data.slice(start, end);
  };
};
