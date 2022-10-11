<?php

namespace App\Http\Middleware;

use Closure;

class NotSlaveLocation
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
    public function handle($request, Closure $next)
    {
        if (!$request->user() || $request->user()->location->parent_id > -1) {
            return abort(403);
        }

        return $next($request);
    }

}
