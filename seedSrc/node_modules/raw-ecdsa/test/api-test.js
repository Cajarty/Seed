var assert = require('assert');
var crypto = require('crypto');
var ecdsa = require('../');
var fs = require('fs');
var key = fs.readFileSync(__dirname + '/keys/key.pem');
var pubkey = fs.readFileSync(__dirname + '/keys/pub.pem');

describe('raw-ecdsa', function() {
  var priv = new ecdsa.Key(key);

  it('should sign/verify data', function() {
    var hash = crypto.createHash('sha1').update('hello world').digest();
    var s = priv.sign(hash);
    assert(priv.verify(s, hash), 'verify');
  });

  it('should sign/verify data 2', function () {
    var hash2 = crypto.createHash('sha1').update('hello world2').digest();
    var s2 = priv.sign(hash2);
    assert(priv.verify(s2, hash2), 'verify 2');
  });

  it('should not sign/verify bad data', function () {
    var hash = crypto.createHash('sha1').update('hello world2').digest();
    var hash2 = crypto.createHash('sha224').update('hello world2').digest();
    var s = priv.sign(hash);
    assert(!priv.verify(s, hash2), 'verify');
  });
});

describe('public key', function() {
  it('should sign/verify data', function() {
    var priv = new ecdsa.Key(key);
    var pub = new ecdsa.Key(pubkey);
    var hash = crypto.createHash('sha1').update('hello world').digest();
    var s = priv.sign(hash);
    assert(pub.verify(s, hash), 'verify');
  });
});

describe('raw-ecdsa', function() {
  it('should sign/verify data', function() {
    var priv = new ecdsa.Key(key);

    var hash = crypto.createHash('sha256').update('hello world').digest();
    var hashDigest = hash.toString('hex');
    var s = priv.sign(hash);
    assert(hash.toString('hex') === hashDigest);
    assert(priv.verify(s, hash));

    var hash2 = crypto.createHash('sha256').update('hello world2').digest();
    assert(!priv.verify(s, hash2));
  });
});
