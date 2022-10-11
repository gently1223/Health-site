<?php

namespace App\Services\BeaconFarm;

use cURL;
use Exception;

use Illuminate\Support\Facades\Log;

class EmailNotification
{
    /**
     * Send slack notification
     *
     * @var string $template
     * @var string $email
     * @var string $name
     * @return void
     */
    public static function sendNotification($template, $email, $name)
    {
        if (config('mail.beaconfarm')) {
            try {
                //Content-Type: application/x-www-form-urlencoded
                cURL::newRequest('post', 'https://beaconfarm.co/send_email', [
                        'template_name' => $template,
                        'email'         => $email,
                        'name'          => $name,
                    ])
	                ->setHeader('Content-Type', 'application/x-www-form-urlencoded')
                    ->send();
            } catch (Exception $e) {
                Log::info('EMAIL_NOTIFICATION_ERROR['.$template.']: '.$email.' - '.$e->getMessage());
            }
        } else {
            Log::info('EMAIL_NOTIFICATION_SENT['.$template.']: '.$email.' - '.$name);
        }
    }
}
