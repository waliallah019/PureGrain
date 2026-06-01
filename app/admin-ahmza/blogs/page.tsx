"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { IBlog } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Pencil, PlusCircle, Save, Trash2, UploadCloud } from "lucide-react";

const TinyEditor = dynamic(async () => (await import("@tinymce/tinymce-react")).Editor, {
  ssr: false,
});

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  status: "draft" | "published";
  authorName: string;
  seoTitle: string;
  seoDescription: string;
}

const initialFormState: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  status: "draft",
  authorName: "Pure Grain Team",
  seoTitle: "",
  seoDescription: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState<IBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [form, setForm] = useState<BlogFormState>(initialFormState);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const statusOk = statusFilter === "all" ? true : post.status === statusFilter;
      const search = query.trim().toLowerCase();
      const searchOk =
        search.length === 0 ||
        post.title.toLowerCase().includes(search) ||
        post.slug.toLowerCase().includes(search);
      return statusOk && searchOk;
    });
  }, [posts, query, statusFilter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/blogs?includeDraft=true&limit=100&page=1&sortBy=updatedAt&order=desc");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load blog posts.");
      }

      setPosts(result.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    setEditorReady(true);
  }, []);

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const startCreate = () => {
    resetForm();
  };

  const startEdit = (post: IBlog) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || "",
      tags: post.tags.join(", "),
      status: post.status,
      authorName: post.authorName,
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
    });
  };

  const handleAutoSlug = () => {
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
  };

  const uploadCoverImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/blogs/upload-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.location) {
      throw new Error(result.message || "Cover image upload failed.");
    }

    return result.location as string;
  };

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Uploading cover image...", { id: "cover-upload" });
      const imageUrl = await uploadCoverImage(file);
      setForm((prev) => ({ ...prev, coverImage: imageUrl }));
      toast.success("Cover image uploaded.", { id: "cover-upload" });
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image.", { id: "cover-upload" });
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required.");
      return;
    }
    if (!form.excerpt.trim()) {
      toast.error("Excerpt is required.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Content is required.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      publishedAt: form.status === "published" ? new Date().toISOString() : undefined,
    };

    try {
      const endpoint = editingId ? `/api/blogs/${editingId}` : "/api/blogs";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save blog post.");
      }

      toast.success(editingId ? "Blog post updated." : "Blog post created.");
      resetForm();
      await loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this blog post? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete blog post.");
      }

      toast.success("Blog post deleted.");
      if (editingId === id) resetForm();
      await loadPosts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete blog post.");
    }
  };

  return (
    <div className="p-4 lg:p-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>{editingId ? "Edit Blog Post" : "Create Blog Post"}</CardTitle>
          <CardDescription>
            Write SEO-friendly blog content with rich formatting and publish when ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="How to Choose Leather Hides for Export Orders"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="how-to-choose-leather-hides"
                />
                <Button type="button" variant="outline" onClick={handleAutoSlug}>
                  Auto
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Add a concise summary that appears on blog cards and search previews."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorName">Author Name</Label>
              <Input
                id="authorName"
                value={form.authorName}
                onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: "draft" | "published") => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="wholesale, sourcing, leather hides"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={form.coverImage}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverUpload">Upload Cover Image</Label>
              <label
                htmlFor="coverUpload"
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm cursor-pointer hover:bg-accent"
              >
                <UploadCloud className="h-4 w-4" />
                Select Image
              </label>
              <input id="coverUpload" type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={form.seoTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="Optional (max 70 chars)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              rows={2}
              value={form.seoDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="Optional (max 160 chars)"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            {editorReady ? (
              <TinyEditor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={form.content}
                onEditorChange={(value: string) => setForm((prev) => ({ ...prev, content: value }))}
                init={{
                  height: 420,
                  menubar: true,
                  plugins:
                    "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
                  toolbar:
                    "undo redo | styles | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image table | removeformat",
                  images_upload_handler: async (blobInfo: any) => {
                    const formData = new FormData();
                    formData.append("file", blobInfo.blob(), blobInfo.filename());

                    const response = await fetch("/api/blogs/upload-image", {
                      method: "POST",
                      body: formData,
                    });
                    const result = await response.json();

                    if (!response.ok || !result.location) {
                      throw new Error(result.message || "Image upload failed.");
                    }

                    return result.location;
                  },
                }}
              />
            ) : (
              <div className="h-[420px] rounded-md border border-border bg-muted/20" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Update Post" : "Create Post"}
            </Button>
            <Button type="button" variant="outline" onClick={startCreate}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>Search, filter, edit, and delete blog entries.</CardDescription>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Input
              placeholder="Search title or slug"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={(value: "all" | "draft" | "published") => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[calc(100vh-220px)] overflow-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blog posts found for this filter.</p>
          ) : (
            filteredPosts.map((post) => (
              <div key={post._id} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">/{post.slug}</p>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </span>
                  <span>{post.readingTimeMinutes} min read</span>
                </div>

                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(post)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(post._id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
