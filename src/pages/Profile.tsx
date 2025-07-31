import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword, deleteUser, updateProfile, sendEmailVerification } from "firebase/auth";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Trash2, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Edit3,
  Key,
  Settings,
  Activity,
  Database,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user && newUsername !== user.displayName) {
        await updateProfile(user, { displayName: newUsername });
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
          variant: "default",
        });
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, newPassword);
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
          variant: "default",
        });
        setNewPassword("");
        setIsChangingPassword(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        if (user) {
          await deleteUser(user);
          toast({
            title: "Account Deleted",
            description: "Your account has been deleted successfully.",
            variant: "default",
          });
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);
    try {
      if (user) {
        await sendEmailVerification(user);
        toast({
          title: "Verification Email Sent",
          description: "Please check your email and click the verification link.",
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Email Verification Banner for Email/Password Users */}
      {!user.emailVerified && user.providerData[0]?.providerId !== 'google.com' && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning mb-1">Email Verification Required</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your email address needs to be verified to access all features. Please check your inbox and click the verification link.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={verificationLoading}
                  className="bg-warning/20 text-warning hover:bg-warning/30 border-warning/30"
                >
                  {verificationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshUser}
                  className="text-xs"
                >
                  I've Verified My Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-primary" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{user.displayName || "No username set"}</p>
                    <p className="text-xs text-muted-foreground">Display Name</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {user.metadata.creationTime 
                      ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "Unknown"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {user.metadata.lastSignInTime 
                      ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "Unknown"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Last Sign In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Profile Form */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Edit3 className="h-5 w-5 text-primary" />
                Update Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Update your display name and account information.</p>
                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Display Name</label>
                    <Input
                      type="text"
                      placeholder="Enter your display name"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setNewUsername(user?.displayName || "");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Change Password Form */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Key className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Change your account password for enhanced security.</p>
                  <Button 
                    onClick={() => setIsChangingPassword(true)}
                    variant="outline"
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background/50"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || !newPassword} className="bg-primary hover:bg-primary/90">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verified</span>
                {user.emailVerified ? (
                  <Badge variant="default" className="bg-success/20 text-success border-success/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Unverified
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Type</span>
                <Badge variant="outline">
                  {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Activity</span>
                <span className="text-xs text-muted-foreground">
                  {user.metadata.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleTimeString()
                    : "Unknown"
                  }
                </span>
              </div>
              
              {/* Email Verification Section for Email/Password Users */}
              {!user.emailVerified && user.providerData[0]?.providerId !== 'google.com' && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warning mb-1">Email Verification Required</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Please verify your email address to access all features. Check your inbox for a verification link.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={verificationLoading}
                        className="text-xs h-8"
                      >
                        {verificationLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                            Sending...
                          </>
                        ) : (
                          "Resend Verification Email"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Strategies Created</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backtests Run</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Paper Trades</span>
                <span className="text-sm font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card/50 border-destructive/20 border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
} 