import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword, deleteUser, updateProfile } from "firebase/auth";
import { User, Mail, Calendar, Shield, Trash2, Save, AlertTriangle } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (user && newUsername !== user.displayName) {
        await updateProfile(user, { displayName: newUsername });
        setSuccess("Profile updated successfully!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (user) {
        await updatePassword(user, newPassword);
        setSuccess("Password updated successfully!");
        setNewPassword("");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        if (user) {
          await deleteUser(user);
          setSuccess("Account deleted successfully!");
          onOpenChange(false);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card shadow-2xl border-none p-8 max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2 text-primary">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
                <Badge variant="secondary">Email</Badge>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.displayName || "No username set"}</span>
                <Badge variant="outline">Username</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Update Profile Form */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Update Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-background"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Change Password Form */}
          <Card className="bg-background/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Delete Account */}
          <Card className="bg-background/50 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {loading ? "Processing..." : "Delete Account"}
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          {error && (
            <div className="bg-danger/10 border border-danger text-danger text-sm rounded-md px-3 py-2 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success text-success text-sm rounded-md px-3 py-2 text-center">
              {success}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 