<?php

namespace App\Http\Middleware;

use Closure;

class AccessPaid
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
        if (!$request->user() || !$request->user()->isRegisterFeePaid()) {
            return abort(403);
        }

        return $next($request);
    }

}
