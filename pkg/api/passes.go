package api

import (
	"context"
)

// CreatePass issues a new pass for the given template. `fields` is the
// `pass` object — keys come from the template's required-fields list.
func (c *Client) CreatePass(ctx context.Context, passTemplate string, fields map[string]any) (Pass, error) {
	body := map[string]any{
		"passType": passTemplate,
		"pass":     fields,
	}
	var out Pass
	if err := c.do(ctx, "POST", "/passes", body, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// ListPasses returns all issued passes for the given template.
func (c *Client) ListPasses(ctx context.Context, passTemplate string) ([]Pass, error) {
	var out any
	if err := c.do(ctx, "GET", "/passes/"+passTemplate, nil, &out); err != nil {
		return nil, err
	}
	// Server returns either { "passes": [...] } or a bare array depending on
	// the route version; handle both transparently.
	switch v := out.(type) {
	case map[string]any:
		if arr, ok := v["passes"].([]any); ok {
			passes := make([]Pass, 0, len(arr))
			for _, item := range arr {
				if m, ok := item.(map[string]any); ok {
					passes = append(passes, m)
				}
			}
			return passes, nil
		}
		return []Pass{Pass(v)}, nil
	case []any:
		passes := make([]Pass, 0, len(v))
		for _, item := range v {
			if m, ok := item.(map[string]any); ok {
				passes = append(passes, m)
			}
		}
		return passes, nil
	}
	return nil, nil
}

// GetPass fetches a single issued pass by serial.
func (c *Client) GetPass(ctx context.Context, passTemplate, passID string) (Pass, error) {
	var out Pass
	if err := c.do(ctx, "GET", "/passes/"+passTemplate+"/"+passID, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetRawPass returns the full raw pass.json payload as the server has it.
func (c *Client) GetRawPass(ctx context.Context, passTemplate, passID string) (map[string]any, error) {
	var out map[string]any
	if err := c.do(ctx, "GET", "/passes/"+passTemplate+"/"+passID+"/raw", nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// PatchPass merges the given fields into an existing pass.
func (c *Client) PatchPass(ctx context.Context, passTemplate, passID string, fields map[string]any) (Pass, error) {
	body := map[string]any{"pass": fields}
	var out Pass
	if err := c.do(ctx, "PATCH", "/passes/"+passTemplate+"/"+passID, body, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// ReplacePass replaces all template-defined fields with those in `fields`.
// Anything omitted is cleared. Use PatchPass unless that's what you actually
// want.
func (c *Client) ReplacePass(ctx context.Context, passTemplate, passID string, fields map[string]any) (Pass, error) {
	body := map[string]any{"pass": fields}
	var out Pass
	if err := c.do(ctx, "PUT", "/passes/"+passTemplate+"/"+passID, body, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// DeletePass revokes a pass.
func (c *Client) DeletePass(ctx context.Context, passTemplate, passID string) error {
	return c.do(ctx, "DELETE", "/passes/"+passTemplate+"/"+passID, nil, nil)
}

// DecryptPass forwards a reader-encrypted payload to the server for
// template-keyed decryption.
func (c *Client) DecryptPass(ctx context.Context, passTemplate, payload string) (map[string]any, error) {
	body := map[string]any{"payload": payload}
	var out map[string]any
	if err := c.do(ctx, "POST", "/passtypes/decrypt/"+passTemplate, body, &out); err != nil {
		return nil, err
	}
	return out, nil
}
