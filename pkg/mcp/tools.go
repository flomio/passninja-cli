package mcp

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/utils"
	mcplib "github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// registerTools wires every tool the LLM is allowed to call. Each tool's
// handler is a closure over `client`, so a single Client instance services
// the whole session.
func registerTools(s *server.MCPServer, client *api.Client) {
	registerWhoami(s, client)
	registerPassTemplateTools(s, client)
	registerPassTools(s, client)
	registerWebhookTools(s, client)
}

// ---------- whoami ----------

func registerWhoami(s *server.MCPServer, client *api.Client) {
	tool := mcplib.NewTool(
		"whoami",
		mcplib.WithDescription("Return the account id and base URL the MCP server is configured for. Useful to confirm which PassNinja account a tool call will hit before issuing or deleting passes."),
		mcplib.WithReadOnlyHintAnnotation(true),
		mcplib.WithDestructiveHintAnnotation(false),
		mcplib.WithIdempotentHintAnnotation(true),
		mcplib.WithOpenWorldHintAnnotation(true),
	)
	s.AddTool(tool, func(_ context.Context, _ mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
		return jsonResult(map[string]string{
			"account_id": client.AccountID,
			"base_url":   client.BaseURL,
			"api_key":    maskKey(client.APIKey),
		})
	})
}

// ---------- pass templates ----------

