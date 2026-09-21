<?php

declare(strict_types=1);

namespace App\Core;

class Request
{
    private string $method;
    private string $uri;
    private string $path;
    private array $headers;
    private array $queryParams;
    private array $body;
    private array $routeParams = [];
    private string $clientIp;
    private string $requestId = '';
    private ?string $tenantId = null;
    private ?string $siteId = null;
    private ?\App\Security\AuthenticatedUser $user = null;

    public function __construct(
        string $method,
        string $uri,
        array $headers = [],
        array $queryParams = [],
        array $body = [],
        string $clientIp = ''
    ) {
        $this->method = strtoupper($method);
        $this->uri = $uri;
        $this->path = (string) (parse_url($uri, PHP_URL_PATH) ?? '/');
        $this->headers = $headers;
        if (empty($queryParams)) {
            $queryString = parse_url($uri, PHP_URL_QUERY);
            if ($queryString) {
                parse_str($queryString, $parsedQuery);
                $queryParams = $parsedQuery;
            }
        }
        $this->queryParams = $queryParams;
        $this->body = $body;
        $this->clientIp = $clientIp;
    }

    /**
     * Create Request instance from PHP global variables.
     */
    public static function fromGlobals(): self
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $queryParams = $_GET ?? [];
        $body = $_POST ?? [];

        // Extract and normalize headers
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', strtolower(substr($key, 5)));
                $headers[$headerName] = is_string($value) ? $value : (string) $value;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'], true)) {
                $headerName = str_replace('_', '-', strtolower($key));
                $headers[$headerName] = is_string($value) ? $value : (string) $value;
            }
        }

        // Determine client IP safely
        $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if (str_contains($clientIp, ',')) {
            $parts = explode(',', $clientIp);
            $clientIp = trim($parts[0]);
        }

        return new self($method, $uri, $headers, $queryParams, $body, $clientIp);
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function getHeader(string $name, ?string $default = null): ?string
    {
        $normalized = strtolower($name);
        return $this->headers[$normalized] ?? $default;
    }

    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    public function getQuery(string $key, mixed $default = null): mixed
    {
        return $this->queryParams[$key] ?? $default;
    }

    public function getBody(): array
    {
        return $this->body;
    }

    public function setBody(array $body): void
    {
        $this->body = $body;
    }

    /**
     * Get input from body or query params.
     */
    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->queryParams[$key] ?? $default;
    }

    public function getRouteParams(): array
    {
        return $this->routeParams;
    }

    public function getRouteParam(string $key, mixed $default = null): mixed
    {
        return $this->routeParams[$key] ?? $default;
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function getClientIp(): string
    {
        return $this->clientIp;
    }

    public function getRequestId(): string
    {
        return $this->requestId;
    }

    public function setRequestId(string $requestId): void
    {
        $this->requestId = $requestId;
    }

    public function getTenantId(): ?string
    {
        return $this->tenantId;
    }

    public function setTenantId(?string $tenantId): void
    {
        $this->tenantId = $tenantId;
    }

    public function getSiteId(): ?string
    {
        return $this->siteId;
    }

    public function setSiteId(?string $siteId): void
    {
        $this->siteId = $siteId;
    }

    public function getUser(): ?\App\Security\AuthenticatedUser
    {
        return $this->user;
    }

    public function setUser(?\App\Security\AuthenticatedUser $user): void
    {
        $this->user = $user;
        if ($user !== null) {
            $this->tenantId = $user->getTenantUuid();
            $this->siteId = $user->getSiteUuid();
        }
    }
}

