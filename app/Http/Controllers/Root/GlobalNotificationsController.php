<?php

namespace App\Http\Controllers\Root;

use Carbon\Carbon;
use App\Models\GlobalNotification;

class GlobalNotificationsController extends \App\Http\Controllers\Controller
{

    /**
     * Show global notifications list page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        return view('dashboard.root.notifications.index', [
            'list' => GlobalNotification::orderBy('id', 'ASC')->get(),
        ]);
    }

    /**
     * Show global notification create page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function create()
    {
        return view('dashboard.root.notifications.manage');
    }

    /**
     * Show global notification edit page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function edit($id)
    {
        $notification = GlobalNotification::where('id', $id)->first();

        if (!$notification) {
            return abort(404);
        }

        return view('dashboard.root.notifications.manage', [
            'notification' => $notification,
        ]);
    }

    /**
     * Save global notification
     *
     * @return Illuminate\Http\RedirectResponse
     */
    public function save()
    {
        $validate = [
            'title'      => 'required|string',
            'message'    => 'required|string',
            'start_date' => 'required|date_format:Y-m-d',
            'end_date'   => 'required|date_format:Y-m-d',
        ];

        request()->validate($validate);

        if (!request()->get('notification_id')) {
            $notification = new GlobalNotification;
        } else {
            $notification = GlobalNotification::where('id', request()->get('notification_id'))->first();
        }

        if (!$notification) {
            return redirect(route('root.notifications'))->with('errorMessage', 'Notification not found');
        }

        $notification->title      = request()->get('title');
        $notification->message    = request()->get('message');
        $notification->start_date = Carbon::parse(request()->get('start_date'))->format('Y-m-d 00:00:00');
        $notification->end_date   = Carbon::parse(request()->get('end_date'))->format('Y-m-d 23:59:59');
        $notification->save();

        return redirect(route('root.notifications'))->with('successMessage', 'Notification saved');
    }

    /**
     * Show global notification remove page
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function remove($id)
    {
        $notification = GlobalNotification::where('id', $id)->first();

        if (!$notification) {
            return abort(404);
        }

        return view('dashboard.root.notifications.remove', [
            'notification' => $notification,
        ]);
    }

    /**
     * Confirm global notification delete
     *
     * @return Illuminate\Http\RedirectResponse
     */
    public function delete($id)
    {
        $notification = GlobalNotification::where('id', $id)->first();

        if (!$notification) {
            return abort(404);
        }

        $notificationTitle = $notification->title;

        $notification->delete();

        return redirect(route('root.notifications'))->with('successMessage', '"'.$notificationTitle.'" notification was sucessfully deleted');
    }
}