func registerPassTemplateTools(s *server.MCPServer, client *api.Client) {
	s.AddTool(
		mcplib.NewTool(
			"pass_template_list",
			mcplib.WithDescription("List every pass template owned by this account. Returns id (ptk_0x...), name, platform (apple|google), style, issuedPassCount, installedPassCount."),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, _ mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			tmpls, err := client.ListPassTemplates(ctx)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(tmpls)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_template_get",
			mcplib.WithDescription("Fetch one pass template by id. The id is the ptk_0x<hex> form, e.g. ptk_0x1E0; a bare decimal id is also accepted and normalized."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			id, err = utils.NormalizePassTemplateID(id)
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			tmpl, err := client.GetPassTemplate(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(tmpl)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_template_required_fields",
			mcplib.WithDescription("Return the field names a pass_create/pass_update call must supply for this template. ALWAYS call this before pass_create on an unfamiliar template — field names are template-specific."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			id, err = utils.NormalizePassTemplateID(id)
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			fields, err := client.GetRequiredFields(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(fields)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_template_create",
			mcplib.WithDescription("Provision a new pass template. ENTERPRISE ACCOUNTS ONLY — non-enterprise calls return ENTERPRISE_REQUIRED. Returns the new template including its ptk_0x id."),
			mcplib.WithString("name",
				mcplib.Required(),
				mcplib.Description("Human-readable template name."),
			),
			mcplib.WithString("platform",
				mcplib.Required(),
				mcplib.Description("Pass platform: apple | google."),
				mcplib.Enum("apple", "google"),
			),
			mcplib.WithString("style",
				mcplib.Required(),
				mcplib.Description("Pass style. Apple: boardingPass, coupon, eventTicket, generic, storeCard. Google: eventTicket, flightClass, genericClass, giftCardClass, loyaltyClass, offerClass, transitClass."),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			name, err := req.RequireString("name")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			platform, err := req.RequireString("platform")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			style, err := req.RequireString("style")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			tmpl, err := client.CreatePassTemplate(ctx, api.CreatePassTemplateInput{
				Name: name, Platform: platform, Style: style,
			})
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(tmpl)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_template_delete",
			mcplib.WithDescription("Hard-delete a pass template. ENTERPRISE ACCOUNTS ONLY. DESTRUCTIVE — also cascades to every issued pass on this template. Cannot be undone."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x...) to delete."),
			),
			mcplib.WithDestructiveHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			id, err = utils.NormalizePassTemplateID(id)
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			if err := client.DeletePassTemplate(ctx, id); err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(map[string]string{"deleted": id})
		},
	)
}

// ---------- passes ----------

func registerPassTools(s *server.MCPServer, client *api.Client) {
	s.AddTool(
		mcplib.NewTool(
			"pass_list",
			mcplib.WithDescription("List every pass issued on a pass template. Each pass includes its serial (ex_id) plus the template-defined fields."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			passes, err := client.ListPasses(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(passes)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_get",
			mcplib.WithDescription("Fetch one issued pass by serial. Returns the rendered field values plus device installation metadata."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithString("serial",
				mcplib.Required(),
				mcplib.Description("Pass serial number (ex_id), e.g. fee4a257185906b92a."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			serial, err := req.RequireString("serial")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			pass, err := client.GetPass(ctx, id, serial)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(pass)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_create",
			mcplib.WithDescription("Issue a new pass on a template. If unsure which fields to send, call pass_template_required_fields first — the keys in `fields` must match the template's field names exactly. Field value formats: colors as 'rgb(255,255,255)', dates as ISO 8601 'YYYY-MM-DDTHH:MM:SSZ', phones as E.164 '+19545536227', images as URLs."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithObject("fields",
				mcplib.Required(),
				mcplib.Description("Map of template field name → value. Get the expected keys from pass_template_required_fields."),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			fields, err := requireObject(req, "fields")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			pass, err := client.CreatePass(ctx, id, fields)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(pass)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_update",
			mcplib.WithDescription("Update an issued pass. Default is PATCH (merge only the supplied fields). Set `replace=true` for PUT (every template field omitted from `fields` is cleared) — only use replace mode when you intend to overwrite everything."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithString("serial",
				mcplib.Required(),
				mcplib.Description("Pass serial number (ex_id)."),
			),
			mcplib.WithObject("fields",
				mcplib.Required(),
				mcplib.Description("Field name → new value."),
			),
			mcplib.WithBoolean("replace",
				mcplib.Description("If true, PUT (full replace). If false or omitted, PATCH (merge)."),
				mcplib.DefaultBool(false),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			serial, err := req.RequireString("serial")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			fields, err := requireObject(req, "fields")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			replace := req.GetBool("replace", false)

			var pass api.Pass
			if replace {
				pass, err = client.ReplacePass(ctx, id, serial, fields)
			} else {
				pass, err = client.PatchPass(ctx, id, serial, fields)
			}
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(pass)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_delete",
			mcplib.WithDescription("Revoke an issued pass. DESTRUCTIVE — the pass on the user's wallet is invalidated and cannot be recovered. Surface the affected serial to the operator before calling."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithString("serial",
				mcplib.Required(),
				mcplib.Description("Pass serial number (ex_id) to revoke."),
			),
			mcplib.WithDestructiveHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			serial, err := req.RequireString("serial")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			if err := client.DeletePass(ctx, id, serial); err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(map[string]string{
				"deleted":       serial,
				"pass_template": id,
			})
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_raw",
			mcplib.WithDescription("Dump the full raw pass.json payload as the server has it on disk. Useful for debugging field rendering or wallet-side validation errors."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithString("serial",
				mcplib.Required(),
				mcplib.Description("Pass serial number (ex_id)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			serial, err := req.RequireString("serial")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			raw, err := client.GetRawPass(ctx, id, serial)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(raw)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"pass_decrypt",
			mcplib.WithDescription("Decrypt a reader-encrypted payload using the template's private key. Used by NFC readers (e.g. Reyax RYRR30D) handing back challenge-response output for verification."),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template id (ptk_0x... or decimal)."),
			),
			mcplib.WithString("payload",
				mcplib.Required(),
				mcplib.Description("The encrypted payload string from the reader."),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			payload, err := req.RequireString("payload")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			out, err := client.DecryptPass(ctx, id, payload)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)
}

// ---------- webhooks ----------

func registerWebhookTools(s *server.MCPServer, client *api.Client) {
	s.AddTool(
		mcplib.NewTool(
			"webhook_list",
			mcplib.WithDescription("List webhook subscriptions, optionally scoped to one pass template. Results are paginated; default page size is server-defined (~25)."),
			mcplib.WithString("pass_template",
				mcplib.Description("Optional pass template filter (ptk_0x...)."),
			),
			mcplib.WithNumber("page",
				mcplib.Description("1-based page number."),
				mcplib.Min(1),
			),
			mcplib.WithNumber("per_page",
				mcplib.Description("Results per page."),
				mcplib.Min(1),
				mcplib.Max(200),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			opts := api.ListWebhookOpts{
				PageOpts: api.PageOpts{
					Page:    req.GetInt("page", 0),
					PerPage: req.GetInt("per_page", 0),
				},
				PassTemplate: req.GetString("pass_template", ""),
			}
			out, err := client.ListWebhooks(ctx, opts)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"webhook_get",
			mcplib.WithDescription("Fetch one webhook subscription by id. The bearer_token is NOT returned here — it's surfaced only once on webhook_create."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Webhook id."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			wh, err := client.GetWebhook(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(wh)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"webhook_create",
			mcplib.WithDescription("Create a webhook subscription. The response includes a bearerToken — it's only returned on this call, so it MUST be surfaced to the operator immediately for saving."),
			mcplib.WithString("name",
				mcplib.Required(),
				mcplib.Description("Human-readable name."),
			),
			mcplib.WithString("url",
				mcplib.Required(),
				mcplib.Description("HTTPS URL the webhook POSTs to."),
			),
			mcplib.WithArray("subscribed_events",
				mcplib.Required(),
				mcplib.Description("Event names, e.g. ['pass.created', 'pass.installed']."),
				mcplib.Items(map[string]any{"type": "string"}),
			),
			mcplib.WithString("auth_method",
				mcplib.Description("Auth scheme for delivery: bearer | basic | none. Default bearer."),
			),
			mcplib.WithString("pass_template",
				mcplib.Description("Optional: scope deliveries to one pass template."),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			name, err := req.RequireString("name")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			url, err := req.RequireString("url")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			events, err := req.RequireStringSlice("subscribed_events")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			in := api.CreateWebhookInput{
				Name:             name,
				URL:              url,
				SubscribedEvents: events,
				AuthMethod:       req.GetString("auth_method", ""),
				PassTemplate:     req.GetString("pass_template", ""),
			}
			wh, err := client.CreateWebhook(ctx, in)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(wh)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"webhook_delete",
			mcplib.WithDescription("Delete a webhook subscription. DESTRUCTIVE — also cascades its delivery result history."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Webhook id."),
			),
			mcplib.WithDestructiveHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			if err := client.DeleteWebhook(ctx, id); err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(map[string]string{"deleted": id})
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"webhook_results",
			mcplib.WithDescription("Paginate the delivery history for one webhook. Each entry includes responseStatus + responseBody so you can see why a delivery failed."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Webhook id."),
			),
			mcplib.WithNumber("page",
				mcplib.Description("1-based page number."),
				mcplib.Min(1),
			),
			mcplib.WithNumber("per_page",
				mcplib.Description("Results per page."),
				mcplib.Min(1),
				mcplib.Max(200),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			opts := api.PageOpts{
				Page:    req.GetInt("page", 0),
				PerPage: req.GetInt("per_page", 0),
			}
			out, err := client.ListWebhookResults(ctx, id, opts)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)
}

// ---------- helpers ----------

// jsonResult serializes any value as pretty-printed JSON and wraps it as
// MCP text content. Errors marshalling fall back to fmt.Sprintf.
func jsonResult(v any) (*mcplib.CallToolResult, error) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return mcplib.NewToolResultText(fmt.Sprintf("%+v", v)), nil
	}
	return mcplib.NewToolResultText(string(b)), nil
}

// apiErrorResult turns an *api.APIError into a tool-error result with the
// status code and friendly hint preserved so the LLM can reason about it.
func apiErrorResult(err error) *mcplib.CallToolResult {
	switch {
	case api.IsAuth(err):
		return mcplib.NewToolResultError(fmt.Sprintf("%s — API key rejected; re-run `passninja auth` or update PASSNINJA_API_KEY", err))
	case api.IsEnterpriseRequired(err):
		return mcplib.NewToolResultError(fmt.Sprintf("%s — this tool requires an enterprise PassNinja account", err))
	case api.IsNotFound(err):
		return mcplib.NewToolResultError(fmt.Sprintf("%s — resource not found; check the id/serial", err))
	default:
		return mcplib.NewToolResultError(err.Error())
	}
}

// requireTemplateID pulls a required pass_template-shaped argument and
// normalizes the ptk_0x form in one step.
func requireTemplateID(req mcplib.CallToolRequest, key string) (string, error) {
	raw, err := req.RequireString(key)
	if err != nil {
		return "", err
	}
	return utils.NormalizePassTemplateID(raw)
}

// requireObject pulls a required object-typed argument from the request.
// Returns an error if the key is missing or the value isn't a JSON object.
func requireObject(req mcplib.CallToolRequest, key string) (map[string]any, error) {
	args := req.GetArguments()
	v, ok := args[key]
	if !ok || v == nil {
		return nil, fmt.Errorf("missing required object argument %q", key)
	}
	m, ok := v.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("argument %q must be a JSON object (got %T)", key, v)
	}
	return m, nil
}

func maskKey(s string) string {
	if len(s) <= 8 {
		return "****"
	}
	return s[:4] + "..." + s[len(s)-4:]
}
