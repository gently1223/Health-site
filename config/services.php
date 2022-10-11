<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google_maps' => [
        'geocode_key' => env('GOOGLE_MAPS_GEOCODE_KEY', 'AIzaSyDboeuOSWLj-JMv5xse26DSxRb_8Xb7RI4'),
    ],

    'mywellness' => [
        'dev'           => env('MYWELLNESS_DEV', false),
        'client_id'     => env('MYWELLNESS_CLIENT_ID', null),
        'client_secret' => env('MYWELLNESS_CLIENT_SECRET', null),
        'redirect_uri'  => env('MYWELLNESS_REDIRECT_URI', null),
    ],

];
