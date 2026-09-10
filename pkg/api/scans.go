package api

import "context"

// NewReaderClient builds a client authenticated as one physical reader. Scan,
// heartbeat, and Smart Tap pre-sign are the only endpoints that accept a
// reader token; everything else needs the account credential pair.
func NewReaderClient(readerToken string, opts ...Option) *Client {
	all := append([]Option{WithBearerToken(readerToken)}, opts...)
	return NewClient("", "", all...)
}

// Scan submits one tap. Send either Message (the reader decrypted locally)
// or Payload (raw hex the server decrypts); a Google payload additionally
// needs Session. The response carries the LED/beep instruction to apply.
func (c *Client) Scan(ctx context.Context, in ScanInput) (*ScanResponse, error) {
	var out ScanResponse
	if err := c.do(ctx, "POST", "/scans", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// PreSignSmartTap asks the server to generate the terminal nonce and
// ephemeral key pair and sign the session with the long-term collector key,
// so the reader never holds that key. Called mid-tap: the mobile device
// verifies the signature over its own nonce (captured from the SELECT
// response) before releasing data, so mobileNonceHex is required. The reader
// must be bound to the template (403 otherwise). Reader-token authed.
func (c *Client) PreSignSmartTap(ctx context.Context, passTemplateID, mobileNonceHex string) (*SmartTapPreSign, error) {
	var out SmartTapPreSign
	path := "/passes/" + passTemplateID + "/smarttap/presign"
	body := map[string]string{"mobileNonce": mobileNonceHex}
	if err := c.do(ctx, "POST", path, body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetReaderSelfConfig returns the non-secret polling parameters for every
// template this reader is bound to: which Apple merchant ids to query on a
// tap and which collector id / key version a Smart Tap negotiate advertises.
// Reader-token authed; never contains key material.
func (c *Client) GetReaderSelfConfig(ctx context.Context) (*ReaderSelfConfig, error) {
	var out ReaderSelfConfig
	if err := c.do(ctx, "GET", "/readers/self/config", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
