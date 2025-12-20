import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MedicineScanner from "@/components/MedicineScanner";
import GridScanBackground from "@/components/GridScanBackground";

const MedicineScannerPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GridScanBackground />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <MedicineScanner />
      </div>
    </div>
  );
};

export default MedicineScannerPage;
