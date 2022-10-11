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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
    </head>
    <body>
        <div class="content">
            <div class="row">
                <div class="col s10 m8 offset-m2 offset-s1">
                    @if ($errors->any())
                    <ul class="red-text">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                    @endif
                    <form method="POST" action="{{ route('waitlist.save') }}">
                        @csrf
                        <h4>Main information</h4>
                        <div class="input-field">
                            <input type="text" name="legal_business_entity" id="legal_business_entity">
                            <label for="legal_business_entity">Legal Business Entity</label>
                        </div>
                        <div class="input-field">
                            <input type="text" name="name_of_crossfit_affiliate" id="name_of_crossfit_affiliate">
                            <label for="name_of_crossfit_affiliate">Name of CrossFit Affiliate</label>
                        </div>
                        <div class="input-field">
                            <input type="text" name="address_of_location" id="address_of_location">
                            <label for="address_of_location">Address of Location</label>
                        </div>
                        <h5>Retail Membership Rate for your standard membership offering</h5>
                        <div class="input-field">
                            <input type="text" name="retail_membership_rate" id="retail_membership_rate">
                            <label for="retail_membership_rate">Retail Membership Rate</label>
                        </div>
                        <h4>Person who signing the Contract</h4>
                        <div class="input-field">
                            <input type="text" name="contractor_first_name" id="contractor_first_name">
                            <label for="contractor_first_name">First Name</label>
                        </div>
                        <div class="input-field">
                            <input type="text" name="contractor_last_name" id="contractor_last_name">
                            <label for="contractor_last_name">Last Name</label>
                        </div>
                        <div class="input-field">
                            <input type="email" name="contractor_email" id="contractor_email">
                            <label for="contractor_email">Email</label>
                        </div>
                        <h4>Direct point of Contact if different from the signee</h4>
                        <div class="input-field">
                            <input type="text" name="direct_point_first_name" id="direct_point_first_name">
                            <label for="direct_point_first_name">First Name</label>
                        </div>
                        <div class="input-field">
                            <input type="text" name="direct_point_last_name" id="direct_point_last_name">
                            <label for="direct_point_last_name">Last Name</label>
                        </div>
                        <div class="input-field">
                            <input type="email" name="direct_point_email" id="direct_point_email">
                            <label for="direct_point_email">Email</label>
                        </div>

                        <button type="submit" class="btn">Join</button>
                    </form>
                </div>
            </div>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
    </body>
</html>
