import { Hero } from "@/components/Hero";
import { TokenComparison } from "@/components/TokenComparison";
import { Features } from "@/components/Features";
import { SyntaxPreview } from "@/components/SyntaxPreview";
import { AgentShowcase } from "@/components/AgentShowcase";
import { FullStack } from "@/components/FullStack";
import { StdlibGrid } from "@/components/StdlibGrid";
import { Stats } from "@/components/Stats";
import { GetStarted } from "@/components/GetStarted";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 mesh-gradient pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <TokenComparison />
        <Features />
        <SyntaxPreview />
        <AgentShowcase />
        <FullStack />
        <StdlibGrid />
        <Stats />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
