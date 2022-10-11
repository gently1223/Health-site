<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- CSRF Token -->
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <link href="https://uploads-ssl.webflow.com/5eb1d6491b62d572c3e6b797/5eb1ff4d61d24fddf72da815_ic_launcher.png" rel="shortcut icon" type="image/x-icon">
        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,300italic,700" rel="stylesheet" type="text/css">

        <!-- Styles -->
        <link href="{{ asset('css/landing.css') }}" rel="stylesheet">
    </head>
    <body>
        <main>
            @yield('content')
        </main>
    </body>
</html>
