<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- CSRF Token -->
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Veritap') }}</title>

        <link href="https://uploads-ssl.webflow.com/5eb1d6491b62d572c3e6b797/5eb1ff4d61d24fddf72da815_ic_launcher.png" rel="shortcut icon" type="image/x-icon">
        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,300italic,700" rel="stylesheet" type="text/css">

        <!-- Styles -->
        <link href="{{ asset('css/dashboard.css') }}" rel="stylesheet">
         <link href="{{ asset('css/search.css') }}" rel="stylesheet">
        @if (isset($companySettigns))
        <style>
        .mainColorBackground{
            background: #{{ $companySettigns['color'] }}!important;
        }
        </style>
        @endif
        @stack('css')
    </head>
    <body>
        @include('dashboard.header')
        @include('dashboard.notifications')
        @include('dashboard.sidebar')
        @if (isset($globalAmenitiesPopup) && $globalAmenitiesPopup)
        @include('dashboard.amenities')
        @endif

        <main>
            @if (isset($globalErrors) && count($globalErrors))
            <div class="content">
                <div class="row">
                    <div class="col s12">
                        <div class="alerts">
                            @foreach ($globalErrors as $error)
                            <div class="alert red-text">{!! $error !!}</div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
            @endif
            @yield('content')
        </main>

        @include('dashboard.footer')

        <!-- Scripts -->
        <script>
            window.dashboard = {!!
                json_encode([
                    'csrfToken'       => csrf_token(),
                    'debug'           => config('app.env') == 'production' ? false : true,
                    'activeMenu'      => $activeMenu,
                    'activeMenuGroup' => $activeMenuGroup,
                    'activeMenuCollapse' => $activeMenuCollapse,
                    'isRoot'         => auth()->user()->isRoot() ?? false,
                    'isAdmin'         => auth()->user()->isAdmin() ?? false,
                    'isEnterprise'    => auth()->user()->isEnterprise() ?? false,
                ])
            !!};
        </script>
        <script src="{{ asset('js/dashboard.js') }}"></script>
        <script>
        window.Laravel = {}
        @if (session('successMessage') || session('errorMessage'))
        window.Laravel.alerts = {!! json_encode([
            'success' => session('successMessage') ?? null,
            'error'   => session('errorMessage') ?? null,
        ]) !!}
        @endif
        </script>
        @stack('js')
        <script>
            window.fwSettings = {
                'widget_id' : 67000002601
    	    };
            !function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}()
        </script>

        @if (auth()->check())
        <script>
            function initFreshChat() {
                window.fcWidget.init({
                    token:      "a9ddb849-d100-4c80-8feb-2359eed261d4",
                    host:       "https://wchat.freshchat.com",
                    externalId: '{{ auth()->user()->id }}',
                    firstName:  '{{ auth()->user()->fname }}',
                    lastName:   '{{ auth()->user()->lname }}',
                    email:      '{{ auth()->user()->email }}',
                });
            }

            function initialize(i,t){var e;i.getElementById(t)?initFreshChat():((e=i.createElement("script")).id=t,e.async=!0,e.src="https://wchat.freshchat.com/js/widget.js",e.onload=initFreshChat,i.head.appendChild(e))}function initiateCall(){initialize(document,"Freshdesk Messaging-js-sdk")}window.addEventListener?window.addEventListener("load",initiateCall,!1):window.attachEvent("load",initiateCall,!1);
        </script>
        @endif

        <script type='text/javascript' src='https://wchat.freshchat.com/js/widget.js' async defer></script>
        <script type='text/javascript' src='https://widget.freshworks.com/widgets/67000002601.js' async defer></script>
    </body>
</html>
