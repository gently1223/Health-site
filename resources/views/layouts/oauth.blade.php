<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Concierge Health | {{ $client->name }} Oauth</title>

        <!--Import materialize.css-->
        <link type="text/css" rel="stylesheet" href="{{ asset('assets/css/materialize.min.css') }}" media="screen,projection"/>

        <link href='https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300,300italic,700' rel='stylesheet' type='text/css'>
    </head>
    <style>
        #toast-container{
            top: auto;
            bottom: 20px;
            right: 20px;
        }
        .peloton__container{
            height: 100vh;
            margin: 0;
        }
        .peloton__container .logo{
            height: 100vh;
            border-left: 1px solid #707070;
        }
        .peloton__container .form{
            position: relative;
            height: 100vh;
        }
        h1{
            margin: 0 0 20px;
            font-size: 2rem;
            text-transform: uppercase;
            letter-spacing: 6px;
            color: #42425B;
        }
        .peloton__container .form form{
            width: 100%;
        }
        .peloton__container .form form > p {
            color: #afafaf;
        }
        .peloton__form--button{
            background: #43425B;
            padding: 0 60px;
            margin: 40px 0 20px;
        }
        .peloton__form--button:hover, .peloton__form--button:focus{
            background: #313042;
        }
        .peloton__container .form .policy{
            text-align: center;
            position: absolute;
            left: 0;
            bottom: 0;
            right: 0;
            padding: 0 0 20px;
        }
        .input-field{
            position: relative;
        }
        .input-field label{
            left: 0;
        }
        .peloton__form--hint{
            position: absolute;
            top: 0.75rem;
            right: 0;
        }
        #peloton-id-hint{
            width: 100%;
            float: left;
        }
        .oauthRegisterLogos{
            padding: 0 8%;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
        }
        .oauthRegisterLogos img{
            width: 16%;
        }
        .oauthRegisterLogos img:first-child{
            margin-right: 12%;
            width: 30%;
        }
        .oauthRegisterLogos img:last-child{
            margin-left: 12%;
            width: 30%;
        }
    </style>
    <body>
        @yield('content')

        <script>
        window.Laravel = {}
        @if (session('successMessage') || session('errorMessage'))
        window.Laravel.alerts = {!! json_encode([
            'success' => session('successMessage') ?? null,
            'error'   => session('errorMessage') ?? null,
        ]) !!}
        @endif
        </script>

        <script src="{{ asset('assets/js/jquery.min.js') }}"></script>
        <script src="{{ asset('assets/js/materialize.min.js') }}"></script>
        <script>
            var peloton = {
                timeout: null,
                validate: function(){
                    var is_valid = false;

                    if ( $('#peloton__form--aknowledge_authorization:checked').length ) is_valid = true;

                    if ( is_valid && $('#peloton__form--email').val() != '' && $('#peloton__form--password').val() != '' ) {
                        $('.peloton__form--button').removeAttr('disabled');
                    } else $('.peloton__form--button').attr('disabled', 'disabled');
                }
            }
            $(function(){
                $('#peloton__form--password, #peloton__form--email').unbind().bind('keyup', function(){
                    clearTimeout(peloton.timeout);
                    peloton.timeout = setTimeout(function(){
                        peloton.validate();
                    }, 200);
                });

                $('#peloton__form--aknowledge_authorization').unbind().bind('change', function(){
                    peloton.validate();
                });

                $('.modal-trigger').leanModal();

                if (window.Laravel.alerts) {
                    if (window.Laravel.alerts.success) {
                        Materialize.toast(window.Laravel.alerts.success, 6000, 'blue darken-1 white-text');
                    }

                    if (window.Laravel.alerts.error) {
                        Materialize.toast(window.Laravel.alerts.error, 6000, 'red darken-1 white-text');
                    }
                }
            });
        </script>
    </body>
</html>
