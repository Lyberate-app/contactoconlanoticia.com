<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::where('site_id', $request->site_id)
            ->with(['author', 'category'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $posts]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:500',
            'subtitle' => 'nullable|string|max:500',
            'slug' => 'nullable|string|max:500|unique:posts,slug',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'content_format' => 'in:html,tiptap_json',
            'author_id' => 'required|exists:users,id',
            'category_id' => 'nullable|exists:categories,id',
            'status' => 'in:draft,scheduled,published,archived'
        ]);

        $data['site_id'] = $request->site_id;
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);
        $data['created_by'] = $request->user()->id;

        $post = Post::create($data);

        return response()->json(['success' => true, 'data' => $post], 201);
    }

    public function show(Request $request, $id)
    {
        $post = Post::where('site_id', $request->site_id)->with(['author', 'category', 'tags'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $post]);
    }

    public function update(Request $request, $id)
    {
        $post = Post::where('site_id', $request->site_id)->findOrFail($id);

        $data = $request->validate([
            'title' => 'string|max:500',
            'content' => 'string',
            'status' => 'in:draft,scheduled,published,archived'
        ]);

        $data['updated_by'] = $request->user()->id;
        $post->update($data);

        return response()->json(['success' => true, 'data' => $post]);
    }

    public function destroy(Request $request, $id)
    {
        $post = Post::where('site_id', $request->site_id)->findOrFail($id);
        $post->delete();

        return response()->json(['success' => true, 'data' => null]);
    }
    
    public function publish(Request $request, $id)
    {
        $post = Post::where('site_id', $request->site_id)->findOrFail($id);
        $post->update(['status' => 'published', 'published_at' => now()]);
        return response()->json(['success' => true, 'data' => $post]);
    }
}
