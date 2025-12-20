import GooeyNavbar from "@/components/GooeyNavbar";
import GridScanBackground from "@/components/GridScanBackground";
import Hero from "@/components/Hero";
import SkinAnalyzer from "@/components/SkinAnalyzer";
import DoctorFinder from "@/components/DoctorFinder";
import Footer from "@/components/Footer";
import CustomerCare from "@/components/CustomerCare";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <GridScanBackground />
      <GooeyNavbar />
      
      <main className="relative z-10">
        <Hero />
        <SkinAnalyzer />
        <DoctorFinder />
      </main>
      
      <Footer />
      <CustomerCare />
    </div>
  );
};

export default Index;