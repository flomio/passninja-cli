package api

import (
	"context"
	"strconv"
)

// CreateWebhook provisions a new webhook subscription. The server returns
// the plaintext bearer_token exactly once on this response — surface it.
func (c *Client) CreateWebhook(ctx context.Context, in CreateWebhookInput) (*Webhook, error) {
	var out Webhook
	if err := c.do(ctx, "POST", "/webhooks", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListWebhooks paginates through webhooks owned by the current account,
// optionally scoped to a pass template.
func (c *Client) ListWebhooks(ctx context.Context, opts ListWebhookOpts) (*WebhookListResponse, error) {
	params := map[string]string{
		"page":         intOrEmpty(opts.Page),
		"perPage":      intOrEmpty(opts.PerPage),
		"passTemplate": opts.PassTemplate,
	}
	var out WebhookListResponse
	if err := c.do(ctx, "GET", "/webhooks"+queryString(params), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetWebhook fetches a single webhook by id.
func (c *Client) GetWebhook(ctx context.Context, id string) (*Webhook, error) {
	var out Webhook
	if err := c.do(ctx, "GET", "/webhooks/"+id, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteWebhook removes the webhook (and cascades its result history).
func (c *Client) DeleteWebhook(ctx context.Context, id string) error {
	return c.do(ctx, "DELETE", "/webhooks/"+id, nil, nil)
}

// ListWebhookResults paginates the delivery history for one webhook.
func (c *Client) ListWebhookResults(ctx context.Context, id string, opts PageOpts) (*WebhookResultsResponse, error) {
	params := map[string]string{
		"page":    intOrEmpty(opts.Page),
		"perPage": intOrEmpty(opts.PerPage),
	}
	var out WebhookResultsResponse
	if err := c.do(ctx, "GET", "/webhooks/"+id+"/results"+queryString(params), nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func intOrEmpty(n int) string {
	if n <= 0 {
		return ""
	}
	return strconv.Itoa(n)
}
