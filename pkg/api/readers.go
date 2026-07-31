package api

import "context"

// CreateReader registers a reader. Only name, location, and at least one
// application binding are required — hardware identity (serial, model,
// firmware) is reported later via Heartbeat. The response carries the reader
// bearer token exactly once.
func (c *Client) CreateReader(ctx context.Context, in CreateReaderInput) (*Reader, error) {
	var out Reader
	if err := c.do(ctx, "POST", "/readers", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListReaders returns every reader on the current account.
func (c *Client) ListReaders(ctx context.Context) (*ReaderListResponse, error) {
	var out ReaderListResponse
	if err := c.do(ctx, "GET", "/readers", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetReader fetches one reader with its health, hardware identity, and
// application bindings.
func (c *Client) GetReader(ctx context.Context, id string) (*Reader, error) {
	var out Reader
	if err := c.do(ctx, "GET", "/readers/"+id, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UpdateReader patches name/location/status, or replaces the application
// binding set.
func (c *Client) UpdateReader(ctx context.Context, id string, in UpdateReaderInput) (*Reader, error) {
	var out Reader
	if err := c.do(ctx, "PATCH", "/readers/"+id, in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteReader removes a reader and its bindings.
func (c *Client) DeleteReader(ctx context.Context, id string) error {
	return c.do(ctx, "DELETE", "/readers/"+id, nil, nil)
}

// RotateReaderToken mints a new bearer token for the reader; the previous
// token stops working immediately. Returned exactly once.
func (c *Client) RotateReaderToken(ctx context.Context, id string) (*RotateReaderTokenResponse, error) {
	var out RotateReaderTokenResponse
	if err := c.do(ctx, "POST", "/readers/"+id+"/token", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetReaderMergedConfig returns the reader config merged across every
// template the reader is bound to — what a serving client loads onto the
// hardware. Bounded server-side by the 3-Apple / 3-Google binding limit.
func (c *Client) GetReaderMergedConfig(ctx context.Context, id string) (*ReaderMergedConfig, error) {
	var out ReaderMergedConfig
	if err := c.do(ctx, "GET", "/readers/"+id+"/config", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ---------------------------------------------------------------------------
// Device-facing calls. These authenticate with the per-reader bearer token,
// never the account API key — build the client with WithBearerToken(readerToken)
// (see NewReaderClient in scans.go).
// ---------------------------------------------------------------------------

// Heartbeat reports hardware identity and liveness for this reader. Gated
// server-side by the scan-events-heartbeat entitlement.
func (c *Client) Heartbeat(ctx context.Context, in HeartbeatInput) (*HeartbeatResponse, error) {
	var out HeartbeatResponse
	if err := c.do(ctx, "POST", "/readers/heartbeat", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
