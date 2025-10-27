import React, { useState } from "react";
import ContentCard from "@/components/ContentCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";

const CategorySection = ({ title, emoji, description, content, allContent, categoryKey }) => {
  const [showModal, setShowModal] = useState(false);

  if (!content || content.length === 0) return null;

  return (
    <section className="fade-in" data-testid={`category-section-${categoryKey}`}>
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{emoji}</span>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h2>
        </div>
        <p className="text-base text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          {description}
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {content.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>

      {/* See More Button */}
      {allContent && allContent.length > 6 && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#ff6b35] to-[#ffa500] hover:from-[#ff8555] hover:to-[#ffb833] text-white font-semibold px-8 py-6 rounded-full transition-all duration-300 btn-glow"
            data-testid={`see-more-${categoryKey}`}
          >
            <span>See more in {title}</span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Modal for All Content */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-[#0a0a0f] border border-white/10" data-testid={`modal-${categoryKey}`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span>{emoji}</span>
              <span className="gradient-text">All {title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {allContent.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CategorySection;