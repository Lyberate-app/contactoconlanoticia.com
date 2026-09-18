<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Site;
use App\Models\User;
use App\Models\Category;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $site = Site::create([
            'name' => 'Localhost',
            'domain' => 'localhost',
            'is_active' => true,
        ]);

        User::create([
            'site_id' => $site->id,
            'name' => 'Super Admin',
            'email' => 'admin@portal.local',
            'password' => Hash::make('changeme123'),
            'role' => 'superadmin',
            'email_verified_at' => now(),
        ]);

        $categories = ['Nacionales', 'Internacionales', 'Economía', 'Deportes', 'Tecnología'];

        foreach ($categories as $index => $cat) {
            Category::create([
                'site_id' => $site->id,
                'name' => $cat,
                'slug' => Str::slug($cat),
                'sort_order' => $index,
            ]);
        }
    }
}
