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
// so the reader never holds that key. The reader must be bound to the
// template (403 otherwise). Reader-token authed.
func (c *Client) PreSignSmartTap(ctx context.Context, passTemplateID string) (*SmartTapPreSign, error) {
	var out SmartTapPreSign
	path := "/passes/" + passTemplateID + "/smarttap/presign"
	if err := c.do(ctx, "POST", path, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
