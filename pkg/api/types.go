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

// RequiredFields is whatever /v1/passtypes/keys/:id returns — schema is
// template-specific so we keep it opaque.
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
	AuthMethod       string   `json:"auth_method"`
	SubscribedEvents []string `json:"subscribed_events"`
	PassTemplate     *string  `json:"pass_template"`
	Active           bool     `json:"active"`
	BearerToken      string   `json:"bearer_token,omitempty"`
	CreatedAt        string   `json:"created_at"`
	UpdatedAt        string   `json:"updated_at"`
}

type CreateWebhookInput struct {
	Name             string   `json:"name"`
	URL              string   `json:"url"`
	AuthMethod       string   `json:"auth_method,omitempty"`
	SubscribedEvents []string `json:"subscribed_events"`
	PassTemplate     string   `json:"pass_template,omitempty"`
}

type WebhookListResponse struct {
	Webhooks []Webhook `json:"webhooks"`
	Page     int       `json:"page"`
	PerPage  int       `json:"per_page"`
	Total    int       `json:"total"`
}

type WebhookResult struct {
	ID             string  `json:"id"`
	WebhookID      string  `json:"webhook_id"`
	URL            *string `json:"url"`
	ResponseStatus *int    `json:"response_status"`
	ResponseBody   *string `json:"response_body"`
	Success        bool    `json:"success"`
	Attempt        int     `json:"attempt"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

type WebhookResultsResponse struct {
	WebhookResults []WebhookResult `json:"webhook_results"`
	Page           int             `json:"page"`
	PerPage        int             `json:"per_page"`
	Total          int             `json:"total"`
}

// PageOpts is a generic paginated-list filter — page and per_page.
type PageOpts struct {
	Page    int
	PerPage int
}

// ListWebhookOpts adds an optional pass_template filter on top of PageOpts.
type ListWebhookOpts struct {
	PageOpts
	PassTemplate string
}
