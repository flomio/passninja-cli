package api

// PassTemplate mirrors the shape of /v1/pass_templates/:id responses.
type PassTemplate struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Platform           string `json:"platform"`
	Style              string `json:"style"`
	IssuedPassCount    int    `json:"issuedPassCount"`
	InstalledPassCount int    `json:"installedPassCount"`
	CreatedAt          string `json:"createdAt"`
	UpdatedAt          string `json:"updatedAt"`
}

type PassTemplateListResponse struct {
	PassTemplates []PassTemplate `json:"pass_templates"`
}

type CreatePassTemplateInput struct {
	Name     string `json:"name"`
	Platform string `json:"platform"`
	Style    string `json:"style"`
}

// RequiredFields is whatever /v1/pass_templates/fields/:id returns —
// { id, platform, fields: [{ api_field_name, visible, required }] } — kept
// opaque since the field list is template-specific.
type RequiredFields map[string]any

// Pass is intentionally loose; the server returns fields keyed by their
// template-defined names.
type Pass map[string]any

type PassListResponse struct {
	Passes []Pass `json:"passes"`
}

// Webhook mirrors /v1/webhooks/:id response shape. BearerToken is populated
// only on the POST response — never on subsequent GETs.
type Webhook struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	URL              string   `json:"url"`
	AuthMethod       string   `json:"authMethod"`
	SubscribedEvents []string `json:"subscribedEvents"`
	PassTemplate     *string  `json:"passTemplate"`
	Active           bool     `json:"active"`
	BearerToken      string   `json:"bearerToken,omitempty"`
	CreatedAt        string   `json:"createdAt"`
	UpdatedAt        string   `json:"updatedAt"`
}

type CreateWebhookInput struct {
	Name             string   `json:"name"`
	URL              string   `json:"url"`
	AuthMethod       string   `json:"authMethod,omitempty"`
	SubscribedEvents []string `json:"subscribedEvents"`
	PassTemplate     string   `json:"passTemplate,omitempty"`
}

type WebhookListResponse struct {
	Webhooks []Webhook `json:"webhooks"`
	Page     int       `json:"page"`
	PerPage  int       `json:"perPage"`
	Total    int       `json:"total"`
}

type WebhookResult struct {
	ID             string  `json:"id"`
	WebhookID      string  `json:"webhookId"`
	URL            *string `json:"url"`
	ResponseStatus *int    `json:"responseStatus"`
	ResponseBody   *string `json:"responseBody"`
	Success        bool    `json:"success"`
	Attempt        int     `json:"attempt"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

type WebhookResultsResponse struct {
	WebhookResults []WebhookResult `json:"webhookResults"`
	Page           int             `json:"page"`
	PerPage        int             `json:"perPage"`
	Total          int             `json:"total"`
}

// PageOpts is a generic paginated-list filter.
type PageOpts struct {
	Page    int
	PerPage int
}

// ListWebhookOpts adds an optional passTemplate filter on top of PageOpts.
type ListWebhookOpts struct {
	PageOpts
	PassTemplate string
}
