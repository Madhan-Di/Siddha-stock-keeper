import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [defaultLimit, setDefaultLimit] = useState(10);
  const [autoBackup, setAutoBackup] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setDefaultLimit(data.defaultLowStockLimit || 10);
        setAutoBackup(data.autoBackup !== false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 4) {
      toast({ title: "Error", description: "Password too short (min 4 characters)", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/users/${user?._id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldPassword: passwords.old, 
          newPassword: passwords.new 
        })
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Password changed successfully" });
        setPasswords({ old: "", new: "", confirm: "" });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message || "Failed to change password", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          defaultLowStockLimit: defaultLimit,
          autoBackup 
        })
      });
      
      if (res.ok) {
        toast({ title: "Saved", description: "Settings updated successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input 
                    type={showOld ? "text" : "password"} 
                    value={passwords.old} 
                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input 
                    type={showNew ? "text" : "password"} 
                    value={passwords.new} 
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    type={showConfirm ? "text" : "password"} 
                    value={passwords.confirm} 
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full">Update Password</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">System Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Low Stock Limit</Label>
              <Input 
                type="number" 
                value={defaultLimit} 
                onChange={(e) => setDefaultLimit(parseInt(e.target.value) || 0)} 
                min="1"
              />
              <p className="text-xs text-muted-foreground">Applied to new medicines by default</p>
            </div>
            <Button onClick={handleSaveSettings} className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
