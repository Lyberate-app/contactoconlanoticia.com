<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Site;

class ResolveSite
{
    public function handle(Request $request, Closure $next)
    {
        $domain = $request->getHost();
        
        $site = Site::where('domain', $domain)->where('is_active', true)->first();
        
        if (!$site) {
            $site = Site::find(env('DEFAULT_SITE_ID', 1));
        }

        if (!$site) {
            return response()->json(['error' => 'Site not found'], 404);
        }

        $request->merge(['site_id' => $site->id]);
        app()->instance('current_site', $site);

        return $next($request);
    }
}
