#include <string.h>

#include "node.h"
#include "nan.h"
#include "node_buffer.h"
#include "node_object_wrap.h"
#include "openssl/evp.h"
#include "openssl/ec.h"
#include "openssl/ecdsa.h"
#include "openssl/pem.h"
#include "openssl/x509.h"
#include "openssl/err.h"
#include "v8.h"

static const unsigned char PUBLIC_KEY_PFX[] =  "-----BEGIN PUBLIC KEY-----";
static const int PUBLIC_KEY_PFX_LEN = sizeof(PUBLIC_KEY_PFX) - 1;

namespace rawrsa {

using namespace node;
using namespace v8;

class Key : public Nan::ObjectWrap {
 public:
  static void Init(Handle<Object> target) {
    Local<FunctionTemplate> t = Nan::New<FunctionTemplate>(Key::New);

    t->InstanceTemplate()->SetInternalFieldCount(1);
    t->SetClassName(Nan::New<String>("Key").ToLocalChecked());

    Nan::SetPrototypeMethod(t, "sign", Key::Sign);
    Nan::SetPrototypeMethod(t, "verify", Key::Verify);

    target->Set(Nan::New<String>("Key").ToLocalChecked(), t->GetFunction());
  }

 protected:
  Key(EVP_PKEY* evp, EC_KEY* ec) : evp_(evp), ec_(ec) {
    if (evp_ != NULL) {
      assert(ec_ == NULL);
      ec_ = evp_->pkey.ec;
    }
  }

  ~Key() {
    if (evp_ != NULL)
      EVP_PKEY_free(evp_);
    else
      EC_KEY_free(ec_);
    evp_ = NULL;
    ec_ = NULL;
  }

  static NAN_METHOD(New) {
    Nan::HandleScope scope;

    if (info.Length() != 1 || !Buffer::HasInstance(info[0])) {
      return Nan::ThrowError("Invalid arguments length, expected "
                           "new Key(buffer)");
    }

    unsigned char* buf = reinterpret_cast<unsigned char*>(
        Buffer::Data(info[0]));
    int buf_len = Buffer::Length(info[0]);

    EC_KEY* ec;
    EVP_PKEY* evp = NULL;

    const unsigned char* pbuf;

    pbuf = buf;
    ec = d2i_ECPrivateKey(NULL, &pbuf, buf_len);
    if (ec != NULL)
      goto done;

    pbuf = buf;
    ec = o2i_ECPublicKey(NULL, &pbuf, buf_len);
    if (ec != NULL)
      goto done;

    {
      BIO* bio = BIO_new_mem_buf(buf, buf_len);
      if (memcmp(buf, PUBLIC_KEY_PFX, PUBLIC_KEY_PFX_LEN) == 0) {
        evp = PEM_read_bio_PUBKEY(bio, NULL, NULL, NULL);
      } else {
        evp = PEM_read_bio_PrivateKey(bio, NULL, NULL, NULL);
        if (evp == NULL)
          ec = PEM_read_bio_EC_PUBKEY(bio, NULL, NULL, NULL);
        if (evp == NULL && ec == NULL)
          ec = PEM_read_bio_ECPrivateKey(bio, NULL, NULL, NULL);
      }
      BIO_free_all(bio);
    }

 done:
    ERR_clear_error();
    if (evp == NULL && ec == NULL)
      return Nan::ThrowError("Failed to read EVP_PKEY/EC_KEY");

    Key* k = new Key(evp, ec);
    k->Wrap(info.This());

    info.GetReturnValue().Set(info.This());
  }

  static NAN_METHOD(Sign) {
    Nan::HandleScope scope;

    if (info.Length() != 1 ||
        !Buffer::HasInstance(info[0])) {
      return Nan::ThrowError("Invalid arguments length, expected (hash)");
    }

    Key* k = Nan::ObjectWrap::Unwrap<Key>(info.This());

    unsigned char* from = reinterpret_cast<unsigned char*>(
        Buffer::Data(info[0]));
    int from_len = Buffer::Length(info[0]);

    unsigned int to_len = ECDSA_size(k->ec_);
    unsigned char* to = new unsigned char[to_len];

    if (ECDSA_sign(0, from, from_len, to, &to_len, k->ec_) != 1) {
      delete[] to;
      return Nan::ThrowError("Failed to sign the data");
    }

    MaybeLocal<Object> buf = Nan::CopyBuffer(reinterpret_cast<char*>(to), to_len);
    delete[] to;

    info.GetReturnValue().Set(buf.ToLocalChecked());
  }

  static NAN_METHOD(Verify) {
    Nan::HandleScope scope;

    if (info.Length() != 2 ||
        !Buffer::HasInstance(info[0]) ||
        !Buffer::HasInstance(info[1])) {
      return Nan::ThrowError("Invalid arguments length, expected (sig, hash)");
    }

    Key* k = Nan::ObjectWrap::Unwrap<Key>(info.This());

    unsigned char* sig = reinterpret_cast<unsigned char*>(
        Buffer::Data(info[0]));
    int sig_len = Buffer::Length(info[0]);
    unsigned char* hash = reinterpret_cast<unsigned char*>(
        Buffer::Data(info[1]));
    int hash_len = Buffer::Length(info[1]);

    int r = ECDSA_verify(0, hash, hash_len, sig, sig_len, k->ec_);
    if (r == -1)
      return Nan::ThrowError("Failed to decode the signature");

    info.GetReturnValue().Set(Nan::New(r == 1));
  }

  EVP_PKEY* evp_;
  EC_KEY* ec_;
};

static void Init(Handle<Object> target) {
  // Init OpenSSL
  OpenSSL_add_all_algorithms();

  Key::Init(target);
}

NODE_MODULE(rawrsa, Init);

}  // namespace rawcipher
