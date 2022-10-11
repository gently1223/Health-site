@extends('layouts.landing')

@section('content')
<div class="container">
    Landing page here
    <a href="{{ route('login') }}">Login</a>
    <a href="{{ route('register') }}">Register</a>
</div>
@endsection
