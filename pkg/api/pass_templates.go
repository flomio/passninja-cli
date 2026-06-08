package api

import "context"

// ListPassTemplates fetches all pass templates owned by the calling account.
func (c *Client) ListPassTemplates(ctx context.Context) ([]PassTemplate, error) {
	var out PassTemplateListResponse
	if err := c.do(ctx, "GET", "/pass_templates", nil, &out); err != nil {
		return nil, err
	}
	return out.PassTemplates, nil
}

// GetPassTemplate fetches a single pass template by ptk_0x... key.
func (c *Client) GetPassTemplate(ctx context.Context, id string) (*PassTemplate, error) {
	var out PassTemplate
	if err := c.do(ctx, "GET", "/pass_templates/"+id, nil, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetRequiredFields hits /pass_templates/fields/:id — the documented template
// field-schema endpoint. It returns { id, platform, fields: [{ api_field_name,
// visible, required }] } for every field on the template; required entries are
// the ones a CREATE / UPDATE call must set. (Replaces the legacy
// /passtypes/keys/:id Apple-Wallet field-key route.) Shape is kept loose.
func (c *Client) GetRequiredFields(ctx context.Context, id string) (RequiredFields, error) {
	var out RequiredFields
	if err := c.do(ctx, "GET", "/pass_templates/fields/"+id, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// CreatePassTemplate provisions a new pass template (enterprise-only on the
// server). The response shape mirrors GetPassTemplate.
func (c *Client) CreatePassTemplate(ctx context.Context, in CreatePassTemplateInput) (*PassTemplate, error) {
	var out PassTemplate
	if err := c.do(ctx, "POST", "/pass_templates", in, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeletePassTemplate hard-deletes by ptk_0x... key (enterprise-only).
func (c *Client) DeletePassTemplate(ctx context.Context, id string) error {
	return c.do(ctx, "DELETE", "/pass_templates/"+id, nil, nil)
}
