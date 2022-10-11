<?php

namespace App\Helpers;

trait NumberHelper {

    public static function toKMFormat($number)
    {
        if ($number) {
            $formatted = $number;
            if ($number >= 1000 && $number < 1000000){
                $formatted = number_format($number/1000, 1).'K';
            } elseif ($number >= 1000000) {
                $formatted = number_format($number/1000000, 1).'M';
            }
            return $formatted;
        } else {
            return 0;
        }
    }

}
