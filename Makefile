SHELL := /bin/bash

BINARY  := passninja
PKG     := github.com/flomio/passninja-cli
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
COMMIT  ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
DATE    ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ)

LDFLAGS := -s -w \
	-X main.version=$(VERSION) \
	-X main.commit=$(COMMIT) \
	-X main.buildDate=$(DATE)

DIST := dist

.PHONY: build build-all install clean fmt vet release mcpb

build:
	@mkdir -p $(DIST)
	go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY) .

build-all:
	@mkdir -p $(DIST)
	GOOS=darwin  GOARCH=arm64               go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-darwin-arm64 .
	GOOS=darwin  GOARCH=amd64               go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-darwin-amd64 .
	GOOS=linux   GOARCH=arm64               go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-linux-arm64 .
	GOOS=linux   GOARCH=amd64               go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-linux-amd64 .
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-windows-amd64.exe .
	GOOS=windows GOARCH=arm64 CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-windows-arm64.exe .
	GOOS=windows GOARCH=386   CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(DIST)/$(BINARY)-windows-386.exe   .

install:
	go install -ldflags "$(LDFLAGS)" .

clean:
	rm -rf $(DIST)

fmt:
	gofmt -s -w .

vet:
	go vet ./...

release: build-all mcpb
	cd $(DIST) && shasum -a 256 $(BINARY)-* $(BINARY).mcpb > SHA256SUMS

mcpb: build-all
	./mcpb/build.sh
