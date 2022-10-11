<?php

Route::get('/concierge/connect/account/mywellness', 'ConnectController@mywellness');
Route::get('/concierge/connect/account/mywellness/success', 'ConnectController@mywellnessSuccess')->name('connect.account.mywellness.success');
Route::get('/concierge/connect/account/mywellness/error', 'ConnectController@mywellnessError')->name('connect.account.mywellness.error');
