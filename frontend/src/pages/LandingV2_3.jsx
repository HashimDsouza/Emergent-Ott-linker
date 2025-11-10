import React, { useState, useMemo } from "react";
import "../styles/gradients.css";
import { mapApiToCard } from "../utils/mapApiToCard";
import HeroFrontCenter from "../components/HeroFrontCenter";
import Tray from "../components/Tray";
import DetailsModal from "../components/DetailsModal";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";

export default function LandingV2_3({ apiData }) {
  const cards = useMemo(() => (apiData?.items || []).map(mapApiToCard), [apiData]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const onInfo = (item) => { setModalItem(item); setModalOpen(true); };

  // Sports tiles for Game On tray - Using working TheSportsDB images via proxy
  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
  const sportsCards = useMemo(() => [
    {
      id: 'sport-1',
      title: "ICC Women's World Cup 2025 Final",
      platform: 'Jiohotstar',
      thumbnail: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/team/badge/ytwwqt1467982667.png')}`,
      posterUrl: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/team/badge/ytwwqt1467982667.png')}`,
      description: "Women's Cricket World Cup Final - Live coverage",
      category: 'Cricket',
      imdb: 'LIVE',
      descriptor: 'Live now',
      genres: ['Cricket', 'Women\'s World Cup', 'Final'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=ICC+Women+World+Cup+2025',
        twitter: 'https://twitter.com/search?q=%23WWC2025',
        reddit: 'https://www.reddit.com/r/Cricket'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=ICC+Women+World+Cup+2025',
        x: 'https://twitter.com/search?q=%23WWC2025',
        reddit: 'https://www.reddit.com/r/Cricket'
      }
    },
    {
      id: 'sport-2',
      title: "Manchester United vs Nottingham Forest",
      platform: 'Jiohotstar',
      thumbnail: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png')}`,
      posterUrl: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png')}`,
      description: "Premier League - Live Match",
      category: 'Football',
      imdb: 'LIVE',
      descriptor: 'Premier League action',
      genres: ['Football', 'Premier League', 'Live'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=Manchester+United+vs+Nottingham+Forest',
        twitter: 'https://twitter.com/search?q=%23MUNNFO',
        reddit: 'https://www.reddit.com/r/soccer'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=Manchester+United+vs+Nottingham+Forest',
        x: 'https://twitter.com/search?q=%23MUNNFO',
        reddit: 'https://www.reddit.com/r/soccer'
      }
    },
    {
      id: 'sport-3',
      title: "UEFA Champions League",
      platform: 'Sony Liv',
      thumbnail: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/8zf5o51612459207.png')}`,
      posterUrl: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/8zf5o51612459207.png')}`,
      description: "UEFA Champions League - Today's Matches",
      category: 'Football',
      imdb: '⚽',
      descriptor: 'Europe elite football',
      genres: ['Football', 'Champions League', 'Europe'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=UEFA+Champions+League',
        twitter: 'https://twitter.com/search?q=%23UCL',
        reddit: 'https://www.reddit.com/r/soccer'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=UEFA+Champions+League',
        x: 'https://twitter.com/search?q=%23UCL',
        reddit: 'https://www.reddit.com/r/soccer'
      }
    },
    {
      id: 'sport-4',
      title: "F1 Bahrain Grand Prix",
      platform: 'Fancode',
      thumbnail: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/0l9xim1687870352.png')}`,
      posterUrl: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/0l9xim1687870352.png')}`,
      description: "Formula 1 Bahrain Grand Prix - Season opener",
      category: 'F1',
      imdb: '🏁',
      descriptor: 'Speed and precision',
      genres: ['F1', 'Racing', 'Grand Prix'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=F1+Bahrain+Grand+Prix',
        twitter: 'https://twitter.com/search?q=%23BahrainGP',
        reddit: 'https://www.reddit.com/r/formula1'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=F1+Bahrain+Grand+Prix',
        x: 'https://twitter.com/search?q=%23BahrainGP',
        reddit: 'https://www.reddit.com/r/formula1'
      }
    },
    {
      id: 'sport-5',
      title: "US Open Tennis 2025",
      platform: 'Jiohotstar',
      thumbnail: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/mh9dem1720641230.png')}`,
      posterUrl: `${backendUrl}/api/thesportsdb/proxy-image?image_url=${encodeURIComponent('https://r2.thesportsdb.com/images/media/league/badge/mh9dem1720641230.png')}`,
      description: "US Open Tennis Championship - Grand Slam action",
      category: 'Tennis',
      imdb: '🎾',
      descriptor: 'Grand slam showdown',
      genres: ['Tennis', 'US Open', 'Grand Slam'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=US+Open+Tennis+2025',
        twitter: 'https://twitter.com/search?q=%23USOpen',
        reddit: 'https://www.reddit.com/r/tennis'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=US+Open+Tennis+2025',
        x: 'https://twitter.com/search?q=%23USOpen',
        reddit: 'https://www.reddit.com/r/tennis'
      }
    },
    {
      id: 'sport-6',
      title: "Serie A Football",
      platform: 'Dazn',
      thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="900"%3E%3Crect fill="%23173A35" width="600" height="900"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23FF4F64" font-size="40" font-family="Arial"%3ESerie A%3C/text%3E%3C/svg%3E',
      posterUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="900"%3E%3Crect fill="%23173A35" width="600" height="900"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23FF4F64" font-size="40" font-family="Arial"%3ESerie A%3C/text%3E%3C/svg%3E',
      description: "Serie A - Italian Football elite league",
      category: 'Football',
      imdb: '⚽',
      descriptor: 'Italian football passion',
      genres: ['Football', 'Serie A', 'Italy'],
      social_links: {
        youtube: 'https://www.youtube.com/results?search_query=Serie+A',
        twitter: 'https://twitter.com/search?q=%23SerieA',
        reddit: 'https://www.reddit.com/r/soccer'
      },
      buzz: {
        yt: 'https://www.youtube.com/results?search_query=Serie+A',
        x: 'https://twitter.com/search?q=%23SerieA',
        reddit: 'https://www.reddit.com/r/soccer'
      }
    }
  ], [backendUrl]);

  return (
    <div className="min-h-screen pb-20 md:pb-24 landing-v23-bg text-white">
      {/* Header */}
      <ConnectorHeader />
      
      {/* Main Content */}
      <div className="px-3 md:px-6 pt-4 md:pt-6">
        <div className="max-w-7xl mx-auto">
        <HeroFrontCenter onInfo={onInfo} />

        <Tray
          icon="🔥"
          title="Buzzing Now"
          subline="The internet’s current obsession"
          items={cards.slice(0,6)}
          onInfo={onInfo}
        />
        <Tray
          icon="👀"
          title="Your Must Watch Today"
          subline="Editor’s picks you can’t skip"
          items={cards.slice(6,12)}
          onInfo={onInfo}
        />
        <Tray
          icon="🏆"
          title="Game On"
          subline="Matches, highlights, and scores"
          items={sportsCards}
          onInfo={onInfo}
        />

        <DetailsModal open={modalOpen} onClose={() => setModalOpen(false)} item={modalItem} />
        </div>
      </div>
      
      {/* Footer */}
      <ConnectorFooter />
    </div>
  );
}