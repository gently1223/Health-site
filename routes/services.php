<?php

Route::get('/oauth/mywellness', 'MemberDashboardController@saveMemberMyWellnessToken')->name('member.device.mywellness.save');

Route::group(['prefix' => 'member', 'middleware' => 'role:root|club_enterprise|club_admin|club_employee|member'], function () {

    Route::group(['prefix' => '{id}/devices', 'middleware' => 'role:club_admin|club_employee|club_enterprise|root'], function () {
        Route::get('/mywellness/oauth', 'MemberDashboardController@redirectToMyWellness')->name('member.device.mywellness.oauth');
        Route::get('/mywellness/revoke', 'MemberDashboardController@revokeMyWellnessAccess')->name('member.device.mywellness.revoke');
    });
});
