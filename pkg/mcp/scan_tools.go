package mcp

import (
	"context"

	"github.com/flomio/passninja-cli/pkg/api"
	mcplib "github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// ---------- scan event system: applications + readers ----------
//
// Only the account-authenticated CRUD surface is exposed. Scan submission,
// heartbeat, and Smart Tap pre-sign authenticate as one physical reader with
// its own bearer token and belong to `passninja reader serve` on the reader
// host — an LLM has no reader token and no tap to submit.

func registerApplicationTools(s *server.MCPServer, client *api.Client) {
	s.AddTool(
		mcplib.NewTool(
			"application_list",
			mcplib.WithToolTitle("List Scan Applications"),
			mcplib.WithDescription("List scan-event applications on the account. An application is bound to exactly one pass template and defines what happens when a reader scans one of its passes: kind 'log' records every scan, 'validate' accepts/rejects the tap, 'forward' relays it to a third-party endpoint. Readers bind to applications."),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			out, err := client.ListApplications(ctx)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"application_get",
			mcplib.WithToolTitle("Get Scan Application"),
			mcplib.WithDescription("Fetch one scan-event application by its app_0x... id, including its kind, bound pass template, config (rescan window, forward endpoint), and how many readers use it."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Application id (app_0x...)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			out, err := client.GetApplication(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"application_create",
			mcplib.WithToolTitle("Create Scan Application"),
			mcplib.WithDescription("Create a scan-event application bound to one pass template. The template binding is immutable afterwards. Kind 'log' needs the scan-events-system entitlement; 'validate' needs scan-events-validate; 'forward' needs scan-events-forward plus an https endpoint_url."),
			mcplib.WithString("name",
				mcplib.Required(),
				mcplib.Description("Human label for the application."),
			),
			mcplib.WithString("pass_template",
				mcplib.Required(),
				mcplib.Description("Pass template this application validates for (ptk_0x... or decimal)."),
			),
			mcplib.WithString("kind",
				mcplib.Description("log (default) | validate | forward."),
			),
			mcplib.WithString("description",
				mcplib.Description("Optional description."),
			),
			mcplib.WithNumber("rescan_window_seconds",
				mcplib.Description("Seconds before the same pass may be scanned again on this application's readers. Omit or 0 for no dedup."),
				mcplib.Min(0),
			),
			mcplib.WithString("endpoint_url",
				mcplib.Description("https endpoint that receives forwarded scans. Required for kind 'forward'."),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			name, err := req.RequireString("name")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			ptID, err := requireTemplateID(req, "pass_template")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			in := api.CreateApplicationInput{
				Name:         name,
				Kind:         req.GetString("kind", "log"),
				PassTemplate: ptID,
				Description:  req.GetString("description", ""),
			}
			cfg := map[string]any{}
			if w := req.GetInt("rescan_window_seconds", 0); w > 0 {
				cfg["rescanWindowSeconds"] = w
			}
			if u := req.GetString("endpoint_url", ""); u != "" {
				cfg["endpointUrl"] = u
			}
			if len(cfg) > 0 {
				in.Config = cfg
			}
			out, err := client.CreateApplication(ctx, in)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"application_update",
			mcplib.WithToolTitle("Update Scan Application"),
			mcplib.WithDescription("Update a scan-event application's name, description, kind, rescan window, forward endpoint, or active state. The pass template binding cannot be changed. Switching to validate or forward requires the matching entitlement."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Application id (app_0x...)."),
			),
			mcplib.WithString("name", mcplib.Description("New name.")),
			mcplib.WithString("description", mcplib.Description("New description.")),
			mcplib.WithString("kind", mcplib.Description("log | validate | forward.")),
			mcplib.WithNumber("rescan_window_seconds",
				mcplib.Description("New rescan dedup window in seconds."),
				mcplib.Min(0),
			),
			mcplib.WithString("endpoint_url", mcplib.Description("New https endpoint for kind 'forward'.")),
			mcplib.WithBoolean("active", mcplib.Description("Enable or disable the application.")),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			args := req.GetArguments()
			var in api.UpdateApplicationInput
			if v, ok := args["name"]; ok {
				s := toStringArg(v)
				in.Name = &s
			}
			if v, ok := args["description"]; ok {
				s := toStringArg(v)
				in.Description = &s
			}
			if v, ok := args["kind"]; ok {
				s := toStringArg(v)
				in.Kind = &s
			}
			cfg := map[string]any{}
			if _, ok := args["rescan_window_seconds"]; ok {
				cfg["rescanWindowSeconds"] = req.GetInt("rescan_window_seconds", 0)
			}
			if _, ok := args["endpoint_url"]; ok {
				cfg["endpointUrl"] = req.GetString("endpoint_url", "")
			}
			if len(cfg) > 0 {
				in.Config = cfg
			}
			if _, ok := args["active"]; ok {
				b := req.GetBool("active", true)
				in.Active = &b
			}
			out, err := client.UpdateApplication(ctx, id, in)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"application_delete",
			mcplib.WithToolTitle("Delete Scan Application"),
			mcplib.WithDescription("Delete a scan-event application. The API refuses with 409 while the application is still bound to any reader — unbind it first."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Application id (app_0x...)."),
			),
			mcplib.WithDestructiveHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			if err := client.DeleteApplication(ctx, id); err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(map[string]any{"deleted": id})
		},
	)
}

func registerReaderTools(s *server.MCPServer, client *api.Client) {
	s.AddTool(
		mcplib.NewTool(
			"reader_list",
			mcplib.WithToolTitle("List NFC Readers"),
			mcplib.WithDescription("List registered NFC readers on the account, with their location, application bindings, heartbeat-reported hardware identity (serial, model, firmware), and last-seen time. Use this to see which readers are online and what they are configured to scan."),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			out, err := client.ListReaders(ctx)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"reader_get",
			mcplib.WithToolTitle("Get NFC Reader"),
			mcplib.WithDescription("Fetch one registered reader: health (status, last seen, last IP), hardware identity as reported by heartbeat, and its application bindings."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Reader id (numeric)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			out, err := client.GetReader(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"reader_create",
			mcplib.WithToolTitle("Register NFC Reader"),
			mcplib.WithDescription("Register an NFC reader and mint its bearer token. Only name, location, and at least one application binding are needed — hardware identity is reported later by the reader host via heartbeat. The response carries the reader token exactly once; it is what `passninja reader serve` uses, and it must never be replaced by an account API key. A template must have zero live issued passes when first paired with a reader."),
			mcplib.WithString("name",
				mcplib.Required(),
				mcplib.Description("Reader name, e.g. 'Front gate'."),
			),
			mcplib.WithString("location",
				mcplib.Required(),
				mcplib.Description("Where the reader is installed."),
			),
			mcplib.WithArray("applications",
				mcplib.Required(),
				mcplib.Description("Application ids to bind (app_0x...). At most 3 Apple-template and 3 Google-template applications per reader."),
				mcplib.WithStringItems(),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			name, err := req.RequireString("name")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			location, err := req.RequireString("location")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			apps := req.GetStringSlice("applications", nil)
			if len(apps) == 0 {
				return mcplib.NewToolResultError("at least one application id is required"), nil
			}
			out, err := client.CreateReader(ctx, api.CreateReaderInput{
				Name:         name,
				Location:     location,
				Applications: apps,
			})
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"reader_update",
			mcplib.WithToolTitle("Update NFC Reader"),
			mcplib.WithDescription("Update a reader's name, location, status (active | revoked), or replace its application bindings. Newly added bindings are validated against the 3-Apple / 3-Google limit and the zero-live-passes pairing rule; bindings the reader already had stay exempt."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Reader id (numeric)."),
			),
			mcplib.WithString("name", mcplib.Description("New reader name.")),
			mcplib.WithString("location", mcplib.Description("New location.")),
			mcplib.WithString("status", mcplib.Description("active | revoked.")),
			mcplib.WithArray("applications",
				mcplib.Description("Replacement set of application ids (app_0x...)."),
				mcplib.WithStringItems(),
			),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			args := req.GetArguments()
			var in api.UpdateReaderInput
			if v, ok := args["name"]; ok {
				s := toStringArg(v)
				in.Name = &s
			}
			if v, ok := args["location"]; ok {
				s := toStringArg(v)
				in.Location = &s
			}
			if v, ok := args["status"]; ok {
				s := toStringArg(v)
				in.Status = &s
			}
			if _, ok := args["applications"]; ok {
				in.Applications = req.GetStringSlice("applications", nil)
			}
			out, err := client.UpdateReader(ctx, id, in)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"reader_delete",
			mcplib.WithToolTitle("Delete NFC Reader"),
			mcplib.WithDescription("Delete a registered reader. Its bearer token stops working immediately and its recorded scan history is removed with it."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Reader id (numeric)."),
			),
			mcplib.WithDestructiveHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			if err := client.DeleteReader(ctx, id); err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(map[string]any{"deleted": id})
		},
	)

	s.AddTool(
		mcplib.NewTool(
			"reader_config",
			mcplib.WithToolTitle("Get Merged Reader Config"),
			mcplib.WithDescription("Return the reader config merged across every pass template this reader is bound to: Apple VAS merchant id, Google Smart Tap collector id + key version, and the EC decryption keys (SEC1 PEM). This is what a reader host loads onto the hardware. Only decryption keys are returned; signing material is never exposed."),
			mcplib.WithString("id",
				mcplib.Required(),
				mcplib.Description("Reader id (numeric)."),
			),
			mcplib.WithReadOnlyHintAnnotation(true),
			mcplib.WithDestructiveHintAnnotation(false),
			mcplib.WithIdempotentHintAnnotation(true),
			mcplib.WithOpenWorldHintAnnotation(true),
		),
		func(ctx context.Context, req mcplib.CallToolRequest) (*mcplib.CallToolResult, error) {
			client := clientFromCtx(ctx, client)
			if client == nil {
				return needAuthResult(), nil
			}
			id, err := req.RequireString("id")
			if err != nil {
				return mcplib.NewToolResultError(err.Error()), nil
			}
			out, err := client.GetReaderMergedConfig(ctx, id)
			if err != nil {
				return apiErrorResult(err), nil
			}
			return jsonResult(out)
		},
	)
}

// toStringArg coerces an MCP argument to a string without assuming its
// concrete type — callers may send a JSON string, number, or bool.
func toStringArg(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		return x
	default:
		return ""
	}
}
