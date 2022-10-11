<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class HomePageImages
{
    /**
     * list of images
     *
     * @var array
     */
    public static $images = ['1', '2', '3', '4', '5', '6', '7'];

    /**
     * list of "homepersons" images
     *
     * @var array
     */
    public static $persons = ['1', '2', '3', '4'];

    /**
     * Get login image
     *
     * @return array
     */
    public static function getLoginImage()
    {
        $currentState = Cache::get('currentDashboardImage');

        if (!$currentState) {
            Cache::put('currentDashboardImage', date('H').'-1');

            return '1';
        } else {
            $hour = date('H');

            $exploded = explode('-', $currentState);

            if ($exploded[0] == $hour) {
                return $exploded[1];
            } else {
                $next = (int) $exploded[1] + 1;

                if (!isset(self::$images[$next - 1])) {
                    $next = 1;
                }

                Cache::put('currentDashboardImage', date('H').'-'.$next);

                return (string) $next;
            }
        }
    }

    /**
     * Get "homeperson" image
     *
     * @return array
     */
    public static function getHomepersonImage()
    {
        $currentHomepersonsState = Cache::get('currentHomePerson');

        if (!$currentHomepersonsState) {
            Cache::put('currentHomePerson', date('H').'-1');

            return '1';
        } else {
            $hour = date('H');

            $exploded = explode('-', $currentHomepersonsState);

            if ($exploded[0] == $hour) {
                return $exploded[1];
            } else {
                $next = (int) $exploded[1] + 1;

                if (!isset(self::$persons[$next - 1])) {
                    $next = 1;
                }

                Cache::put('currentHomePerson', date('H').'-'.$next);

                return (string) $next;
            }
        }
    }
}
