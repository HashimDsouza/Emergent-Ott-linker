import React, { useState } from "react";
import ContentCard from "@/components/ContentCard";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CategorySection = ({ title, emoji, description, content, allContent, categoryKey, currentUser, onContentClick, onRefreshUser }) => {
  const [showModal, setShowModal] = useState(false);

  if (!content || content.length === 0) return null;

  return (
    <section className="fade-in mb-8" data-testid={`category-section-${categoryKey}`}>
      {/* Section Header - Inline with See More */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h2>
        </div>
        {allContent && allContent.length > 6 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-[#ff6b35] hover:text-[#ff8555] transition-colors text-sm font-semibold"
            data-testid={`see-more-${categoryKey}`}
          >
            <span>See more</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Grid - 3 columns, 2 rows */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {content.map((item) => (
          <ContentCard 
            key={item.id} 
            content={item} 
            currentUser={currentUser} 
            onContentClick={onContentClick}
            compact={true}
          />
        ))}
      </div>

      {/* Modal for All Content */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-[#0a0a0f] border border-white/10" data-testid={`modal-${categoryKey}`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span>{emoji}</span>
              <span className="gradient-text">All {title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {allContent.map((item) => (
              <ContentCard 
                key={item.id} 
                content={item} 
                currentUser={currentUser} 
                onContentClick={onContentClick}
                compact={false}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CategorySection;