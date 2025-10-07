import { useEffect, useMemo, useState } from "react";
import { usersService } from "@/services/users.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type User = {
  uid: string;
  email?: string;
  displayName?: string;
  role: "admin" | "retail";
  createdAt?: string | null;
  lastLogin?: string | null;
  active?: boolean;
  permissions?: Record<string, any>;
};

const UserManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      const matchesQuery = !q || (u.email || "").toLowerCase().includes(q) || (u.displayName || "").toLowerCase().includes(q) || u.uid.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await usersService.list();
      setUsers(data as User[]);
    } catch (e: any) {
      toast({ title: "Failed to load users", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onCreate = async (form: { email: string; password?: string; displayName?: string; role?: "admin" | "retail"; }) => {
    setLoading(true);
    try {
      await usersService.create(form);
      toast({ title: "User created" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onUpdate = async (uid: string, updates: Partial<User>) => {
    setLoading(true);
    try {
      await usersService.update({ uid, ...updates });
      toast({ title: "User updated" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onDelete = async (uid: string) => {
    setLoading(true);
    try {
      await usersService.delete(uid);
      toast({ title: "User deleted" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onDeactivate = async (uid: string) => {
    setLoading(true);
    try {
      await usersService.deactivate(uid);
      toast({ title: "User deactivated" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onResetPassword = async (uid: string) => {
    setLoading(true);
    try {
      const { resetLink } = await usersService.resetPassword(uid);
      await navigator.clipboard.writeText(resetLink);
      toast({ title: "Password reset link copied", description: "Send to the user securely." });
    } catch (e: any) {
      toast({ title: "Could not generate reset link", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onRevokeSessions = async (uid: string) => {
    setLoading(true);
    try {
      await usersService.revokeSessions(uid);
      toast({ title: "Sessions revoked" });
    } catch (e: any) {
      toast({ title: "Failed to revoke sessions", description: e?.message || String(e), variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refresh()} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input id="new-email" placeholder="Email" />
          <Input id="new-password" placeholder="Password (optional)" type="password" />
          <Input id="new-name" placeholder="Display name (optional)" />
          <Select defaultValue="retail">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => {
            const email = (document.getElementById('new-email') as HTMLInputElement)?.value;
            const password = (document.getElementById('new-password') as HTMLInputElement)?.value;
            const displayName = (document.getElementById('new-name') as HTMLInputElement)?.value;
            const role = (document.querySelector('[data-state="open"] [data-radix-select-collection-item]') as HTMLElement)?.textContent?.toLowerCase() as 'admin' | 'retail' | undefined;
            if (!email) { toast({ title: 'Email is required', variant: 'destructive' }); return; }
            onCreate({ email, password: password || undefined, displayName: displayName || undefined, role: role || 'retail' });
          }}>Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.map(u => (
            <div key={u.uid} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.displayName || u.email || u.uid}</span>
                  <Badge variant="outline">{u.role}</Badge>
                  {u.active === false && <Badge variant="destructive">Inactive</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>{u.email}</span>
                  <span className="mx-2">•</span>
                  <span>UID: {u.uid}</span>
                  {u.lastLogin && (<><span className="mx-2">•</span><span>Last login: {new Date(u.lastLogin).toLocaleString()}</span></>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue={u.role} onValueChange={(role) => onUpdate(u.uid, { role: role as User["role"] })}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => onResetPassword(u.uid)}>Reset Password</Button>
                <Button variant="outline" onClick={() => onRevokeSessions(u.uid)}>Revoke Sessions</Button>
                {u.active === false ? (
                  <Button variant="secondary" onClick={() => onUpdate(u.uid, { active: true })}>Activate</Button>
                ) : (
                  <Button variant="secondary" onClick={() => onDeactivate(u.uid)}>Deactivate</Button>
                )}
                <Button variant="destructive" onClick={() => onDelete(u.uid)}>Delete</Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">No users found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;

