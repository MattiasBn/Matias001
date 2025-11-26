<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
      protected $fillable = [
        'user_id', 'theme', 'font_size', 'timezone', 'language',
        'email_notifications', 'push_notifications'
    ];
}
