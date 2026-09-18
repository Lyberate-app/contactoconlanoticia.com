<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'site_id', 'name', 'email', 'password', 'role', 'avatar_media_id',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function site() { return $this->belongsTo(Site::class); }
    public function avatar() { return $this->belongsTo(Media::class, 'avatar_media_id'); }
    public function posts() { return $this->hasMany(Post::class, 'author_id'); }
}
