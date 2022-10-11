<?php

namespace App\Services;

use cURL;
use Exception;

use Illuminate\Support\Facades\Log;

class Slack
{
    /**
     * Slack Channels Webhooks
     *
     * @var array
     */
    public static $channelsWebhooks = [
        'provisioning' => 'https://hooks.slack.com/services/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',
    ];

    /**
     * Send slack notification
     *
     * @var string $channel
     * @var string $message
     * @return void
     */
    public static function sendCurlNotification($channel, $message)
    {
        if (env('APP_ENV') == 'production') {
            try {
                $url = isset(self::$channelsWebhooks[$channel]) ? self::$channelsWebhooks[$channel] : null;

                if ($url) {
                    cURL::jsonPost($url, [
                        'text' => $message,
                    ]);
                }
            } catch (Exception $e) {
                // No Exception notification required for now
            }
        } else {
            Log::info('SLACK_NOTIFICATION['.$channel.']: '.$message);
        }
    }
}
