<ul id="globalNotifications">
    @foreach ($globalNotifications as $notification)
    <li>{{ $notification->message }}</li>
    @endforeach
</ul>
