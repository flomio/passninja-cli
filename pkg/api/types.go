package api

// PassTemplate mirrors the shape of /v1/pass_templates/:id responses. The
// config groups + fields are only present on single-template responses
// (get / create / update), not on the list endpoint — hence omitempty.
type PassTemplate struct {
	ID                 string                    `json:"id"`
	Name               string                    `json:"name"`
	Platform           string                    `json:"platform"`
	Style              string                    `json:"style"`
	IssuedPassCount    int                       `json:"issuedPassCount"`
	InstalledPassCount int                       `json:"installedPassCount"`
	CreatedAt          string                    `json:"createdAt"`
	UpdatedAt          string                    `json:"updatedAt"`
	InstallConstraints *InstallConstraints       `json:"install_constraints,omitempty"`
	DisableSharing     *DisableSharing           `json:"disable_sharing,omitempty"`
	TopUp              *TopUp                    `json:"top_up,omitempty"`
	Fields             []PassTemplateFieldResult `json:"fields,omitempty"`
}

type PassTemplateListResponse struct {
	PassTemplates []PassTemplate `json:"pass_templates"`
}

// InstallConstraints limits where an issued pass may install. Used in both
// request (set the keys you want to change) and response (all three present).
// Pointers + omitempty so an unset key is not sent on update.
type InstallConstraints struct {
	Device  *bool `json:"device,omitempty"`
	Browser *bool `json:"browser,omitempty"`
	IP      *bool `json:"ip,omitempty"`
}

// DisableSharing toggles per-platform pass sharing (true = sharing disabled).
type DisableSharing struct {
	Apple  *bool `json:"apple,omitempty"`
	Google *bool `json:"google,omitempty"`
}

// TopUp is the auto-recharge configuration. Amounts are decimal strings (or
// null). Available to per-template subscribers only.
type TopUp struct {
	AutoRecharge   *bool   `json:"auto_recharge,omitempty"`
	BalanceTrigger *string `json:"balance_trigger,omitempty"`
	TopUpTarget    *string `json:"top_up_target,omitempty"`
}

// FieldUpdate is one entry in an update's `fields` map, keyed by api field
// name. Set only the attributes you want to change; APIFieldName remaps the
// field's external key.
type FieldUpdate struct {
	DefaultValue *string `json:"default_value,omitempty"`
	Visible      *bool   `json:"visible,omitempty"`
	Required     *bool   `json:"required,omitempty"`
	APIFieldName *string `json:"api_field_name,omitempty"`
}

// PassTemplateFieldResult is one entry in the `fields` array an update returns.
type PassTemplateFieldResult struct {
	APIFieldName string  `json:"api_field_name"`
	DefaultValue *string `json:"default_value"`
	Visible      bool    `json:"visible"`
	Required     bool    `json:"required"`
}

// CreatePassTemplateInput is the POST /v1/pass_templates body. The config
// groups are optional and require their respective entitlements.
type CreatePassTemplateInput struct {
	Name               string              `json:"name"`
	Platform           string              `json:"platform"`
	Style              string              `json:"style"`
	InstallConstraints *InstallConstraints `json:"install_constraints,omitempty"`
	DisableSharing     *DisableSharing     `json:"disable_sharing,omitempty"`
	TopUp              *TopUp              `json:"top_up,omitempty"`
}

// UpdatePassTemplateInput is the PATCH/PUT /v1/pass_templates/:id body. Every
// field is optional; provide at least one. Unknown `fields` keys are rejected
// 400 by the server before any write.
type UpdatePassTemplateInput struct {
	Name               *string                `json:"name,omitempty"`
	Fields             map[string]FieldUpdate `json:"fields,omitempty"`
	InstallConstraints *InstallConstraints    `json:"install_constraints,omitempty"`
	DisableSharing     *DisableSharing        `json:"disable_sharing,omitempty"`
	TopUp              *TopUp                 `json:"top_up,omitempty"`
}

// RequiredFields is whatever /v1/pass_templates/fields/:id returns —
// { id, platform, fields: [{ api_field_name, visible, required }] } — kept
// opaque since the field list is template-specific.
type RequiredFields map[string]any

// ReaderConfig mirrors /v1/pass_templates/:id/reader_config — the
// reader-agnostic identity values and EC decryption keys a physical NFC pass
// reader needs to read this template's passes. A side is nil unless the
// platform covers it and a decryption key exists. No reader-specific concepts
// (key slots, file names, device config) are present by design.
type ReaderConfig struct {
	ID       string              `json:"id"`
	Platform string              `json:"platform"`
	Apple    *AppleReaderConfig  `json:"apple"`
	Google   *GoogleReaderConfig `json:"google"`
}

// AppleReaderConfig carries the Apple VAS merchant id and the EC decryption
// key (SEC1 PEM, P-256).
type AppleReaderConfig struct {
	VASMerchantID    string `json:"vas_merchant_id"`
	VASPrivateKeyPEM string `json:"vas_private_key_pem"`
}

// GoogleReaderConfig carries the Google Smart Tap collector id, key version,
// and the EC decryption key (SEC1 PEM, P-256).
type GoogleReaderConfig struct {
	SmartTapCollectorID   string `json:"smart_tap_collector_id"`
	SmartTapKeyVersion    string `json:"smart_tap_key_version"`
	SmartTapPrivateKeyPEM string `json:"smart_tap_private_key_pem"`
}

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
