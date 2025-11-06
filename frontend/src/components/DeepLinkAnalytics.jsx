import React, { useState, useEffect } from 'react';
import { getDeepLinkAnalytics } from '../utils/deepLinkHandler';

const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";
const charcoalSoft = "#173A35";

export default function DeepLinkAnalytics({ isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const data = getDeepLinkAnalytics();
      setAnalytics(data);
    }
  }, [isOpen]);

  if (!isOpen || !analytics) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6"
        style={{ backgroundColor: charcoal, border: `2px solid ${mint}60` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: mint }}>
            📊 Deep Link Analytics
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}
          >
            <div className="text-xs text-white/60 mb-1">Total Clicks</div>
            <div className="text-2xl font-bold" style={{ color: mint }}>
              {analytics.total}
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}
          >
            <div className="text-xs text-white/60 mb-1">Curated Links</div>
            <div className="text-2xl font-bold" style={{ color: mint }}>
              {analytics.curated}
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: charcoalSoft, border: `1px solid ${coral}30` }}
          >
            <div className="text-xs text-white/60 mb-1">Fallbacks</div>
            <div className="text-2xl font-bold" style={{ color: coral }}>
              {analytics.fallback}
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: charcoalSoft, border: `1px solid ${mint}30` }}
          >
            <div className="text-xs text-white/60 mb-1">Success Rate</div>
            <div className="text-2xl font-bold" style={{ color: mint }}>
              {analytics.curatedPercentage}%
            </div>
          </div>
        </div>

        {/* By Platform */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3">Clicks by Platform</h3>
          <div className="space-y-2">
            {Object.entries(analytics.byPlatform).map(([platform, count]) => (
              <div 
                key={platform}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: charcoalSoft }}
              >
                <span className="text-white capitalize">{platform}</span>
                <span className="font-bold" style={{ color: mint }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clicks */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Recent Clicks</h3>
          <div className="space-y-2">
            {analytics.recentClicks.reverse().map((click, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg text-xs"
                style={{ backgroundColor: charcoalSoft }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white capitalize">{click.platform}</span>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px]"
                    style={{ 
                      backgroundColor: click.hasCuratedLink ? `${mint}20` : `${coral}20`,
                      color: click.hasCuratedLink ? mint : coral
                    }}
                  >
                    {click.hasCuratedLink ? '✅ Curated' : '⚠️ Fallback'}
                  </span>
                </div>
                <div className="text-white/50 text-[10px]">
                  {click.userPlatform} • {new Date(click.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div 
          className="mt-6 p-4 rounded-lg text-xs"
          style={{ backgroundColor: `${mint}10`, border: `1px solid ${mint}30` }}
        >
          <p className="text-white/80">
            <strong>Note:</strong> Curated links open directly to title pages. 
            Fallback links use search URLs. Data stored locally for testing.
          </p>
        </div>
      </div>
    </div>
  );
}
