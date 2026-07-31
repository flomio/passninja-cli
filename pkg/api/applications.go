package api

import "context"

// CreateApplication provisions a scan-event application bound to one pass
// template. The template binding is immutable once created.
func (c *Client) CreateApplication(ctx context.Context, in CreateApplicationInput) (*Application, error) {
	var out Application
	if err := c.do(ctx, "POST", "/applications", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ListApplications returns every application on the current account.
func (c *Client) ListApplications(ctx context.Context) (*ApplicationListResponse, error) {
	var out ApplicationListResponse
	if err := c.do(ctx, "GET", "/applications", nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetApplication fetches a single application by its app_0x... id.
func (c *Client) GetApplication(ctx context.Context, id string) (*Application, error) {
	var out Application
	if err := c.do(ctx, "GET", "/applications/"+id, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// UpdateApplication patches name/description/kind/config/active. The pass
// template binding cannot be changed.
func (c *Client) UpdateApplication(ctx context.Context, id string, in UpdateApplicationInput) (*Application, error) {
	var out Application
	if err := c.do(ctx, "PATCH", "/applications/"+id, in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeleteApplication removes an application. The API returns 409 while it is
// still bound to any reader.
func (c *Client) DeleteApplication(ctx context.Context, id string) error {
	return c.do(ctx, "DELETE", "/applications/"+id, nil, nil)
}
