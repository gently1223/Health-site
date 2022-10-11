<?php

namespace App\Helpers;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

trait ImageHelper {

    public static function exists($storagePath)
    {
        return Storage::exists($storagePath);
    }

    public static function isTempStorageImage($storagePath)
    {
        if (Storage::exists($storagePath) && stripos($storagePath, '/temp') >= 0) {
            $pathinfo = pathinfo(storage_path('app/'.$storagePath));

            if (isset($pathinfo['extension']) && in_array($pathinfo['extension'], ['jpeg', 'jpg', 'png'])) {
                return true;
            }
        }

        return false;
    }

    public static function moveStorageToPublic($storagePath, $publicPath)
    {
        $pathinfo = pathinfo(storage_path('app/'.$storagePath));

        $folders = str_replace('/'.$pathinfo['basename'], '', $publicPath);

        Storage::disk('public')->makeDirectory($folders);

        File::move(storage_path('app/'.$storagePath), Storage::disk('public')->path($publicPath));
    }

}
