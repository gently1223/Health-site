<?php

namespace App\Http\Middleware;

use Closure;

class RoleMiddleware
{
    /**
     * Run the request filter.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure $next
     * @param $roles
     * @return mixed
     * @internal param string $role
     */
    public function handle($request, Closure $next, $roles)
    {
        if (!$request->user() || !$request->user()->hasRole($roles)) {
            return abort(403);
        }

        return $next($request);
    }

}
