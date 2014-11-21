(function() {
  'use strict';

  /****************************************************************************
   *
   * atob and btoa
   *
   */

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    var str = String(input);
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next str index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      str.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = str.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });


  /****************************************************************************
   *
   * ieee754
   *
   */

  function ieee754() {}

  ieee754.prototype.read = function(buffer, offset, isLE, mLen, nBytes) {

    var e;
    var m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity);
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }

    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);

  };

  ieee754.prototype.write = function(buffer, value, offset, isLE, mLen, nBytes) {

    var e;
    var m;
    var c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

    buffer[offset + i - d] |= s * 128;

  };


  /****************************************************************************
   *
   * Protobuf
   *
   * Depends on `ieee754`
   *
   */

  var ieee754 = new ieee754();

  function Protobuf(buf) {

    this.buf = buf;
    this.pos = 0;

  }

  Protobuf.prototype = {

    get length() {
      return this.buf.length;
    }

  };

  Protobuf.Varint = 0;
  Protobuf.Int64 = 1;
  Protobuf.Message = 2;
  Protobuf.String = 2;
  Protobuf.Packed = 2;
  Protobuf.Int32 = 5;

  Protobuf.prototype.destroy = function() {

    this.buf = null;

  };

  // === READING =================================================================

  Protobuf.prototype.readUInt32 = function() {

    var val = this.buf.readUInt32LE(this.pos);

    this.pos += 4;

    return val;

  };

  Protobuf.prototype.readUInt64 = function() {

    var val = this.buf.readUInt64LE(this.pos);

    this.pos += 8;

    return val;

  };

  Protobuf.prototype.readDouble = function() {

    var val = ieee754.read(this.buf, this.pos, true, 52, 8);

    this.pos += 8;

    return val;

  };

  Protobuf.prototype.readVarint = function() {

    // TODO: bounds checking

    var pos = this.pos;

    if (this.buf[pos] <= 0x7f) {
      this.pos++;
      return this.buf[pos];
    } else if (this.buf[pos + 1] <= 0x7f) {
      this.pos += 2;
      return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] << 7);
    } else if (this.buf[pos + 2] <= 0x7f) {
      this.pos += 3;
      return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2]) << 14;
    } else if (this.buf[pos + 3] <= 0x7f) {
      this.pos += 4;
      return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2] & 0x7f) << 14 | (this.buf[pos + 3]) << 21;
    } else if (this.buf[pos + 4] <= 0x7f) {
      this.pos += 5;
      return ((this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2] & 0x7f) << 14 | (this.buf[pos + 3]) << 21) + (this.buf[pos + 4] * 268435456);
    } else {
      this.skip(Protobuf.Varint);
      return 0;
      // throw new Error("TODO: Handle 6+ byte varints");
    }

  };

  Protobuf.prototype.readSVarint = function() {

    var num = this.readVarint();

    if (num > 2147483647) {
      throw new Error('TODO: Handle numbers >= 2^30');
    }

    // zigzag encoding
    return ((num >> 1) ^ -(num & 1));

  };

  Protobuf.prototype.readString = function() {

    var bytes = this.readVarint();
    // TODO: bounds checking
    var chr = String.fromCharCode;
    var b = this.buf;
    var p = this.pos;
    var end = this.pos + bytes;
    var str = '';

    while (p < end) {

      if (b[p] <= 0x7F) {
        str += chr(b[p++]);
      } else if (b[p] <= 0xBF) {
        throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
      } else if (b[p] <= 0xDF) {
        str += chr((b[p++] & 0x1F) << 6 | (b[p++] & 0x3F));
      } else if (b[p] <= 0xEF) {
        str += chr((b[p++] & 0x1F) << 12 | (b[p++] & 0x3F) << 6 | (b[p++] & 0x3F));
      } else if (b[p] <= 0xF7) {
        p += 4; // We can't handle these codepoints in JS, so skip.
      } else if (b[p] <= 0xFB) {
        p += 5;
      } else if (b[p] <= 0xFD) {
        p += 6;
      } else {
        throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
      }

    }

    this.pos += bytes;

    return str;

  };

  Protobuf.prototype.readBuffer = function() {

    var bytes = this.readVarint();
    var buffer = this.buf.subarray(this.pos, this.pos + bytes);

    this.pos += bytes;

    return buffer;

  };

  Protobuf.prototype.readPacked = function(type) {

    // TODO: bounds checking

    var bytes = this.readVarint();
    var end = this.pos + bytes;
    var array = [];

    while (this.pos < end) {
      array.push(this['read' + type]());
    }

    return array;

  };

  Protobuf.prototype.skip = function(val) {

    // TODO: bounds checking

    var type = val & 0x7;

    switch (type) {
      /* varint */ 
      case Protobuf.Varint:
        while (this.buf[this.pos++] > 0x7f);
        break;
      /* 64 bit */
      case Protobuf.Int64:
        this.pos += 8;
        break;
      /* length */
      case Protobuf.Message:
        var bytes = this.readVarint();
        this.pos += bytes;
        break;
      /* 32 bit */
      case Protobuf.Int32:
        this.pos += 4;
        break;
      default:
        throw new Error('Unimplemented type: ' + type);
    }

  };

  // === WRITING =================================================================

  Protobuf.prototype.writeTag = function(tag, type) {

    this.writeVarint((tag << 3) | type);

  };

  Protobuf.prototype.realloc = function(min) {

    var length = this.buf.length;

    while (length < this.pos + min) {
      length *= 2;
    }

    if (length != this.buf.length) {

      var buf = new Buffer(length);

      this.buf.copy(buf);
      this.buf = buf;

    }

  };

  Protobuf.prototype.finish = function() {
    return this.buf.slice(0, this.pos);
  };

  Protobuf.prototype.writePacked = function(type, tag, items) {

    if (!items.length) {
      return;
    }

    var message = new Protobuf();

    for (var i = 0; i < items.length; i++) {
      message['write' + type](items[i]);
    }

    var data = message.finish();

    this.writeTag(tag, Protobuf.Packed);
    this.writeBuffer(data);

  };

  Protobuf.prototype.writeUInt32 = function(val) {

    this.realloc(4);
    this.buf.writeUInt32LE(val, this.pos);
    this.pos += 4;

  };

  Protobuf.prototype.writeTaggedUInt32 = function(tag, val) {

    this.writeTag(tag, Protobuf.Int32);
    this.writeUInt32(val);

  };

  Protobuf.prototype.writeVarint = function(val) {

    val = Number(val);

    if (isNaN(val)) {
      val = 0;
    }

    if (val <= 0x7f) {
      this.realloc(1);
      this.buf[this.pos++] = val;
    } else if (val <= 0x3fff) {
      this.realloc(2);
      this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
      this.buf[this.pos++] = 0x00 | ((val >>> 7) & 0x7f);
    } else if (val <= 0x1ffffff) {
      this.realloc(3);
      this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
      this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
      this.buf[this.pos++] = 0x00 | ((val >>> 14) & 0x7f);
    } else if (val <= 0xfffffff) {
      this.realloc(4);
      this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
      this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
      this.buf[this.pos++] = 0x80 | ((val >>> 14) & 0x7f);
      this.buf[this.pos++] = 0x00 | ((val >>> 21) & 0x7f);
    } else {
      while (val > 0) {
        var b = val & 0x7f;
        val = Math.floor(val / 128);
        if (val > 0) {
          b |= 0x80;
        }
        this.realloc(1);
        this.buf[this.pos++] = b;
      }
    }

  };

  Protobuf.prototype.writeTaggedVarint = function(tag, val) {

    this.writeTag(tag, Protobuf.Varint);
    this.writeVarint(val);

  };

  Protobuf.prototype.writeSVarint = function(val) {

    if (val >= 0) {
      this.writeVarint(val * 2);
    } else {
      this.writeVarint(val * -2 - 1);
    }

  };

  Protobuf.prototype.writeTaggedSVarint = function(tag, val) {

    this.writeTag(tag, Protobuf.Varint);
    this.writeSVarint(val);

  };

  Protobuf.prototype.writeBoolean = function(val) {

    this.writeVarint(Boolean(val));

  };

  Protobuf.prototype.writeTaggedBoolean = function(tag, val) {

    this.writeTaggedVarint(tag, Boolean(val));

  };

  Protobuf.prototype.writeString = function(str) {

    str = String(str);

    var bytes = Buffer.byteLength(str);

    this.writeVarint(bytes);
    this.realloc(bytes);
    this.buf.write(str, this.pos);
    this.pos += bytes;

  };

  Protobuf.prototype.writeTaggedString = function(tag, str) {

    this.writeTag(tag, Protobuf.String);
    this.writeString(str);

  };

  Protobuf.prototype.writeFloat = function(val) {

    this.realloc(4);
    this.buf.writeFloatLE(val, this.pos);
    this.pos += 4;

  };

  Protobuf.prototype.writeTaggedFloat = function(tag, val) {

    this.writeTag(tag, Protobuf.Int32);
    this.writeFloat(val);

  };

  Protobuf.prototype.writeDouble = function(val) {

    this.realloc(8);
    this.buf.writeDoubleLE(val, this.pos);
    this.pos += 8;

  };

  Protobuf.prototype.writeTaggedDouble = function(tag, val) {

    this.writeTag(tag, Protobuf.Int64);
    this.writeDouble(val);

  };

  Protobuf.prototype.writeBuffer = function(buffer) {

    var bytes = buffer.length;

    this.writeVarint(bytes);
    this.realloc(bytes);
    buffer.copy(this.buf, this.pos);
    this.pos += bytes;

  };

  Protobuf.prototype.writeTaggedBuffer = function(tag, buffer) {

    this.writeTag(tag, Protobuf.String);
    this.writeBuffer(buffer);

  };

  Protobuf.prototype.writeMessage = function(tag, protobuf) {

    var buffer = protobuf.finish();

    this.writeTag(tag, Protobuf.Message);
    this.writeBuffer(buffer);

  };


 /****************************************************************************
   *
   * Point
   *
   */

  function Point(x, y) {

    this.x = x;
    this.y = y;

  }

  Point.prototype = {

    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
      return this.x === p.x && this.y === p.y;
    },

    dist: function(p) {
      return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
      var dx = p.x - this.x,
          dy = p.y - this.y;
      return dx * dx + dy * dy;
    },

    angle: function() {
      return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
      return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
      return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
      return Math.atan2(
        this.x * y - this.y * x,
        this.x * x + this.y * y
      );
    },

    _matMult: function(m) {
      var x = m[0] * this.x + m[1] * this.y;
      var y = m[2] * this.x + m[3] * this.y;
      this.x = x;
      this.y = y;
      return this;
    },

    _add: function(p) {
      this.x += p.x;
      this.y += p.y;
      return this;
    },

    _sub: function(p) {
      this.x -= p.x;
      this.y -= p.y;
      return this;
    },

    _mult: function(k) {
      this.x *= k;
      this.y *= k;
      return this;
    },

    _div: function(k) {
      this.x /= k;
      this.y /= k;
      return this;
    },

    _unit: function() {
      this._div(this.mag());
      return this;
    },

    _perp: function() {
      var y = this.y;
      this.y = this.x;
      this.x = -y;
      return this;
    },

    _rotate: function(angle) {
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var x = cos * this.x - sin * this.y;
      var y = sin * this.x + cos * this.y;
      this.x = x;
      this.y = y;
      return this;
    },

    _round: function() {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      return this;
    }
  };

  // constructs Point from an array if necessary
  Point.convert = function (a) {
    if (a instanceof Point) {
      return a;
    }
    if (Array.isArray(a)) {
      return new Point(a[0], a[1]);
    }
    return a;
  };


  /****************************************************************************
   *
   * VectorTileFeature
   *
   * Depends on `Point`
   *
   */

  function VectorTileFeature(buffer, end, extent, keys, values) {

    this.properties = {};

    // Public
    this.extent = extent;
    this.type = 0;

    // Private
    this._buffer = buffer;
    this._geometry = -1;

    end = end || buffer.length;

    while (buffer.pos < end) {

      var val = buffer.readVarint();
      var tag = val >> 3;

      if (tag == 1) {
        this._id = buffer.readVarint();
      } else if (tag == 2) {

        var tagEnd = buffer.pos + buffer.readVarint();

        while (buffer.pos < tagEnd) {
          var key = keys[buffer.readVarint()];
          var value = values[buffer.readVarint()];
          this.properties[key] = value;
        }

      } else if (tag == 3) {
        this.type = buffer.readVarint();
      } else if (tag == 4) {
        this._geometry = buffer.pos;
        buffer.skip(val);
      } else {
        buffer.skip(val);
      }
    }
  }

  VectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon'];

  VectorTileFeature.prototype.loadGeometry = function() {

    var buffer = this._buffer;
    buffer.pos = this._geometry;

    var bytes = buffer.readVarint();
    var end = buffer.pos + bytes;
    var cmd = 1;
    var length = 0;
    var x = 0;
    var y = 0;
    var lines = [];
    var line;

    while (buffer.pos < end) {

      if (!length) {

        var cmd_length = buffer.readVarint();
        cmd = cmd_length & 0x7;
        length = cmd_length >> 3;

      }

      length--;

      if (cmd === 1 || cmd === 2) {

        x += buffer.readSVarint();
        y += buffer.readSVarint();

        if (cmd === 1) {
          // moveTo
          if (line) {
            lines.push(line);
          }
          line = [];
        }

        line.push(new Point(x, y));
      } else if (cmd === 7) {
        // closePolygon
        line.push(line[0].clone());
      } else {
        throw new Error('unknown command ' + cmd);
      }

    }

    if (line) {
      lines.push(line);
    }

    return lines;
  };

  VectorTileFeature.prototype.bbox = function() {

    var buffer = this._buffer;
    buffer.pos = this._geometry;

    var bytes = buffer.readVarint();
    var end = buffer.pos + bytes;

    var cmd = 1;
    var length = 0;
    var x = 0;
    var y = 0;
    var x1 = Infinity;
    var x2 = -Infinity;
    var y1 = Infinity;
    var y2 = -Infinity;

    while (buffer.pos < end) {

      if (!length) {
        var cmd_length = buffer.readVarint();
        cmd = cmd_length & 0x7;
        length = cmd_length >> 3;
      }

      length--;

      if (cmd === 1 || cmd === 2) {

        x += buffer.readSVarint();
        y += buffer.readSVarint();

        if (x < x1) {
          x1 = x;
        }

        if (x > x2) {
          x2 = x;
        }

        if (y < y1) {
          y1 = y;
        }

        if (y > y2) {
          y2 = y;
        }

      } else if (cmd !== 7) {
        throw new Error('unknown command ' + cmd);
      }

    }

    return [x1, y1, x2, y2];
  };


  /****************************************************************************
   *
   * VectorTileLayer
   *
   * Depends on `VectorTileFeature`
   *
   */

  function VectorTileLayer(buffer, end) {

    this.version = 1;
    this.name = null;
    this.extent = 4096;
    this.length = 0;
    this._buffer = buffer;
    this._keys = [];
    this._values = [];
    this._features = [];

    var val;
    var tag;

    end = end || buffer.length;

    while (buffer.pos < end) {

      val = buffer.readVarint();
      tag = val >> 3;

      if (tag === 15) {
        this.version = buffer.readVarint();
      } else if (tag === 1) {
        this.name = buffer.readString();
      } else if (tag === 5) {
        this.extent = buffer.readVarint();
      } else if (tag === 2) {
        this.length++;
        this._features.push(buffer.pos);
        buffer.skip(val);
      } else if (tag === 3) {
        this._keys.push(buffer.readString());
      } else if (tag === 4) {
        this._values.push(this.readFeatureValue());
      } else {
        buffer.skip(val);
      }

    }

  }

  VectorTileLayer.prototype.readFeatureValue = function() {

    var buffer = this._buffer;
    var value = null;
    var bytes = buffer.readVarint();
    var end = buffer.pos + bytes;
    var val;
    var tag;

    while (buffer.pos < end) {

      val = buffer.readVarint();
      tag = val >> 3;

      if (tag == 1) {
        value = buffer.readString();
      } else if (tag == 2) {
        throw new Error('read float');
      } else if (tag == 3) {
        value = buffer.readDouble();
      } else if (tag == 4) {
        value = buffer.readVarint();
      } else if (tag == 5) {
        throw new Error('read uint');
      } else if (tag == 6) {
        value = buffer.readSVarint();
      } else if (tag == 7) {
        value = Boolean(buffer.readVarint());
      } else {
        buffer.skip(val);
      }

    }

    return value;

  };

  // return feature `i` from this layer as a `VectorTileFeature`
  VectorTileLayer.prototype.feature = function(i) {

    var end;

    if (i < 0 || i >= this._features.length) {
      throw new Error('feature index out of bounds');
    }

    this._buffer.pos = this._features[i];
    end = this._buffer.readVarint() + this._buffer.pos;

    return new VectorTileFeature(this._buffer, end, this.extent, this._keys, this._values);

  };


  /****************************************************************************
   *
   * VectorTile
   *
   * Depends on `VectorTileLayer`
   *
   */

  function VectorTile(buffer, end) {

    var val;
    var tag;
    var layer;

    this.layers = {};
    this._buffer = buffer;

    end = end || buffer.length;

    while (buffer.pos < end) {

      val = buffer.readVarint();
      tag = val >> 3;

      if (tag == 3) {

        layer = this.readLayer();

        if (layer.length) {
          this.layers[layer.name] = layer;
        }

      } else {
        buffer.skip(val);
      }

    }

  }

  VectorTile.prototype.readLayer = function() {

    var buffer = this._buffer;
    var bytes = buffer.readVarint();
    var end = buffer.pos + bytes;
    var layer = new VectorTileLayer(buffer, end);

    buffer.pos = end;

    return layer;

  };


  /****************************************************************************
   *
   * Feature
   *
   * Created by Nicholas Hallahan <nhallahan@spatialdev.com> on 7/11/14.
   *
   */

  function Feature(label, pbfFeature, options) {

    this.dynamicLabel = label;
    this.mvtFeature = pbfFeature;
    this.mvtLayer = pbfFeature.mvtLayer;
    this.mvtSource = pbfFeature.mvtLayer.mvtSource;
    this.map = label.map;
    this.activeTiles = label.activeTiles;
    this.marker = null;

    this.tilePoints = {};
    this.tileLines = {};
    this.tilePolys = {};

    // default options
    this.options = {};

    // apply options
    for (var key in options) {
      this.options[key] = options[key];
    }

    // override the style function if specified
    if (pbfFeature.style.dynamicLabel) {
      this._styleFn = pbfFeature.style.dynamicLabel;
    }

    this.style = this._styleFn();

    this.icon = L.divIcon({
      className: this.style.cssClass || 'dynamicLabel-icon-text',
      html: this.style.html || 'No Label',
      iconSize: this.style.iconSize || [50,50]
    });

  }

  Feature.prototype.addTilePolys = function(ctx, polys) {

    this.tilePolys[ctx.id] = polys;

  };

  function positionMarker(feature, pt) {

    var map = feature.map;
    var latLng = map.unproject(pt);

    if (!feature.marker) {
      feature.marker = L.marker(latLng, {icon: feature.icon});
      feature.marker.addTo(map);
    } else {
      feature.marker.setLatLng(latLng);
    }
  //  L.marker(latLng).addTo(map);
  }

  /**
   * This is the default style function. This is overridden
   * if there is a style.dynamicLabel function in MVTFeature.
   */
  Feature.prototype._styleFn = function() {

  };

  /**
   * Converts projected GeoJSON back into WGS84 GeoJSON.
   * @param geojson
   * @returns {*}
   */
  function unprojectGeoJson(map, geojson) {

    var wgs84Coordinates = [];
    var wgs84GeoJson = {
      type: 'MultiPolygon',
      coordinates: wgs84Coordinates
    };
    var coords = geojson.coordinates;

    for (var i = 0, len = coords.length; i < len; i++) {
      var innerCoords = coords[i];
      wgs84Coordinates[i] = [];
      for (var j = 0, len2 = innerCoords.length; j < len2; j++) {
        var innerCoords2 = innerCoords[j];
        wgs84Coordinates[i][j] = [];
        for (var k = 0, len3 = innerCoords2.length; k < len3; k++) {
          var coord = innerCoords2[k];
          var latlng = map.unproject(L.point(coord));
          wgs84Coordinates[i][j][k] = [latlng.lng, latlng.lat];
        }
      }
    }
    return wgs84GeoJson;
  }


  /****************************************************************************
   *
   * MVTUtil
   *
   * Created by Nicholas Hallahan <nhallahan@spatialdev.com> on 8/15/14.
   *
   */

  function MVTUtil() { }

  MVTUtil.getContextID = function(ctx) {
    return [ctx.zoom, ctx.tile.x, ctx.tile.y].join(":");
  };

  /**
   * Default function that gets the id for a layer feature.
   * Sometimes this needs to be done in a different way and
   * can be specified by the user in the options for L.TileLayer.MVTSource.
   *
   * @param feature
   * @returns {ctx.id|*|id|string|jsts.index.chain.MonotoneChain.id|number}
   */
  MVTUtil.getIDForLayerFeature = function(feature) {
    return feature.properties.id;
  };

  MVTUtil.getJSON = function(url, callback) {
    $.ajax({
      url: url,
      success: function(data, statusText, xhr) {

        if (xhr.status >= 200 && xhr.status < 300) {

          var data;

          try {
            data = JSON.parse(body);
          } catch (error) {
            return callback(error);
          }
          callback(null, data);

        } else {
          callback(new Error(statusText));
        }

      },
      error: function(request, status, error) {
        callback(error);
      }
    });
  };


  /****************************************************************************
   *
   * MVTFeature
   *
   * Depends on `MVTUtil`
   *
   * Created by Ryan Whitley, Daniel Duarte, and Nicholas Hallahan on 6/03/14.
   *
   */

  function MVTFeature(mvtLayer, vtf, ctx, id, style) {

    if (!vtf) {
      return null;
    }

    // Apply all of the properties of vtf to this object.
    for (var key in vtf) {
      this[key] = vtf[key];
    }

    this.mvtLayer = mvtLayer;
    this.mvtSource = mvtLayer.mvtSource;
    this.map = mvtLayer.mvtSource.map;

    this.id = id;

    this.layerLink = this.mvtSource.layerLink;
    this.toggleEnabled = true;
    this.selected = false;

    // how much we divide the coordinate from the vector tile
    this.divisor = vtf.extent / ctx.tileSize;
    this.extent = vtf.extent;
    this.tileSize = ctx.tileSize;

    //An object to store the paths and contexts for this feature
    this.tiles = {};

    this.style = style;

    //Add to the collection
    this.addTileFeature(vtf, ctx);

    var self = this;
    this.map.on('zoomend', function() {
      self.staticLabel = null;
    });

    //if (typeof style.dynamicLabel === 'function') {
    //  this.dynamicLabel = this.mvtSource.dynamicLabel.createFeature(this);
    //}

    MVTajax(self);

  }

  function MVTajax(self) {

    var style = self.style;

    if (typeof style.MVTajaxSource === 'function') {
      var MVTajaxEndpoint = style.MVTajaxSource(self);
      if (MVTajaxEndpoint) {
        MVTUtil.getJSON(MVTajaxEndpoint, function(error, response, body) {
          if (error) {
            throw ['MVTajaxSource MVTajax Error', error];
          } else {
            MVTAjaxCallback(self, response);
            return true;
          }
        });
      }
    }

    return false;

  }

  function MVTAjaxCallback(self, response) {

    self.MVTAjaxData = response;

    /**
     * You can attach a callback function to a feature in your app
     * that will get called whenever new MVTAjaxData comes in. This
     * can be used to update UI that looks at data from within a feature.
     *
     * setStyle may possibly have a style with a different MVTAjaxData source,
     * and you would potentially get new contextual data for your feature.
     *
     * TODO: This needs to be documented.
     */

    if (typeof self.MVTAjaxDataReceived === 'function') {
      self.MVTAjaxDataReceived(self, response);
    }

    self._setStyle(self.mvtLayer.style);
    redrawTiles(self);

  }

  MVTFeature.prototype._setStyle = function(styleFn) {

    this.style = styleFn(this, this.MVTAjaxData);

    // The label gets removed, and the (re)draw,
    // that is initiated by the MVTLayer creates a new label.
    //this.removeLabel();

  };

  MVTFeature.prototype.setStyle = function(styleFn) {

    this.MVTAjaxData = null;
    this.style = styleFn(this, null);
    var hasMVTajaxSource = MVTajax(this);
    if (!hasMVTajaxSource) {
      // The label gets removed, and the (re)draw,
      // that is initiated by the MVTLayer creates a new label.
      //this.removeLabel();
    }

  };

  MVTFeature.prototype.draw = function(canvasID) {

    //Get the info from the tiles list
    var tileInfo =  this.tiles[canvasID];

    var vtf = tileInfo.vtf;
    var ctx = tileInfo.ctx;

    //Get the actual canvas from the parent layer's _tiles object.
    var xy = canvasID.split(":").slice(1, 3).join(":");
    ctx.canvas = this.mvtLayer._tiles[xy];

  //  This could be used to directly compute the style function from the layer on every draw.
  //  This is much less efficient...
  //  this.style = this.mvtLayer.style(this);

    if (this.selected) {
      var style = this.style.selected || this.style;
    } else {
      var style = this.style;
    }

    switch (vtf.type) {
      case 1: //Point
        this._drawPoint(ctx, vtf.coordinates, style);
        //if (!this.staticLabel && typeof this.style.staticLabel === 'function') {
        //  if (this.style.MVTajaxSource && !this.MVTAjaxData) {
        //    break;
        //  }
        //  this._drawStaticLabel(ctx, vtf.coordinates, style);
        //}
        break;

      case 2: //LineString
        this._drawLineString(ctx, vtf.coordinates, style);
        break;

      case 3: //Polygon
        this._drawPolygon(ctx, vtf.coordinates, style);
        break;

      default:
        throw new Error('Unmanaged type: ' + vtf.type);
    }

  };

  MVTFeature.prototype.getPathsForTile = function(canvasID) {

    //Get the info from the parts list
    return this.tiles[canvasID].paths;

  };

  MVTFeature.prototype.addTileFeature = function(vtf, ctx) {
    //Store the important items in the tiles list

    //We only want to store info for tiles for the current map zoom.  If it is tile info for another zoom level, ignore it
    //Also, if there are existing tiles in the list for other zoom levels, expunge them.
    var zoom = this.map.getZoom();

    if(ctx.zoom != zoom) return;

    this.clearTileFeatures(zoom); //TODO: This iterates thru all tiles every time a new tile is added.  Figure out a better way to do this.

    this.tiles[ctx.id] = {
      ctx: ctx,
      vtf: vtf,
      paths: []
    };

  };


  /**
   * Clear the inner list of tile features if they don't match the given zoom.
   *
   * @param zoom
   */
  MVTFeature.prototype.clearTileFeatures = function(zoom) {

    //If stored tiles exist for other zoom levels, expunge them from the list.
// cml PERFORMANCE IMPROVEMENT ('for x in y' cannot be optimized)
    var keys = Object.keys(this.tiles);
    var i;
    var l = keys.length;
    for (i = 0; i < l; i++) {
      if (keys[i].split(':')[0] != zoom) {
        delete this.tiles[keys[i]];
      }
    }
    //for (var key in this.tiles) {
    //   if(key.split(":")[0] != zoom) delete this.tiles[key];
    //}

  };

  /**
   * Redraws all of the tiles associated with a feature. Useful for
   * style change and toggling.
   *
   * @param self
   */
  function redrawTiles(self) {

    //Redraw the whole tile, not just this vtf
    var tiles = self.tiles;
    var mvtLayer = self.mvtLayer;

    for (var id in tiles) {
      var tileZoom = parseInt(id.split(':')[0]);
      var mapZoom = self.map.getZoom();
      if (tileZoom === mapZoom) {
        //Redraw the tile
        mvtLayer.redrawTile(id);
      }
    }

  }

  MVTFeature.prototype.toggle = function() {

    if (this.selected) {
      this.deselect();
    } else {
      this.select();
    }

  };

  MVTFeature.prototype.select = function() {

    this.selected = true;
    this.mvtSource.featureSelected(this);
    redrawTiles(this);

    var linkedFeature = this.linkedFeature();

    if (linkedFeature && linkedFeature.staticLabel && !linkedFeature.staticLabel.selected) {
      linkedFeature.staticLabel.select();
    }

  };

  MVTFeature.prototype.deselect = function() {

    this.selected = false;
    this.mvtSource.featureDeselected(this);
    redrawTiles(this);

    var linkedFeature = this.linkedFeature();

    if (linkedFeature && linkedFeature.staticLabel && linkedFeature.staticLabel.selected) {
      linkedFeature.staticLabel.deselect();
    }

  };

  MVTFeature.prototype.on = function(eventType, callback) {

    this._eventHandlers[eventType] = callback;

  };

  MVTFeature.prototype._drawPoint = function(ctx, coordsArray, style) {

    if (!style) {
      return;
    }

    var tile = this.tiles[ctx.id];

    //Get radius
    var radius = 1;
    if (typeof style.radius === 'function') {
      radius = style.radius(ctx.zoom); //Allows for scale dependent rednering
    }
    else{
      radius = style.radius;
    }

    var p = this._tilePoint(coordsArray[0][0]);
    var c = ctx.canvas;
    var ctx2d;
// cml PERFORMANCE IMPROVEMENT ('try x catch y' cannot be optimized)
    //try{
    if (typeof c === 'undefined') {
      return;
    }

      ctx2d = c.getContext('2d');
    //}
    //catch(e){
    if (ctx2d === null) {
      console.log("_drawPoint error: " + e);
      return;
    }
    //  return;
    //}

    ctx2d.beginPath();
    ctx2d.fillStyle = style.color;
    ctx2d.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx2d.closePath();
    ctx2d.fill();

    if(style.lineWidth && style.strokeStyle){
      ctx2d.lineWidth = style.lineWidth;
      ctx2d.strokeStyle = style.strokeStyle;
      ctx2d.stroke();
    }

    ctx2d.restore();
    tile.paths.push([p]);

  };

  MVTFeature.prototype._drawLineString = function(ctx, coordsArray, style) {

    if (!style) {
      return;
    }

    var ctx2d = ctx.canvas.getContext('2d');
    ctx2d.strokeStyle = style.color;
    ctx2d.lineWidth = style.size;
    ctx2d.beginPath();

    var projCoords = [];
    var tile = this.tiles[ctx.id];

    for (var gidx in coordsArray) {
      var coords = coordsArray[gidx];

      for (i = 0; i < coords.length; i++) {
        var method = (i === 0 ? 'move' : 'line') + 'To';
        var proj = this._tilePoint(coords[i]);
        projCoords.push(proj);
        ctx2d[method](proj.x, proj.y);
      }
    }

    ctx2d.stroke();
    ctx2d.restore();

    tile.paths.push(projCoords);

  };

  MVTFeature.prototype._drawPolygon = function(ctx, coordsArray, style) {

    if (!style) {
      return;
    }

    if (!ctx.canvas) {
      return;
    }

    var ctx2d = ctx.canvas.getContext('2d');
    var outline = style.outline;

    // color may be defined via function to make choropleth work right
    if (typeof style.color === 'function') {
      ctx2d.fillStyle = style.color();
    } else {
      ctx2d.fillStyle = style.color;
    }

    if (outline) {
      ctx2d.strokeStyle = outline.color;
      ctx2d.lineWidth = outline.size;
    }
    ctx2d.beginPath();

    var projCoords = [];
    var tile = this.tiles[ctx.id];

    //var featureLabel = this.dynamicLabel;
    //if (featureLabel) {
    //  featureLabel.addTilePolys(ctx, coordsArray);
    //}

    for (var gidx = 0, len = coordsArray.length; gidx < len; gidx++) {
      var coords = coordsArray[gidx];

      for (var i = 0; i < coords.length; i++) {
        var coord = coords[i];
        var method = (i === 0 ? 'move' : 'line') + 'To';
        var proj = this._tilePoint(coords[i]);
        projCoords.push(proj);
        ctx2d[method](proj.x, proj.y);
      }
    }

    ctx2d.closePath();
    ctx2d.fill();
    if (outline) {
      ctx2d.stroke();
    }

    tile.paths.push(projCoords);

  };

  MVTFeature.prototype._drawStaticLabel = function(ctx, coordsArray, style) {

    if (!style) {
      return;
    }

    // If the corresponding layer is not on the map, 
    // we dont want to put on a label.
    if (!this.mvtLayer._map) return;

    var vecPt = this._tilePoint(coordsArray[0][0]);

    // We're making a standard Leaflet Marker for this label.
    var p = this._project(vecPt, ctx.tile.x, ctx.tile.y, this.extent, this.tileSize); //vectile pt to merc pt
    var mercPt = L.point(p.x, p.y); // make into leaflet obj
    var latLng = this.map.unproject(mercPt); // merc pt to latlng

    this.staticLabel = new StaticLabel(this, ctx, latLng, style);
    this.mvtLayer.featureWithLabelAdded(this);

  };

  MVTFeature.prototype.removeLabel = function() {

    if (!this.staticLabel) {
      return;
    }

    this.staticLabel.remove();
    this.staticLabel = null;

  };

  /**
   * Projects a vector tile point to the Spherical Mercator pixel space for a given zoom level.
   *
   * @param vecPt
   * @param tileX
   * @param tileY
   * @param extent
   * @param tileSize
   */
  MVTFeature.prototype._project = function(vecPt, tileX, tileY, extent, tileSize) {

    var xOffset = tileX * tileSize;
    var yOffset = tileY * tileSize;

    return {
      x: Math.floor(vecPt.x + xOffset),
      y: Math.floor(vecPt.y + yOffset)
    };

  };

  /**
   * Takes a coordinate from a vector tile and turns it into a Leaflet Point.
   *
   * @param ctx
   * @param coords
   * @returns {eGeomType.Point}
   * @private
   */
  MVTFeature.prototype._tilePoint = function(coords) {

    return new L.Point(coords.x / this.divisor, coords.y / this.divisor);

  };

  MVTFeature.prototype.linkedFeature = function() {

    var linkedLayer = this.mvtLayer.linkedLayer();

    if(linkedLayer){
      var linkedFeature = linkedLayer.features[this.id];
      return linkedFeature;
    }else{
      return null;
    }

  };


  /****************************************************************************
   *
   * MVTLayer
   *
   * Created by Ryan Whitley on 5/17/14.
   *
   * Forked from https://gist.github.com/DGuidi/1716010
   *
   */

  var MVTLayer = L.TileLayer.Canvas.extend({

    options: {
      debug: false,
      isHiddenLayer: false,
      getIDForLayerFeature: function() {},
      tileSize: 256
    },

    _featureIsClicked: {},

    _isPointInPoly: function(pt, poly) {

      if(poly && poly.length) {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
          ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
          && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
          && (c = !c);
        return c;
      }

    },

    initialize: function(mvtSource, options) {

      var self = this;
      self.mvtSource = mvtSource;
      L.Util.setOptions(this, options);

      this.style = options.style;
      this.name = options.name;
      this._canvasIDToFeatures = {};
      this.features = {};
      this.featuresWithLabels = [];
      this._highestCount = 0;

    },

    onAdd: function(map) {

      var self = this;

      self.map = map;
      L.TileLayer.Canvas.prototype.onAdd.call(this, map);
      map.on('layerremove', function(e) {

        // we only want to do stuff when the layerremove event is on this layer
        if (e.layer._leaflet_id === self._leaflet_id) {
          removeLabels(self);
        }

      });

    },

    drawTile: function(canvas, tilePoint, zoom) {

      var ctx = {
        canvas: canvas,
        tile: tilePoint,
        zoom: zoom,
        tileSize: this.options.tileSize
      };

      ctx.id = MVTUtil.getContextID(ctx);

      if (!this._canvasIDToFeatures[ctx.id]) {
        this._initializeFeaturesHash(ctx);
      }

      if (!this.features) {
        this.features = {};
      }

    },

    _initializeFeaturesHash: function(ctx){

      this._canvasIDToFeatures[ctx.id] = {};
      this._canvasIDToFeatures[ctx.id].features = [];
      this._canvasIDToFeatures[ctx.id].canvas = ctx.canvas;

    },

    _draw: function(ctx) {
      //Draw is handled by the parent MVTSource object
    },

    getCanvas: function(parentCtx){
      //This gets called if a vector tile feature has already been parsed.
      //We've already got the geom, just get on with the drawing.
      //Need a way to pluck a canvas element from this layer given the parent layer's id.
      //Wait for it to get loaded before proceeding.
      var tilePoint = parentCtx.tile;
      var ctx = this._tiles[tilePoint.x + ":" + tilePoint.y];

      if(ctx){
        parentCtx.canvas = ctx;
        this.redrawTile(parentCtx.id);
        return;
      }

      var self = this;

      //This is a timer that will wait for a criterion to return true.
      //If not true within the timeout duration, it will move on.
      waitFor(function () {
          ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
          if(ctx) {
            return true;
          }
        },
        function(){
          //When it finishes, do this.
          ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
          parentCtx.canvas = ctx;
          self.redrawTile(parentCtx.id);

        }, //when done, go to next flow
        2000); //The Timeout milliseconds.  After this, give up and move on

    },

    parseVectorTileLayer: function(vtl, ctx) {

      var self = this;
      var tilePoint = ctx.tile;
      var layerCtx  = { canvas: ctx.canvas, id: ctx.id, tile: ctx.tile, zoom: ctx.zoom, tileSize: ctx.tileSize};

      //See if we can pluck the child tile from this PBF tile layer based on the master layer's tile id.
      layerCtx.canvas = self._tiles[tilePoint.x + ":" + tilePoint.y];

      //Initialize this tile's feature storage hash, if it hasn't already been created.  Used for when filters are updated, and features are cleared to prepare for a fresh redraw.
      if (!this._canvasIDToFeatures[layerCtx.id]) {
        this._initializeFeaturesHash(layerCtx);
      }else{
        //Clear this tile's previously saved features.
        this.clearTileFeatureHash(layerCtx.id);
      }

      var features = vtl.parsedFeatures;

      for (var i = 0, len = features.length; i < len; i++) {

        var vtf = features[i]; //vector tile feature
        vtf.layer = vtl;

        /**
         * Apply filter on feature if there is one. Defined in the options object
         * of TileLayer.MVTSource.js
         */
        var filter = self.options.filter;

        if (typeof filter === 'function') {
          if ( filter(vtf, layerCtx) === false ) {
            continue;
          }
        }

        var getIDForLayerFeature;

        if (typeof self.options.getIDForLayerFeature === 'function') {
          getIDForLayerFeature = self.options.getIDForLayerFeature;
        } else {
          getIDForLayerFeature = MVTUtil.getIDForLayerFeature;
        }

        var uniqueID = self.options.getIDForLayerFeature(vtf, i) || i;
        var mvtFeature = self.features[uniqueID];

        /**
         * Use layerOrdering function to apply a zIndex property to each vtf.  This is defined in
         * TileLayer.MVTSource.js.  Used below to sort features.npm
         */
        var layerOrdering = self.options.layerOrdering;

        if (typeof layerOrdering === 'function') {
          layerOrdering(vtf, layerCtx); //Applies a custom property to the feature, which is used after we're thru iterating to sort
        }

        //Create a new MVTFeature if one doesn't already exist for this feature.
        if (!mvtFeature) {

          //Get a style for the feature - set it just once for each new MVTFeature
          var style = self.style(vtf);

          //create a new feature
          self.features[uniqueID] = mvtFeature = new MVTFeature(self, vtf, layerCtx, uniqueID, style);

          if (typeof style.dynamicLabel === 'function') {
            self.featuresWithLabels.push(mvtFeature);
          }

        } else {
          //Add the new part to the existing feature
          mvtFeature.addTileFeature(vtf, layerCtx);
        }

        //Associate & Save this feature with this tile for later
        if(layerCtx && layerCtx.id) self._canvasIDToFeatures[layerCtx.id]['features'].push(mvtFeature);

      }

      /**
       * Apply sorting (zIndex) on feature if there is a function defined in the options object
       * of TileLayer.MVTSource.js
       */
      var layerOrdering = self.options.layerOrdering;

      if (layerOrdering) {
        //We've assigned the custom zIndex property when iterating above.  Now just sort.
        self._canvasIDToFeatures[layerCtx.id].features = self._canvasIDToFeatures[layerCtx.id].features.sort(function(a, b) {
          return -(b.properties.zIndex - a.properties.zIndex)
        });
      }

      self.redrawTile(layerCtx.id);

    },

    setStyle: function(styleFn) {

      // refresh the number for the highest count value
      // this is used only for choropleth
      this._highestCount = 0;

      this.style = styleFn;

      for (var key in this.features) {
        var feat = this.features[key];
        feat.setStyle(styleFn);
      }

      var z = this.map.getZoom();

      for (var key in this._tiles) {
        var id = z + ':' + key;
        this.redrawTile(id);
      }

    },

    /**
     * As counts for choropleths come in with the ajax data,
     * we want to keep track of which value is the highest
     * to create the color ramp for the fills of polygons.
     * @param count
     */
    setHighestCount: function(count) {

      if (count > this._highestCount) {
        this._highestCount = count;
      }

    },

    /**
     * Returns the highest number of all of the counts that have come in
     * from setHighestCount. This is assumed to be set via ajax callbacks.
     * @returns {number}
     */
    getHighestCount: function() {

      return this._highestCount;

    },

    //This is the old way.  It works, but is slow for mouseover events.  Fine for click events.
    handleClickEvent: function(evt, cb) {

      //Click happened on the GroupLayer (Manager) and passed it here
      var tileID = evt.tileID.split(":").slice(1, 3).join(":");
      var canvas = this._tiles[tileID];
      if(!canvas) (cb(evt)); //break out
      var x = evt.layerPoint.x - canvas._leaflet_pos.x;
      var y = evt.layerPoint.y - canvas._leaflet_pos.y;

      var tilePoint = {x: x, y: y};
      var features = this._canvasIDToFeatures[evt.tileID].features;
      for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var paths = feature.getPathsForTile(evt.tileID);
        for (var j = 0; j < paths.length; j++) {
          if (this._isPointInPoly(tilePoint, paths[j])) {
            if (feature.toggleEnabled) {
              feature.toggle();
            }
            evt.feature = feature;
            cb(evt);
            return;
          }
        }
      }
      //no match
      //return evt with empty feature
      evt.feature = null;
      cb(evt);

    },

    clearTile: function(id) {

      //id is the entire zoom:x:y.  we just want x:y.
      var ca = id.split(":");
      var canvasId = ca[1] + ":" + ca[2];

      if (typeof this._tiles[canvasId] === 'undefined') {
        console.error("typeof this._tiles[canvasId] === 'undefined'");
        return;
      }
      var canvas = this._tiles[canvasId];

      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

    },

    clearTileFeatureHash: function(canvasID){

      this._canvasIDToFeatures[canvasID] = { features: []}; //Get rid of all saved features

    },

    clearLayerFeatureHash: function(){

      this.features = {};

    },

    redrawTile: function(canvasID) {

      //First, clear the canvas
      if (this._tiles.hasOwnProperty(canvasID)) {
        this.clearTile(canvasID);
      }

      // If the features are not in the tile, then there is nothing to redraw.
      // This may happen if you call redraw before features have loaded and initially
      // drawn the tile.
      var featfeats = this._canvasIDToFeatures[canvasID];
      if (!featfeats) {
        return;
      }

      //Get the features for this tile, and redraw them.
      var features = featfeats.features;

      // we want to skip drawing the selected features and draw them last
      var selectedFeatures = [];

      // drawing all of the non-selected features
      for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        if (feature.selected) {
          selectedFeatures.push(feature);
        } else {
          feature.draw(canvasID);
        }
      }

      // drawing the selected features last
      for (var j = 0, len2 = selectedFeatures.length; j < len2; j++) {
        var selFeat = selectedFeatures[j];
        selFeat.draw(canvasID);
      }

    },

    _resetCanvasIDToFeatures: function(canvasID, canvas) {

      this._canvasIDToFeatures[canvasID] = {};
      this._canvasIDToFeatures[canvasID].features = [];
      this._canvasIDToFeatures[canvasID].canvas = canvas;

    },

    linkedLayer: function() {

      if(this.mvtSource.layerLink) {
        var linkName = this.mvtSource.layerLink(this.name);
        return this.mvtSource.layers[linkName];
      }
      else{
        return null;
      }

    },

    featureWithLabelAdded: function(feature) {
      this.featuresWithLabels.push(feature);
    }

  });


  function removeLabels(self) {

    var features = self.featuresWithLabels;

    for (var i = 0, len = features.length; i < len; i++) {
      var feat = features[i];
      feat.removeLabel();
    }

    self.featuresWithLabels = [];

  }


  /**
   * See https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js
   *
   * Wait until the test condition is true or a timeout occurs. Useful for waiting
   * on a server response or for a ui change (fadeIn, etc.) to occur.
   *
   * @param testFx javascript condition that evaluates to a boolean,
   * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
   * as a callback function.
   * @param onReady what to do when testFx condition is fulfilled,
   * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
   * as a callback function.
   * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
   */
  function waitFor(testFx, onReady, timeOutMillis) {

    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000; //< Default Max Timout is 3s
    var start = new Date().getTime();
    var condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
    var interval = setInterval(function () {
        if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
          // If not time-out yet and condition not yet fulfilled
          condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
        } else {
          if (!condition) {
            // If condition still not fulfilled (timeout but condition is 'false')
            console.log("'waitFor()' timeout");
            clearInterval(interval); //< Stop this interval
            typeof (onReady) === "string" ? eval(onReady) : onReady('timeout'); //< Do what it's supposed to do once the condition is fulfilled
          } else {
            // Condition fulfilled (timeout and/or condition is 'true')
            console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
            clearInterval(interval); //< Stop this interval
            typeof (onReady) === "string" ? eval(onReady) : onReady('success'); //< Do what it's supposed to do once the condition is fulfilled
          }
        }
      }, 50); //< repeat check every 50ms
  };


  /****************************************************************************
   *
   * MVTSource
   *
   * Created by Nicholas Hallahan <nhallahan@spatialdev.com> on 8/15/14.
   *
   */

  L.TileLayer.MVTSource = L.TileLayer.Canvas.extend({

    options: {
      debug: false,
      url: "", //URL TO Vector Tile Source,
      headers: {},
      getIDForLayerFeature: function() {},
      tileSize: 256,
      visibleLayers: []
    },
    layers: {}, //Keep a list of the layers contained in the PBFs
    processedTiles: {}, //Keep a list of tiles that have been processed already
    _eventHandlers: {},

    useBase64Fallback: function() {
      return true;
    },

    style: function(feature) {
      var style = {};

      var type = feature.type;
      switch (type) {
        case 1: //'Point'
          style.color = 'rgba(49,79,79,1)';
          style.radius = 5;
          style.selected = {
            color: 'rgba(255,255,0,0.5)',
            radius: 6
          };
          break;
        case 2: //'LineString'
          style.color = 'rgba(161,217,155,0.8)';
          style.size = 3;
          style.selected = {
            color: 'rgba(255,25,0,0.5)',
            size: 4
          };
          break;
        case 3: //'Polygon'
          style.color = 'rgba(49,79,79,1)';
          style.outline = {
            color: 'rgba(161,217,155,0.8)',
            size: 1
          };
          style.selected = {
            color: 'rgba(255,140,0,0.3)',
            outline: {
              color: 'rgba(255,140,0,1)',
              size: 2
            }
          };
          break;
      }
      return style;
    },


    initialize: function(options) {
      L.Util.setOptions(this, options);

      //a list of the layers contained in the PBFs
      this.layers = {};

      // tiles currently in the viewport
      this.activeTiles = {};

      // thats that have been loaded and drawn
      this.loadedTiles = {};

      if (typeof options.style === 'function') {
        this.style = options.style;
      }

      if (typeof options.ajaxSource === 'function') {
        this.ajaxSource = options.ajaxSource;
      }

      this.layerLink = options.layerLink;

      this._eventHandlers = {};

      this._tilesToProcess = 0; //store the max number of tiles to be loaded.  Later, we can use this count to count down PBF loading.
    },

    onAdd: function(map) {
      var self = this;
      self.map = map;
      L.TileLayer.Canvas.prototype.onAdd.call(this, map);

      var mapOnClickCallback = function(e) {
        self._onClick(e);
      };

      map.on('click', mapOnClickCallback);

      map.on("layerremove", function(e) {
        // check to see if the layer removed is this one
        // call a method to remove the child layers (the ones that actually have something drawn on them).
        if (e.layer._leaflet_id === self._leaflet_id && e.layer.removeChildLayers) {
          e.layer.removeChildLayers(map);
          map.off('click', mapOnClickCallback);
        }
      });

      self.addChildLayers(map);

      //if (typeof DynamicLabel === 'function' ) {
      //  this.dynamicLabel = new DynamicLabel(map, this, {});
      //}

    },

    drawTile: function(canvas, tilePoint, zoom) {
      var ctx = {
        id: [zoom, tilePoint.x, tilePoint.y].join(":"),
        canvas: canvas,
        tile: tilePoint,
        zoom: zoom,
        tileSize: this.options.tileSize
      };

      //Capture the max number of the tiles to load here. this._tilesToProcess is an internal number we use to know when we've finished requesting PBFs.
      if(this._tilesToProcess < this._tilesToLoad) this._tilesToProcess = this._tilesToLoad;

      var id = ctx.id = MVTUtil.getContextID(ctx);
      this.activeTiles[id] = ctx;

      if(!this.processedTiles[ctx.zoom]) this.processedTiles[ctx.zoom] = {};

      if (this.options.debug) {
        this._drawDebugInfo(ctx);
      }
      this._draw(ctx);
    },

    setOpacity:function(opacity) {
      this._setVisibleLayersStyle('opacity',opacity);
    },

    setZIndex:function(zIndex) {
      this._setVisibleLayersStyle('zIndex',zIndex);
    },

    _setVisibleLayersStyle:function(style, value) {
      for(var key in this.layers) {
        this.layers[key]._tileContainer.style[style] = value;
      }
    },

    _drawDebugInfo: function(ctx) {
      var max = this.options.tileSize;
      var g = ctx.canvas.getContext('2d');
      g.strokeStyle = '#000000';
      g.fillStyle = '#FFFF00';
      g.strokeRect(0, 0, max, max);
      g.font = "12px Arial";
      g.fillRect(0, 0, 5, 5);
      g.fillRect(0, max - 5, 5, 5);
      g.fillRect(max - 5, 0, 5, 5);
      g.fillRect(max - 5, max - 5, 5, 5);
      g.fillRect(max / 2 - 5, max / 2 - 5, 10, 10);
      g.strokeText(ctx.zoom + ' ' + ctx.tile.x + ' ' + ctx.tile.y, max / 2 - 30, max / 2 - 10);
    },

    _emitTileLoadingEvent: function() {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('protobuffer-tile-loading', true, true);
      evt.tilesToProcess = this._tilesToProcess;
      this.map._container.dispatchEvent(evt);
    },

    _emitTileLoadedEvent: function() {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('protobuffer-tile-loaded', true, true);
      evt.tilesToProcess = this._tilesToProcess;
      this.map._container.dispatchEvent(evt);
    },

    _draw: function(ctx) {
      var self = this;
      var url = self.options.url;

  //    //This works to skip fetching and processing tiles if they've already been processed.
  //    var vectorTile = this.processedTiles[ctx.zoom][ctx.id];
  //    //if we've already parsed it, don't get it again.
  //    if(vectorTile){
  //      console.log("Skipping fetching " + ctx.id);
  //      self.checkVectorTileLayers(parseVT(vectorTile), ctx, true);
  //      self.reduceTilesToProcessCount();
  //      return;
  //    }

      if (!this.options.url) return;

      if (self.useBase64Fallback()) {
        url = url.replace('{y}.pbf', '{y}.bpbf');
      }

      url = url.replace("{z}", ctx.zoom).replace("{x}", ctx.tile.x).replace("{y}", ctx.tile.y);

      var xhr = new XMLHttpRequest();

      xhr.onload = function() {

        var response;
        var byteLength;
        var arrayBuffer;
        var i;

        if (xhr.status == "200") {

          if (typeof xhr.response === 'undefined' && xhr.responseText) {
            response = xhr.responseText;
          } else if (!xhr.response) {
            return;
          } else {
            response = xhr.response;
          }

          if (self.useBase64Fallback()) {
            response = atob(response);
            byteLength = response.length;
            arrayBuffer = new Uint8Array(byteLength);
            for (i = 0; i < byteLength; i++) {
              arrayBuffer[i] = response.charCodeAt(i);
            }
          } else {
            arrayBuffer = new Uint8Array(xhr.response);
          }

          var buf = new Protobuf(arrayBuffer);
          var vt = new VectorTile(buf);
          //Check the current map layer zoom.  If fast zooming is occurring, then short circuit tiles that are for a different zoom level than we're currently on.
          if(self.map && self.map.getZoom() != ctx.zoom) {
            console.log("Fetched tile for zoom level " + ctx.zoom + ". Map is at zoom level " + self._map.getZoom());
            return;
          }
          self.checkVectorTileLayers(parseVT(vt), ctx);

          self._emitTileLoadedEvent();

          tileLoaded(self, ctx);
        }
      };

      xhr.onerror = function() {
        console.log("xhr error: " + xhr.status)
      };

      self._emitTileLoadingEvent();

      xhr.open('GET', url, true); //async is true

// cml Allow custom headers
      var headerKeys = Object.keys(self.options.headers);
      var i;
      for (i = 0; i < headerKeys.length; i++) {
        xhr.setRequestHeader(headerKeys[i], self.options.headers[headerKeys[i]])
      }
// end Allow Custom Headers

      if (self.useBase64Fallback()) {
//        xhr.setRequestHeader('Content-Transfer-Encoding', 'base64');
        //xhr.responseType = 'application/octet-stream';
      } else {
        xhr.responseType = 'arraybuffer';
      }

      xhr.send();

      //either way, reduce the count of tilesToProcess tiles here
      self.reduceTilesToProcessCount();
    },

    reduceTilesToProcessCount: function(){
      this._tilesToProcess--;
      if(!this._tilesToProcess){
        //Trigger event letting us know that all PBFs have been loaded and processed (or 404'd).
        if(this._eventHandlers["PBFLoad"]) this._eventHandlers["PBFLoad"]();
        this._pbfLoaded();
      }
    },

    checkVectorTileLayers: function(vt, ctx, parsed) {
      var self = this;

      //Check if there are specified visible layers
      if(self.options.visibleLayers && self.options.visibleLayers.length > 0){
        //only let thru the layers listed in the visibleLayers array
        for(var i=0; i < self.options.visibleLayers.length; i++){
          var layerName = self.options.visibleLayers[i];
          if(vt.layers[layerName]){
             //Proceed with parsing
            self.prepareMVTLayers(vt.layers[layerName], layerName, ctx, parsed);
          }
        }
      }else{
        //Parse all vt.layers
        for (var key in vt.layers) {
          self.prepareMVTLayers(vt.layers[key], key, ctx, parsed);
        }
      }
    },

    prepareMVTLayers: function(lyr ,key, ctx, parsed) {
      var self = this;

      if (!self.layers[key]) {
        //Create MVTLayer or MVTPointLayer for user
        self.layers[key] = self.createMVTLayer(key, lyr.parsedFeatures[0].type || null);
      }

      if (parsed) {
        //We've already parsed it.  Go get canvas and draw.
        self.layers[key].getCanvas(ctx, lyr);
      } else {
        self.layers[key].parseVectorTileLayer(lyr, ctx);
      }

    },

    createMVTLayer: function(key, type) {
      var self = this;

      var getIDForLayerFeature;
      if (typeof self.options.getIDForLayerFeature === 'function') {
        getIDForLayerFeature = self.options.getIDForLayerFeature;
      } else {
        getIDForLayerFeature = MVTUtil.getIDForLayerFeature;
      }

      //Take the layer and create a new MVTLayer or MVTPointLayer if one doesn't exist.
      var layer = new MVTLayer(self, {
          getIDForLayerFeature: getIDForLayerFeature,
          filter: self.options.filter,
          layerOrdering: self.options.layerOrdering,
          style: self.style,
          name: key,
          asynch: true
        }).addTo(self.map);

      return layer;
    },

    getLayers: function() {
      return this.layers;
    },

    hideLayer: function(id) {
      if (this.layers[id]) {
        this._map.removeLayer(this.layers[id]);
        if(this.options.visibleLayers.indexOf("id") > -1){
          this.visibleLayers.splice(this.options.visibleLayers.indexOf("id"), 1);
        }
      }
    },

    showLayer: function(id) {
      if (this.layers[id]) {
        this._map.addLayer(this.layers[id]);
        if(this.options.visibleLayers.indexOf("id") == -1){
          this.visibleLayers.push(id);
        }
      }
      //Make sure manager layer is always in front
      this.bringToFront();
    },

    removeChildLayers: function(map){
      //Remove child layers of this group layer
      for (var key in this.layers) {
        var layer = this.layers[key];
        map.removeLayer(layer);
      }
    },

    addChildLayers: function(map) {
      var self = this;
      if(self.options.visibleLayers.length > 0){
        //only let thru the layers listed in the visibleLayers array
        for(var i=0; i < self.options.visibleLayers.length; i++){
          var layerName = self.options.visibleLayers[i];
          var layer = this.layers[layerName];
          if(layer){
            //Proceed with parsing
            map.addLayer(layer);
          }
        }
      }else{
        //Add all layers
        for (var key in this.layers) {
          var layer = this.layers[key];
          // layer is set to visible and is not already on map
          if (!layer._map) {
            map.addLayer(layer);
          }
        }
      }
    },

    bind: function(eventType, callback) {
      this._eventHandlers[eventType] = callback;
    },

    _onClick: function(evt) {
      //Here, pass the event on to the child MVTLayer and have it do the hit test and handle the result.
      var self = this;
      var onClick = self.options.onClick;
      var clickableLayers = self.options.clickableLayers;
      var layers = self.layers;

      evt.tileID =  getTileURL(evt.latlng.lat, evt.latlng.lng, this.map.getZoom());

      // We must have an array of clickable layers, otherwise, we just pass
      // the event to the public onClick callback in options.
      if (clickableLayers && clickableLayers.length > 0) {
        for (var i = 0, len = clickableLayers.length; i < len; i++) {
          var key = clickableLayers[i];
          var layer = layers[key];
          if (layer) {
            layer.handleClickEvent(evt, function(evt) {
              if (typeof onClick === 'function') {
                onClick(evt);
              }
            });
          }
        }
      } else {
        if (typeof onClick === 'function') {
          onClick(evt);
        }
      }

    },

    setFilter: function(filterFunction, layerName) {
      //take in a new filter function.
      //Propagate to child layers.

      //Add filter to all child layers if no layer is specified.
      for (var key in this.layers) {
        var layer = this.layers[key];

        if (layerName){
          if(key.toLowerCase() == layerName.toLowerCase()){
            layer.options.filter = filterFunction; //Assign filter to child layer, only if name matches
            //After filter is set, the old feature hashes are invalid.  Clear them for next draw.
            layer.clearLayerFeatureHash();
            //layer.clearTileFeatureHash();
          }
        }
        else{
          layer.options.filter = filterFunction; //Assign filter to child layer
          //After filter is set, the old feature hashes are invalid.  Clear them for next draw.
          layer.clearLayerFeatureHash();
          //layer.clearTileFeatureHash();
        }
      }
    },

    /**
     * Take in a new style function and propogate to child layers.
     * If you do not set a layer name, it resets the style for all of the layers.
     * @param styleFunction
     * @param layerName
     */
    setStyle: function(styleFn, layerName) {
      for (var key in this.layers) {
        var layer = this.layers[key];
        if (layerName) {
          if(key.toLowerCase() == layerName.toLowerCase()) {
            layer.setStyle(styleFn);
          }
        } else {
          layer.setStyle(styleFn);
        }
      }
    },

    featureSelected: function(mvtFeature) {
      if (this.options.mutexToggle) {
        if (this._selectedFeature) {
          this._selectedFeature.deselect();
        }
        this._selectedFeature = mvtFeature;
      }
      if (this.options.onSelect) {
        this.options.onSelect(mvtFeature);
      }
    },

    featureDeselected: function(mvtFeature) {
      if (this.options.mutexToggle && this._selectedFeature) {
        this._selectedFeature = null;
      }
      if (this.options.onDeselect) {
        this.options.onDeselect(mvtFeature);
      }
    }
  ,

    _pbfLoaded: function(){
      //Fires when all tiles from this layer have been loaded and drawn (or 404'd).

      //Make sure manager layer is always in front
      this.bringToFront();
    }

  });


  if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    }
  }

  function getTileURL(lat, lon, zoom) {
    var xtile = parseInt(Math.floor( (lon + 180) / 360 * (1<<zoom) ));
    var ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * (1<<zoom) ));
    return "" + zoom + ":" + xtile + ":" + ytile;
  }

  function tileLoaded(pbfSource, ctx) {
    pbfSource.loadedTiles[ctx.id] = ctx;
  }

  function parseVT(vt){
    for (var key in vt.layers) {
      var lyr = vt.layers[key];
      parseVTFeatures(lyr);
    }
    return vt;
  }

  function parseVTFeatures(vtl){
    vtl.parsedFeatures = [];
    var features = vtl._features;
    for (var i = 0, len = features.length; i < len; i++) {
      var vtf = vtl.feature(i);
      vtf.coordinates = vtf.loadGeometry();
      vtl.parsedFeatures.push(vtf);
    }
    return vtl;
  }

})();
