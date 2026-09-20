<?php

declare(strict_types=1);

namespace App\Core;

class Router
{
    private array $routes = [];

    /**
     * Register a GET route.
     */
    public function get(string $path, callable|array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Register a POST route.
     */
    public function post(string $path, callable|array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Register a PUT route.
     */
    public function put(string $path, callable|array $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Register a DELETE route.
     */
    public function delete(string $path, callable|array $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Internal method to store routes.
     */
    private function addRoute(string $method, string $path, callable|array $handler): void
    {
        $normalizedPath = $this->normalizePath($path);
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $normalizedPath,
            'handler' => $handler,
        ];
    }

    /**
     * Dispatch the current request.
     */
    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';
        $normalizedPath = $this->normalizePath($path);
        $normalizedMethod = strtoupper($method);

        $pathMatched = false;

        foreach ($this->routes as $route) {
            if ($route['path'] === $normalizedPath) {
                $pathMatched = true;

                if ($route['method'] === $normalizedMethod) {
                    $this->executeHandler($route['handler']);
                    return;
                }
            }
        }

        if ($pathMatched) {
            Response::error('Método no permitido para este endpoint.', 'METHOD_NOT_ALLOWED', 405);
        } else {
            Response::error('Endpoint no encontrado.', 'NOT_FOUND', 404);
        }
    }

    /**
     * Execute route handler.
     */
    private function executeHandler(callable|array $handler): void
    {
        if (is_callable($handler)) {
            call_user_func($handler);
            return;
        }

        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;

            if (class_exists($class)) {
                $controller = new $class();
                if (method_exists($controller, $method)) {
                    $controller->$method();
                    return;
                }
            }
        }

        Response::error('Error interno al ejecutar el controlador.', 'HANDLER_ERROR', 500);
    }

    /**
     * Normalize URL path by removing multiple slashes and trailing slashes.
     */
    private function normalizePath(string $path): string
    {
        $trimmed = rtrim($path, '/');
        return $trimmed === '' ? '/' : $trimmed;
    }
}

