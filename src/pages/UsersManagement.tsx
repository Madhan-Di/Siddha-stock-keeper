import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

interface LocalUser {
  _id: string;
  username: string;
  role: "admin" | "staff";
}

const UsersManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "staff" as "admin" | "staff" });
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username) {
      toast({ title: "Error", description: "Username required", variant: "destructive" });
      return;
    }
    
    try {
      if (editId) {
        // Update user (you'll need to add PUT endpoint in backend)
        setUsers((prev) => prev.map((u) => u._id === editId ? { ...u, username: form.username, role: form.role } : u));
        toast({ title: "Updated", description: "User updated" });
      } else {
        // Create new user
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, password: form.password, role: form.role })
        });
        
        if (res.ok) {
          await fetchUsers();
          toast({ title: "Created", description: "User created" });
        } else {
          toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save user", variant: "destructive" });
    }
    
    setForm({ username: "", password: "", role: "staff" });
    setEditId(null);
    setDialogOpen(false);
  };

  const handleEdit = (u: LocalUser) => {
    setForm({ username: u.username, password: "", role: u.role });
    setEditId(u._id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Admin only — manage system users</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditId(null); setForm({ username: "", password: "", role: "staff" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit User" : "Create User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password {editId ? "(leave empty to keep)" : "*"}</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    required={!editId}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v: "admin" | "staff") => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editId ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Username</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                          try {
                            const res = await fetch(`${API_URL}/users/${u._id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setUsers((prev) => prev.filter((x) => x._id !== u._id));
                              toast({ title: "Deleted", description: "User removed" });
                            }
                          } catch (error) {
                            toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
                          }
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;
