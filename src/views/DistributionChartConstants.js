module.exports = {
  colors: {
    hover: 'rgba(255, 255, 255, .75)',
    tick: {
      light: '#bbb',
      bold: '#777',
      dimmed: '#ddd'
    },
    unfiltered: {
      area: 'rgba(214, 212, 213, .5)',
      line: 'rgb(214, 212, 213)'
    },
    filtered: {
      area: 'rgba(106, 176, 204, .5)',
      line: 'rgb(106, 176, 204)'
    },
    selection: {
      unfiltered: {
        area: 'rgba(222, 187, 30, 0.2)',
        line: 'rgba(222, 187, 30, 0.4)'
      },
      filtered: {
        area: 'rgb(222, 187, 30)',
        line: 'rgb(150, 150, 5)'
      }
    },
    dragEdge: '#8a8686',
    dragHandleStroke: '#8a8686',
    dragHandleFill: '#c0bbbb'
  },
  yTickCount: 3,
  tickLength: 4,
  tickWidth: 3,
  requiredLabelWidth: 50,
  clipPathID: 'histogram-selection-clip-path'
};

