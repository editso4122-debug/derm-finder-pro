import GooeyNavbar from '@/components/GooeyNavbar';
import MedicineReminder from '@/components/MedicineReminder';
import Footer from '@/components/Footer';

const MedicineReminderPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <GooeyNavbar />
      <MedicineReminder />
      <Footer />
    </div>
  );
};

export default MedicineReminderPage;
