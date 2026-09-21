<?php

declare(strict_types=1);

namespace App\Core;

use App\Middleware\MiddlewareInterface;

class Router
{
    /** @var array<int, array{method: string, path: string, regex: string, paramNames: array<string>, handler: callable|array, middlewares: array<MiddlewareInterface>}> */
    private array $routes = [];

    /** @var array<int, MiddlewareInterface> */
    private array $globalMiddlewares = [];

    /**
     * Add a global middleware to the pipeline.
     */
    public function use(MiddlewareInterface $middleware): self
    {
        $this->globalMiddlewares[] = $middleware;
        return $this;
    }

    public function get(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middlewares);
    }

    public function delete(string $path, callable|array $handler, array $middlewares = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, callable|array $handler, array $middlewares = []): void
    {
        $normalizedPath = $this->normalizePath($path);

        // Convert {param} placeholders into named regex capture groups
        $paramNames = [];
        $pattern = preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/', function ($matches) use (&$paramNames) {
            $paramNames[] = $matches[1];
            return '(?P<' . $matches[1] . '>[^/]+)';
        }, $normalizedPath);

        $regex = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $normalizedPath,
            'regex' => $regex,
            'paramNames' => $paramNames,
            'handler' => $handler,
            'middlewares' => $middlewares,
        ];
    }

    /**
     * Dispatch request through global middlewares and matching route pipeline.
     */
    public function dispatch(Request $request): void
    {
        $pipeline = array_reduce(
            array_reverse($this->globalMiddlewares),
            function (callable $next, MiddlewareInterface $middleware) {
                return function (Request $req) use ($middleware, $next): void {
                    $middleware->handle($req, $next);
                };
            },
            function (Request $req): void {
                $this->routeRequest($req);
            }
        );

        $pipeline($request);
    }

    /**
     * Match route and execute route-specific pipeline and handler.
     */
    private function routeRequest(Request $request): void
    {
        $path = $this->normalizePath($request->getPath());
        $method = $request->getMethod();

        $pathMatched = false;

        foreach ($this->routes as $route) {
            if (preg_match($route['regex'], $path, $matches)) {
                $pathMatched = true;

                if ($route['method'] === $method) {
                    // Extract named parameters
                    $params = [];
                    foreach ($route['paramNames'] as $paramName) {
                        if (isset($matches[$paramName])) {
                            $params[$paramName] = $matches[$paramName];
                        }
                    }
                    $request->setRouteParams($params);

                    // Execute route middlewares and final handler
                    $routePipeline = array_reduce(
                        array_reverse($route['middlewares']),
                        function (callable $next, MiddlewareInterface $middleware) {
                            return function (Request $req) use ($middleware, $next): void {
                                $middleware->handle($req, $next);
                            };
                        },
                        function (Request $req) use ($route, $params): void {
                            $this->executeHandler($route['handler'], $req, $params);
                        }
                    );

                    $routePipeline($request);
                    return;
                }
            }
        }

        if ($pathMatched) {
            Response::methodNotAllowed();
        } else {
            Response::notFound();
        }
    }

    private function executeHandler(callable|array $handler, Request $request, array $params): void
    {
        if (is_callable($handler)) {
            call_user_func($handler, $request, $params);
            return;
        }

        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;

            if (class_exists($class)) {
                $controller = new $class();
                if (method_exists($controller, $method)) {
                    $controller->$method($request, $params);
                    return;
                }
            }
        }

        Response::internalError('Error interno al ejecutar el controlador.', 'HANDLER_ERROR');
    }

    private function normalizePath(string $path): string
    {
        $trimmed = rtrim($path, '/');
        return $trimmed === '' ? '/' : $trimmed;
    }
}
