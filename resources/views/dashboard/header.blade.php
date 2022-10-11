<header>
    <div class="left" style="padding-top:5px;padding-left:15px;">
         <a href="{{ route('index') }}"><img src="/images/concierge/conciege_logo.png" height="20"></a>
    </div>
    <div class="right">
        @if (auth()->check())
        <span>Welcome, {{ ucwords(auth()->user()->display_name) }} / <b>{{ ucfirst(auth()->user()->role->name) }}</b></span>
        @endif
    </div>
    <div class="headerLink">
        <a href="{{ route('index') }}">{{ $headerHomeLink }}</a>
    </div>
</header>
