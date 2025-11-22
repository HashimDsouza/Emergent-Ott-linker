import React, { useState, useEffect } from "react";

const FeedAdmin = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    source_url: "",
    category: "entertainment",
    is_hero: false,
    priority: 5,
    linked_content_id: "",
    source_type: "",
    entity_type: "",
    tags: []
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchFeedItems();
  }, []);

  const fetchFeedItems = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/feed?limit=100`);
      if (response.ok) {
        const items = await response.json();
        setFeedItems(items);
      }
    } catch (error) {
      console.error("Error fetching feed items:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      
      // Prepare data
      const submitData = { ...formData };
      if (!submitData.linked_content_id) delete submitData.linked_content_id;
      if (!submitData.source_type) delete submitData.source_type;
      if (!submitData.entity_type) delete submitData.entity_type;
      
      const url = editingId 
        ? `${backendUrl}/api/feed/${editingId}` 
        : `${backendUrl}/api/feed`;
      
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        setMessage(editingId ? "✅ Feed item updated!" : "✅ Feed item created!");
        resetForm();
        fetchFeedItems();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.detail || "Failed to save"}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description,
      image_url: item.image_url,
      source_url: item.source_url,
      category: item.category,
      is_hero: item.is_hero,
      priority: item.priority,
      linked_content_id: item.linked_content_id || "",
      source_type: item.source_type || "",
      entity_type: item.entity_type || "",
      tags: item.tags || []
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this feed item?")) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://viewflow-enhance.preview.emergentagent.com";
      const response = await fetch(`${backendUrl}/api/feed/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setMessage("✅ Feed item deleted!");
        fetchFeedItems();
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      source_url: "",
      category: "entertainment",
      is_hero: false,
      priority: 5,
      linked_content_id: "",
      source_type: "",
      entity_type: "",
      tags: []
    });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#FF6B9D] to-[#C8E6C9] bg-clip-text text-transparent">
          Get With It - Admin Panel
        </h1>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-white/10 border border-white/20">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Feed Item" : "Add New Feed Item"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
                placeholder="e.g., Stree 3 Trailer Drops Tomorrow!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
              >
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="ott">OTT</option>
                <option value="local">Local</option>
                <option value="music">Music</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
              rows="2"
              placeholder="Brief description (1 line)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Image URL *</label>
              <input
                type="url"
                required
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
                placeholder="https://..."
              />
              {formData.image_url && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Source URL *</label>
              <input
                type="url"
                required
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
                placeholder="https://..."
              />
              {formData.source_url && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 text-xs">
                  <span className="text-gray-400">Domain: </span>
                  <span className="text-[#C8E6C9]">
                    {formData.source_url.split('/')[2] || 'Invalid URL'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Badge</label>
              <select
                value={formData.tags[0] || ""}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value ? [e.target.value] : [] })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
              >
                <option value="">None</option>
                <option value="OFFICIAL">OFFICIAL</option>
                <option value="TRENDING">TRENDING</option>
                <option value="NEW SEASON">NEW SEASON</option>
                <option value="TRAILER">TRAILER</option>
                <option value="HIGHLIGHT">HIGHLIGHT</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_hero}
                  onChange={(e) => setFormData({ ...formData, is_hero: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Set as Hero</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Linked Content ID (Optional)</label>
            <input
              type="text"
              value={formData.linked_content_id}
              onChange={(e) => setFormData({ ...formData, linked_content_id: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-[#FF6B9D]"
              placeholder="Enter content ID from catalog to link"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-[#FF6B9D] rounded-lg hover:bg-[#ff5589] transition-colors font-medium"
            >
              {editingId ? "Update Item" : "Add Item"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Feed Items List */}
        <div>
          <h2 className="text-xl font-bold mb-4">Current Feed Items ({feedItems.length})</h2>
          <div className="space-y-3">
            {feedItems.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-4 flex gap-4">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold line-clamp-1">{item.title}</h3>
                    {item.is_hero && (
                      <span className="px-2 py-1 bg-[#FF6B9D] text-xs rounded-full whitespace-nowrap">
                        HERO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-white/10 rounded">{item.category}</span>
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm hover:bg-blue-500/30"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedAdmin;
