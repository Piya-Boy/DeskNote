import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Preview from "@/components/Preview";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Preview />
      <DownloadSection />
      <Footer />
    </div>
  );
};

export default Index;
