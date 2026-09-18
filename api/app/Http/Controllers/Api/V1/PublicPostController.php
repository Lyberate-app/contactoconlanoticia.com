<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PublicPostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::published()->where('site_id', $request->site_id)->with(['author', 'category', 'cover']);

        if ($request->has('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->has('featured')) {
            $query->featured();
        }

        $posts = $query->orderBy('published_at', 'desc')->paginate($request->per_page ?? 15);
        return response()->json(['success' => true, 'data' => $posts]);
    }

    public function show(Request $request, $slug)
    {
        $post = Post::published()->where('site_id', $request->site_id)
            ->where('slug', $slug)
            ->with(['author', 'category', 'cover', 'tags'])
            ->firstOrFail();

        $post->increment('views_count');

        return response()->json(['success' => true, 'data' => $post]);
    }

    public function featured(Request $request)
    {
        $posts = Post::published()->where('site_id', $request->site_id)
            ->featured()
            ->with(['author', 'category', 'cover'])
            ->orderBy('published_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json(['success' => true, 'data' => $posts]);
    }

    public function breaking(Request $request)
    {
        $posts = Post::published()->where('site_id', $request->site_id)
            ->breaking()
            ->with(['author', 'category', 'cover'])
            ->orderBy('published_at', 'desc')
            ->limit(3)
            ->get();

        return response()->json(['success' => true, 'data' => $posts]);
    }
}
