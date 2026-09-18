<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            
            $table->string('title', 500);
            $table->string('subtitle', 500)->nullable();
            $table->string('slug', 500);
            $table->text('excerpt')->nullable();
            
            $table->longText('content');
            $table->enum('content_format', ['html', 'tiptap_json'])->default('tiptap_json');
            
            $table->enum('status', ['draft', 'scheduled', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_breaking')->default(false);
            $table->boolean('allow_comments')->default(true);
            
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->string('seo_canonical', 500)->nullable();
            $table->string('og_title', 255)->nullable();
            $table->text('og_description')->nullable();
            $table->foreignId('og_image_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('seo_no_index')->default(false);
            $table->enum('schema_type', ['Article', 'NewsArticle', 'BlogPosting'])->default('NewsArticle');
            
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedTinyInteger('reading_time_minutes')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('legacy_source', 50)->nullable();
            $table->string('legacy_id', 100)->nullable();
            $table->string('legacy_url', 1000)->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['site_id', 'slug']);
            $table->index(['site_id', 'status', 'published_at']);
            $table->index(['legacy_source', 'legacy_id']);
        });

        // Add fulltext index separately if needed or handle it in a way that works with the DB
        // MySQL 5.7+ supports fulltext on InnoDB
        DB::statement('ALTER TABLE posts ADD FULLTEXT idx_posts_title_excerpt (title, excerpt)');
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
