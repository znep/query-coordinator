(function(root) {

  'use strict';

  /**
   * The following is a concatenation of several ProtocolBuffer packages
   * (specifically, the `pbf` npm package and its dependencies).
   */

  !function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof root?f=root:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.pbf=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  (function (Buffer){
  'use strict';

  var ieee754 = require('ieee754');

  module.exports = Protobuf;
  function Protobuf(buf) {
      this.buf = buf;
      this.pos = 0;
  }

  Protobuf.prototype = {
      get length() { return this.buf.length; }
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
      if (num > 2147483647) throw new Error('TODO: Handle numbers >= 2^30');
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
          if (b[p] <= 0x7F) str += chr(b[p++]);
          else if (b[p] <= 0xBF) throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
          else if (b[p] <= 0xDF) str += chr((b[p++] & 0x1F) << 6 | (b[p++] & 0x3F));
          else if (b[p] <= 0xEF) str += chr((b[p++] & 0x1F) << 12 | (b[p++] & 0x3F) << 6 | (b[p++] & 0x3F));
          else if (b[p] <= 0xF7) p += 4; // We can't handle these codepoints in JS, so skip.
          else if (b[p] <= 0xFB) p += 5;
          else if (b[p] <= 0xFD) p += 6;
          else throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
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
          /* varint */ case Protobuf.Varint: while (this.buf[this.pos++] > 0x7f); break;
          /* 64 bit */ case Protobuf.Int64: this.pos += 8; break;
          /* length */ case Protobuf.Message: var bytes = this.readVarint(); this.pos += bytes; break;
          /* 32 bit */ case Protobuf.Int32: this.pos += 4; break;
          default: throw new Error('Unimplemented type: ' + type);
      }
  };

  // === WRITING =================================================================

  Protobuf.prototype.writeTag = function(tag, type) {
      this.writeVarint((tag << 3) | type);
  };

  Protobuf.prototype.realloc = function(min) {
      var length = this.buf.length;
      while (length < this.pos + min) length *= 2;
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
      if (!items.length) return;

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
              if (val > 0) b |= 0x80
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

  }).call(this,require("buffer").Buffer)
  },{"buffer":3,"ieee754":2}],2:[function(require,module,exports){
  exports.read = function(buffer, offset, isLE, mLen, nBytes) {
    var e, m,
        eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        nBits = -7,
        i = isLE ? (nBytes - 1) : 0,
        d = isLE ? -1 : 1,
        s = buffer[offset + i];

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

  exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c,
        eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
        i = isLE ? 0 : (nBytes - 1),
        d = isLE ? 1 : -1,
        s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

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

  },{}],3:[function(require,module,exports){
  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */

  var base64 = require('base64-js')
  var ieee754 = require('ieee754')
  var isArray = require('is-array')

  exports.Buffer = Buffer
  exports.SlowBuffer = Buffer
  exports.INSPECT_MAX_BYTES = 50
  Buffer.poolSize = 8192 // not used by this implementation

  var kMaxLength = 0x3fffffff

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Note:
   *
   * - Implementation must support adding new properties to `Uint8Array` instances.
   *   Firefox 4-29 lacked support, fixed in Firefox 30+.
   *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *    incorrect length in some situations.
   *
   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
   * get the Object implementation, which is slower but will work correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = (function () {
    try {
      var buf = new ArrayBuffer(0)
      var arr = new Uint8Array(buf)
      arr.foo = function () { return 42 }
      return 42 === arr.foo() && // typed array instances can be augmented
          typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
          new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
    } catch (e) {
      return false
    }
  })()

  /**
   * Class: Buffer
   * =============
   *
   * The Buffer constructor returns instances of `Uint8Array` that are augmented
   * with function properties for all the node `Buffer` API functions. We use
   * `Uint8Array` so that square bracket notation works as expected -- it returns
   * a single octet.
   *
   * By augmenting the instances, we can avoid modifying the `Uint8Array`
   * prototype.
   */
  function Buffer (subject, encoding, noZero) {
    if (!(this instanceof Buffer))
      return new Buffer(subject, encoding, noZero)

    var type = typeof subject

    // Find the length
    var length
    if (type === 'number')
      length = subject > 0 ? subject >>> 0 : 0
    else if (type === 'string') {
      if (encoding === 'base64')
        subject = base64clean(subject)
      length = Buffer.byteLength(subject, encoding)
    } else if (type === 'object' && subject !== null) { // assume object is array-like
      if (subject.type === 'Buffer' && isArray(subject.data))
        subject = subject.data
      length = +subject.length > 0 ? Math.floor(+subject.length) : 0
    } else
      throw new TypeError('must start with number, buffer, array or string')

    if (this.length > kMaxLength)
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
        'size: 0x' + kMaxLength.toString(16) + ' bytes')

    var buf
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Preferred: Return an augmented `Uint8Array` instance for best performance
      buf = Buffer._augment(new Uint8Array(length))
    } else {
      // Fallback: Return THIS instance of Buffer (created by `new`)
      buf = this
      buf.length = length
      buf._isBuffer = true
    }

    var i
    if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
      // Speed optimization -- use set if we're copying from a typed array
      buf._set(subject)
    } else if (isArrayish(subject)) {
      // Treat array-ish objects as a byte array
      if (Buffer.isBuffer(subject)) {
        for (i = 0; i < length; i++)
          buf[i] = subject.readUInt8(i)
      } else {
        for (i = 0; i < length; i++)
          buf[i] = ((subject[i] % 256) + 256) % 256
      }
    } else if (type === 'string') {
      buf.write(subject, 0, encoding)
    } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
      for (i = 0; i < length; i++) {
        buf[i] = 0
      }
    }

    return buf
  }

  Buffer.isBuffer = function (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer.compare = function (a, b) {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
      throw new TypeError('Arguments must be Buffers')

    var x = a.length
    var y = b.length
    for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
    if (i !== len) {
      x = a[i]
      y = b[i]
    }
    if (x < y) return -1
    if (y < x) return 1
    return 0
  }

  Buffer.isEncoding = function (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'binary':
      case 'base64':
      case 'raw':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  }

  Buffer.concat = function (list, totalLength) {
    if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

    if (list.length === 0) {
      return new Buffer(0)
    } else if (list.length === 1) {
      return list[0]
    }

    var i
    if (totalLength === undefined) {
      totalLength = 0
      for (i = 0; i < list.length; i++) {
        totalLength += list[i].length
      }
    }

    var buf = new Buffer(totalLength)
    var pos = 0
    for (i = 0; i < list.length; i++) {
      var item = list[i]
      item.copy(buf, pos)
      pos += item.length
    }
    return buf
  }

  Buffer.byteLength = function (str, encoding) {
    var ret
    str = str + ''
    switch (encoding || 'utf8') {
      case 'ascii':
      case 'binary':
      case 'raw':
        ret = str.length
        break
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        ret = str.length * 2
        break
      case 'hex':
        ret = str.length >>> 1
        break
      case 'utf8':
      case 'utf-8':
        ret = utf8ToBytes(str).length
        break
      case 'base64':
        ret = base64ToBytes(str).length
        break
      default:
        ret = str.length
    }
    return ret
  }

  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined

  // toString(encoding, start=0, end=buffer.length)
  Buffer.prototype.toString = function (encoding, start, end) {
    var loweredCase = false

    start = start >>> 0
    end = end === undefined || end === Infinity ? this.length : end >>> 0

    if (!encoding) encoding = 'utf8'
    if (start < 0) start = 0
    if (end > this.length) end = this.length
    if (end <= start) return ''

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'binary':
          return binarySlice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase)
            throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase()
          loweredCase = true
      }
    }
  }

  Buffer.prototype.equals = function (b) {
    if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
    return Buffer.compare(this, b) === 0
  }

  Buffer.prototype.inspect = function () {
    var str = ''
    var max = exports.INSPECT_MAX_BYTES
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
      if (this.length > max)
        str += ' ... '
    }
    return '<Buffer ' + str + '>'
  }

  Buffer.prototype.compare = function (b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
    return Buffer.compare(this, b)
  }

  // `get` will be removed in Node 0.13+
  Buffer.prototype.get = function (offset) {
    console.log('.get() is deprecated. Access using array indexes instead.')
    return this.readUInt8(offset)
  }

  // `set` will be removed in Node 0.13+
  Buffer.prototype.set = function (v, offset) {
    console.log('.set() is deprecated. Access using array indexes instead.')
    return this.writeUInt8(v, offset)
  }

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0
    var remaining = buf.length - offset
    if (!length) {
      length = remaining
    } else {
      length = Number(length)
      if (length > remaining) {
        length = remaining
      }
    }

    // must be an even number of digits
    var strLen = string.length
    if (strLen % 2 !== 0) throw new Error('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2
    }
    for (var i = 0; i < length; i++) {
      var byte = parseInt(string.substr(i * 2, 2), 16)
      if (isNaN(byte)) throw new Error('Invalid hex string')
      buf[offset + i] = byte
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
    return charsWritten
  }

  function asciiWrite (buf, string, offset, length) {
    var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
    return charsWritten
  }

  function binaryWrite (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
    return charsWritten
  }

  function utf16leWrite (buf, string, offset, length) {
    var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
    return charsWritten
  }

  Buffer.prototype.write = function (string, offset, length, encoding) {
    // Support both (string, offset, length, encoding)
    // and the legacy (string, encoding, offset, length)
    if (isFinite(offset)) {
      if (!isFinite(length)) {
        encoding = length
        length = undefined
      }
    } else {  // legacy
      var swap = encoding
      encoding = offset
      offset = length
      length = swap
    }

    offset = Number(offset) || 0
    var remaining = this.length - offset
    if (!length) {
      length = remaining
    } else {
      length = Number(length)
      if (length > remaining) {
        length = remaining
      }
    }
    encoding = String(encoding || 'utf8').toLowerCase()

    var ret
    switch (encoding) {
      case 'hex':
        ret = hexWrite(this, string, offset, length)
        break
      case 'utf8':
      case 'utf-8':
        ret = utf8Write(this, string, offset, length)
        break
      case 'ascii':
        ret = asciiWrite(this, string, offset, length)
        break
      case 'binary':
        ret = binaryWrite(this, string, offset, length)
        break
      case 'base64':
        ret = base64Write(this, string, offset, length)
        break
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        ret = utf16leWrite(this, string, offset, length)
        break
      default:
        throw new TypeError('Unknown encoding: ' + encoding)
    }
    return ret
  }

  Buffer.prototype.toJSON = function () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  }

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf)
    } else {
      return base64.fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    var res = ''
    var tmp = ''
    end = Math.min(buf.length, end)

    for (var i = start; i < end; i++) {
      if (buf[i] <= 0x7F) {
        res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
        tmp = ''
      } else {
        tmp += '%' + buf[i].toString(16)
      }
    }

    return res + decodeUtf8Char(tmp)
  }

  function asciiSlice (buf, start, end) {
    var ret = ''
    end = Math.min(buf.length, end)

    for (var i = start; i < end; i++) {
      ret += String.fromCharCode(buf[i])
    }
    return ret
  }

  function binarySlice (buf, start, end) {
    return asciiSlice(buf, start, end)
  }

  function hexSlice (buf, start, end) {
    var len = buf.length

    if (!start || start < 0) start = 0
    if (!end || end < 0 || end > len) end = len

    var out = ''
    for (var i = start; i < end; i++) {
      out += toHex(buf[i])
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end)
    var res = ''
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
    }
    return res
  }

  Buffer.prototype.slice = function (start, end) {
    var len = this.length
    start = ~~start
    end = end === undefined ? len : ~~end

    if (start < 0) {
      start += len;
      if (start < 0)
        start = 0
    } else if (start > len) {
      start = len
    }

    if (end < 0) {
      end += len
      if (end < 0)
        end = 0
    } else if (end > len) {
      end = len
    }

    if (end < start)
      end = start

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return Buffer._augment(this.subarray(start, end))
    } else {
      var sliceLen = end - start
      var newBuf = new Buffer(sliceLen, undefined, true)
      for (var i = 0; i < sliceLen; i++) {
        newBuf[i] = this[i + start]
      }
      return newBuf
    }
  }

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0)
      throw new RangeError('offset is not uint')
    if (offset + ext > length)
      throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUInt8 = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 1, this.length)
    return this[offset]
  }

  Buffer.prototype.readUInt16LE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length)
    return this[offset] | (this[offset + 1] << 8)
  }

  Buffer.prototype.readUInt16BE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length)
    return (this[offset] << 8) | this[offset + 1]
  }

  Buffer.prototype.readUInt32LE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  }

  Buffer.prototype.readUInt32BE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)

    return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
  }

  Buffer.prototype.readInt8 = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 1, this.length)
    if (!(this[offset] & 0x80))
      return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  }

  Buffer.prototype.readInt16LE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length)
    var val = this[offset] | (this[offset + 1] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt16BE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length)
    var val = this[offset + 1] | (this[offset] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt32LE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)

    return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
  }

  Buffer.prototype.readInt32BE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)

    return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
  }

  Buffer.prototype.readFloatLE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, true, 23, 4)
  }

  Buffer.prototype.readFloatBE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, false, 23, 4)
  }

  Buffer.prototype.readDoubleLE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, true, 52, 8)
  }

  Buffer.prototype.readDoubleBE = function (offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, false, 52, 8)
  }

  function checkInt (buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
    if (value > max || value < min) throw new TypeError('value is out of bounds')
    if (offset + ext > buf.length) throw new TypeError('index out of range')
  }

  Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 1, 0xff, 0)
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
    this[offset] = value
    return offset + 1
  }

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8
    }
  }

  Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 2, 0xffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value
      this[offset + 1] = (value >>> 8)
    } else objectWriteUInt16(this, value, offset, true)
    return offset + 2
  }

  Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 2, 0xffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8)
      this[offset + 1] = value
    } else objectWriteUInt16(this, value, offset, false)
    return offset + 2
  }

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
    }
  }

  Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 4, 0xffffffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24)
      this[offset + 2] = (value >>> 16)
      this[offset + 1] = (value >>> 8)
      this[offset] = value
    } else objectWriteUInt32(this, value, offset, true)
    return offset + 4
  }

  Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 4, 0xffffffff, 0)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = value
    } else objectWriteUInt32(this, value, offset, false)
    return offset + 4
  }

  Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 1, 0x7f, -0x80)
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
    if (value < 0) value = 0xff + value + 1
    this[offset] = value
    return offset + 1
  }

  Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value
      this[offset + 1] = (value >>> 8)
    } else objectWriteUInt16(this, value, offset, true)
    return offset + 2
  }

  Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8)
      this[offset + 1] = value
    } else objectWriteUInt16(this, value, offset, false)
    return offset + 2
  }

  Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value
      this[offset + 1] = (value >>> 8)
      this[offset + 2] = (value >>> 16)
      this[offset + 3] = (value >>> 24)
    } else objectWriteUInt32(this, value, offset, true)
    return offset + 4
  }

  Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert)
      checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    if (value < 0) value = 0xffffffff + value + 1
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24)
      this[offset + 1] = (value >>> 16)
      this[offset + 2] = (value >>> 8)
      this[offset + 3] = value
    } else objectWriteUInt32(this, value, offset, false)
    return offset + 4
  }

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (value > max || value < min) throw new TypeError('value is out of bounds')
    if (offset + ext > buf.length) throw new TypeError('index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert)
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
    ieee754.write(buf, value, offset, littleEndian, 23, 4)
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  }

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert)
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
    ieee754.write(buf, value, offset, littleEndian, 52, 8)
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  }

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function (target, target_start, start, end) {
    var source = this

    if (!start) start = 0
    if (!end && end !== 0) end = this.length
    if (!target_start) target_start = 0

    // Copy 0 bytes; we're done
    if (end === start) return
    if (target.length === 0 || source.length === 0) return

    // Fatal error conditions
    if (end < start) throw new TypeError('sourceEnd < sourceStart')
    if (target_start < 0 || target_start >= target.length)
      throw new TypeError('targetStart out of bounds')
    if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
    if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length)
      end = this.length
    if (target.length - target_start < end - start)
      end = target.length - target_start + start

    var len = end - start

    if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < len; i++) {
        target[i + target_start] = this[i + start]
      }
    } else {
      target._set(this.subarray(start, start + len), target_start)
    }
  }

  // fill(value, start=0, end=buffer.length)
  Buffer.prototype.fill = function (value, start, end) {
    if (!value) value = 0
    if (!start) start = 0
    if (!end) end = this.length

    if (end < start) throw new TypeError('end < start')

    // Fill 0 bytes; we're done
    if (end === start) return
    if (this.length === 0) return

    if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
    if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

    var i
    if (typeof value === 'number') {
      for (i = start; i < end; i++) {
        this[i] = value
      }
    } else {
      var bytes = utf8ToBytes(value.toString())
      var len = bytes.length
      for (i = start; i < end; i++) {
        this[i] = bytes[i % len]
      }
    }

    return this
  }

  /**
   * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
   * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
   */
  Buffer.prototype.toArrayBuffer = function () {
    if (typeof Uint8Array !== 'undefined') {
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        return (new Buffer(this)).buffer
      } else {
        var buf = new Uint8Array(this.length)
        for (var i = 0, len = buf.length; i < len; i += 1) {
          buf[i] = this[i]
        }
        return buf.buffer
      }
    } else {
      throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
    }
  }

  // HELPER FUNCTIONS
  // ================

  var BP = Buffer.prototype

  /**
   * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
   */
  Buffer._augment = function (arr) {
    arr.constructor = Buffer
    arr._isBuffer = true

    // save reference to original Uint8Array get/set methods before overwriting
    arr._get = arr.get
    arr._set = arr.set

    // deprecated, will be removed in node 0.13+
    arr.get = BP.get
    arr.set = BP.set

    arr.write = BP.write
    arr.toString = BP.toString
    arr.toLocaleString = BP.toString
    arr.toJSON = BP.toJSON
    arr.equals = BP.equals
    arr.compare = BP.compare
    arr.copy = BP.copy
    arr.slice = BP.slice
    arr.readUInt8 = BP.readUInt8
    arr.readUInt16LE = BP.readUInt16LE
    arr.readUInt16BE = BP.readUInt16BE
    arr.readUInt32LE = BP.readUInt32LE
    arr.readUInt32BE = BP.readUInt32BE
    arr.readInt8 = BP.readInt8
    arr.readInt16LE = BP.readInt16LE
    arr.readInt16BE = BP.readInt16BE
    arr.readInt32LE = BP.readInt32LE
    arr.readInt32BE = BP.readInt32BE
    arr.readFloatLE = BP.readFloatLE
    arr.readFloatBE = BP.readFloatBE
    arr.readDoubleLE = BP.readDoubleLE
    arr.readDoubleBE = BP.readDoubleBE
    arr.writeUInt8 = BP.writeUInt8
    arr.writeUInt16LE = BP.writeUInt16LE
    arr.writeUInt16BE = BP.writeUInt16BE
    arr.writeUInt32LE = BP.writeUInt32LE
    arr.writeUInt32BE = BP.writeUInt32BE
    arr.writeInt8 = BP.writeInt8
    arr.writeInt16LE = BP.writeInt16LE
    arr.writeInt16BE = BP.writeInt16BE
    arr.writeInt32LE = BP.writeInt32LE
    arr.writeInt32BE = BP.writeInt32BE
    arr.writeFloatLE = BP.writeFloatLE
    arr.writeFloatBE = BP.writeFloatBE
    arr.writeDoubleLE = BP.writeDoubleLE
    arr.writeDoubleBE = BP.writeDoubleBE
    arr.fill = BP.fill
    arr.inspect = BP.inspect
    arr.toArrayBuffer = BP.toArrayBuffer

    return arr
  }

  var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '')
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '='
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function isArrayish (subject) {
    return isArray(subject) || Buffer.isBuffer(subject) ||
        subject && typeof subject === 'object' &&
        typeof subject.length === 'number'
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (str) {
    var byteArray = []
    for (var i = 0; i < str.length; i++) {
      var b = str.charCodeAt(i)
      if (b <= 0x7F) {
        byteArray.push(b)
      } else {
        var start = i
        if (b >= 0xD800 && b <= 0xDFFF) i++
        var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
        for (var j = 0; j < h.length; j++) {
          byteArray.push(parseInt(h[j], 16))
        }
      }
    }
    return byteArray
  }

  function asciiToBytes (str) {
    var byteArray = []
    for (var i = 0; i < str.length; i++) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF)
    }
    return byteArray
  }

  function utf16leToBytes (str) {
    var c, hi, lo
    var byteArray = []
    for (var i = 0; i < str.length; i++) {
      c = str.charCodeAt(i)
      hi = c >> 8
      lo = c % 256
      byteArray.push(lo)
      byteArray.push(hi)
    }

    return byteArray
  }

  function base64ToBytes (str) {
    return base64.toByteArray(str)
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; i++) {
      if ((i + offset >= dst.length) || (i >= src.length))
        break
      dst[i + offset] = src[i]
    }
    return i
  }

  function decodeUtf8Char (str) {
    try {
      return decodeURIComponent(str)
    } catch (err) {
      return String.fromCharCode(0xFFFD) // UTF 8 invalid char
    }
  }

  },{"base64-js":4,"ieee754":5,"is-array":6}],4:[function(require,module,exports){
  var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  ;(function (exports) {
    'use strict';

    var Arr = (typeof Uint8Array !== 'undefined')
      ? Uint8Array
      : Array

    var PLUS   = '+'.charCodeAt(0)
    var SLASH  = '/'.charCodeAt(0)
    var NUMBER = '0'.charCodeAt(0)
    var LOWER  = 'a'.charCodeAt(0)
    var UPPER  = 'A'.charCodeAt(0)

    function decode (elt) {
      var code = elt.charCodeAt(0)
      if (code === PLUS)
        return 62 // '+'
      if (code === SLASH)
        return 63 // '/'
      if (code < NUMBER)
        return -1 //no match
      if (code < NUMBER + 10)
        return code - NUMBER + 26 + 26
      if (code < UPPER + 26)
        return code - UPPER
      if (code < LOWER + 26)
        return code - LOWER + 26
    }

    function b64ToByteArray (b64) {
      var i, j, l, tmp, placeHolders, arr

      if (b64.length % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice
      var len = b64.length
      placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

      // base64 is 4/3 + up to two characters of the original data
      arr = new Arr(b64.length * 3 / 4 - placeHolders)

      // if there are placeholders, only get up to the last complete 4 chars
      l = placeHolders > 0 ? b64.length - 4 : b64.length

      var L = 0

      function push (v) {
        arr[L++] = v
      }

      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
        push((tmp & 0xFF0000) >> 16)
        push((tmp & 0xFF00) >> 8)
        push(tmp & 0xFF)
      }

      if (placeHolders === 2) {
        tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
        push(tmp & 0xFF)
      } else if (placeHolders === 1) {
        tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
        push((tmp >> 8) & 0xFF)
        push(tmp & 0xFF)
      }

      return arr
    }

    function uint8ToBase64 (uint8) {
      var i,
        extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
        output = "",
        temp, length

      function encode (num) {
        return lookup.charAt(num)
      }

      function tripletToBase64 (num) {
        return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
      }

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
        temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
        output += tripletToBase64(temp)
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      switch (extraBytes) {
        case 1:
          temp = uint8[uint8.length - 1]
          output += encode(temp >> 2)
          output += encode((temp << 4) & 0x3F)
          output += '=='
          break
        case 2:
          temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
          output += encode(temp >> 10)
          output += encode((temp >> 4) & 0x3F)
          output += encode((temp << 2) & 0x3F)
          output += '='
          break
      }

      return output
    }

    exports.toByteArray = b64ToByteArray
    exports.fromByteArray = uint8ToBase64
  }(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

  },{}],5:[function(require,module,exports){
  module.exports=require(2)
  },{"/home/tristan/code/2014/pbf/node_modules/ieee754/index.js":2}],6:[function(require,module,exports){

  /**
   * isArray
   */

  var isArray = Array.isArray;

  /**
   * toString
   */

  var str = Object.prototype.toString;

  /**
   * Whether or not the given `val`
   * is an array.
   *
   * example:
   *
   *        isArray([]);
   *        // > true
   *        isArray(arguments);
   *        // > false
   *        isArray('');
   *        // > false
   *
   * @param {mixed} val
   * @return {bool}
   */

  module.exports = isArray || function (val) {
    return !! val && '[object Array]' == str.call(val);
  };

  },{}]},{},[1])(1)
  });
})(window);
