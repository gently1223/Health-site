<?php

return [
    'public_key'        => env('STRIPE_PUBLIC_KEY', ''),
    'secret_key'        => env('STRIPE_SECRET_KEY', ''),
    'connect_cilent_id' => env('STRIPE_CONNECT_CLIENT_ID', ''),
];
