const { sign, verify } = require('../src/utils/hmac');

describe('hmac sign/verify', () => {
  const secret = 'super-secret-key';
  const body = JSON.stringify({ hello: 'world' });

  it('produces a sha256=<hex> signature', () => {
    const signature = sign(body, secret);
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('verifies a correctly signed body', () => {
    const signature = sign(body, secret);
    expect(verify(body, secret, signature)).toBe(true);
  });

  it('rejects a body that was tampered with after signing', () => {
    const signature = sign(body, secret);
    const tamperedBody = JSON.stringify({ hello: 'world', extra: true });
    expect(verify(tamperedBody, secret, signature)).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    const signature = sign(body, 'wrong-secret');
    expect(verify(body, secret, signature)).toBe(false);
  });

  it('rejects a missing signature', () => {
    expect(verify(body, secret, undefined)).toBe(false);
  });
});
