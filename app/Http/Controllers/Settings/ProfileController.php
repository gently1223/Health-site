<?php

namespace App\Http\Controllers\Settings;

use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProfileController extends \App\Http\Controllers\Controller
{

    /**
     * Show Authenticated user edit profile page.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('dashboard.settings.profile');
    }

    /**
     * Save Authenticated user profile changes.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        request()->validate([
            'email'      => 'required|email',
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'phone'      => 'nullable|string',
            'birthday'   => 'required|date_format:Y-m-d',
        ]);

        /* Check if email is free to use */
        $emailIsUsed = User::whereEmail(request()->get('email'))
                           ->where('id', '<>', auth()->user()->id)
                           ->first();

        if ($emailIsUsed) {
            return redirect()->back()->withErrors(['email' => ['This email has already been taken.']])->withInput();
        }

        if (request()->get('password')) {
            request()->validate([
                'password' => 'required|confirmed',
            ]);

            auth()->user()->password = request()->get('password');
        }

        auth()->user()->email    = request()->get('email');
        auth()->user()->fname    = request()->get('first_name');
        auth()->user()->lname    = request()->get('last_name');
        auth()->user()->phone    = request()->get('phone');
        auth()->user()->birthday = request()->get('birthday');
        auth()->user()->save();

        return redirect(route('settings.profile'))->with('successMessage', 'Your updates have been saved');
    }

    /**
     * Save Authenticated user profile changes.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function uploadImage()
    {
        request()->validate([
            'image' => 'required|file|max:300000|mimes:jpeg,png',
        ]);

        $file = request()->file('image');
        $path = 'upload/temp/images/'.Str::random(3).'/'.Str::random(3);
        $name = Str::random(10).'.'.$file->extension();

        $file->storeAs($path, $name);

        return response()->json([
            'success' => true,
            'image'   => $path.'/'.$name,
        ]);
    }
}
