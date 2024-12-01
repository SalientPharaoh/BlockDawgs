import Hero from './components/hero';
import { WavyBackground } from './components/WavyBackgroun';
import { HeroScroll } from './components/hero-scroll';
import { FloatingNav } from './components/floating-navbar';
import { WorldMapDemo } from './components/MapComponent';
import { StickyScrollRevealDemo } from './components/FeatureScroll';


export default function Home() {
  return (
    <main className="relative">
      <Hero/>
      <FloatingNav />
      <HeroScroll />
      <StickyScrollRevealDemo />
      <WorldMapDemo />
      <WavyBackground />
    </main>
  );
}
