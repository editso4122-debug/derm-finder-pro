import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bell, Plus, Trash2, Send, Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Reminder {
  id: string;
  medicine_name: string;
  note: string | null;
  reminder_time: string;
  is_active: boolean;
  email: string;
}

const MedicineReminder = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  
  const [medicineName, setMedicineName] = useState('');
  const [note, setNote] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState(''); // Email used to fetch reminders

  // Fetch reminders when user enters their email
  const fetchReminders = async (emailToFetch: string) => {
    if (!emailToFetch) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicine_reminders')
        .select('*')
        .eq('email', emailToFetch)
        .order('reminder_time', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async () => {
    if (!medicineName || !reminderTime || !email) {
      toast({
        title: "Missing fields",
        description: "Please fill in medicine name, time, and email",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('medicine_reminders')
        .insert({
          user_id: null,
          medicine_name: medicineName,
          note: note || null,
          reminder_time: reminderTime,
          email: email,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Reminder added",
        description: `Reminder for ${medicineName} set at ${reminderTime}`,
      });

      setMedicineName('');
      setNote('');
      setReminderTime('');
      setUserEmail(email);
      fetchReminders(email);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medicine_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReminders(reminders.filter(r => r.id !== id));
      toast({
        title: "Reminder deleted",
        description: "The reminder has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('medicine_reminders')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      setReminders(reminders.map(r => 
        r.id === id ? { ...r, is_active: isActive } : r
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendReminderEmail = async (reminder: Reminder) => {
    setSendingTest(reminder.id);
    try {
      const response = await supabase.functions.invoke('send-medicine-reminder', {
        body: {
          email: reminder.email,
          medicineName: reminder.medicine_name,
          note: reminder.note || '',
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Reminder sent!",
        description: `Email sent to ${reminder.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTest(null);
    }
  };


  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medicine Reminders</h1>
              <p className="text-muted-foreground">Never miss your medication again</p>
            </div>
          </div>
        </motion.div>

        {/* Add New Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Reminder
              </CardTitle>
              <CardDescription>
                Set up a reminder and receive an email at the scheduled time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medicine">Medicine Name</Label>
                  <Input
                    id="medicine"
                    placeholder="e.g., Vitamin D"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Reminder Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="e.g., Take with food"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-none"
                    rows={1}
                  />
                </div>
              </div>
              <Button
                onClick={addReminder}
                disabled={saving}
                className="mt-4 w-full md:w-auto"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reminders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Your Reminders
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reminders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BellRing className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reminders yet. Add your first reminder above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {reminders.map((reminder, index) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`transition-all ${!reminder.is_active ? 'opacity-60' : ''}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{reminder.medicine_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {reminder.reminder_time.slice(0, 5)} • {reminder.email}
                              </p>
                              {reminder.note && (
                                <p className="text-sm text-muted-foreground italic mt-1">
                                  {reminder.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendReminderEmail(reminder)}
                              disabled={sendingTest === reminder.id}
                            >
                              {sendingTest === reminder.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              <span className="ml-2 hidden sm:inline">Test</span>
                            </Button>
                            <Switch
                              checked={reminder.is_active}
                              onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteReminder(reminder.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground text-center mt-8"
        >
          💡 Tip: Click "Test" to send a reminder email immediately. Keep this page open for automatic reminders.
        </motion.p>
      </div>
    </div>
  );
};

export default MedicineReminder;
