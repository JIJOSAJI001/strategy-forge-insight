import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, updatePassword, deleteUser, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";

export const AuthDialog: React.FC<{ trigger: React.ReactNode }> = ({ trigger }) => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const { user, login, loginWithGoogle } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      // Login function handles role-based redirect automatically
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      
      // Send email verification for email/password users
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      setSettingsSuccess("Account created successfully! Please check your email to verify your account.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email, {
        url: "https://microproject2-7ac7e.firebaseapp.com/__/auth/action?mode=action&oobCode=code"
      });
      setForgotPasswordSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // Google login function handles role-based redirect automatically
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      if (user) {
        await updatePassword(user, newPassword);
        setSettingsSuccess("Password updated successfully.");
        setNewPassword("");
      }
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      if (user) {
        await deleteUser(user);
        setSettingsSuccess("Account deleted successfully.");
      }
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-card shadow-2xl border-none p-8 max-w-md rounded-2xl">
        <DialogHeader>
          <h2 className="text-2xl font-bold text-center mb-2 text-primary">
            {showForgotPassword ? "Reset your password" : 
             tab === "login" ? "Sign in to your account" : 
             "Create your account"}
          </h2>
          <p className="text-muted-foreground text-center mb-4">
            {showForgotPassword ? "Enter your email to receive a password reset link" : "Access all features with your account"}
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-2 mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground font-semibold py-2 text-base shadow-sm"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FcGoogle className="w-5 h-5" />
            {loading ? "Loading..." : "Continue with Google"}
          </Button>
        </div>
        <div className="relative flex items-center mb-6">
          <span className="flex-grow border-t border-border"></span>
          <span className="mx-4 text-xs text-muted-foreground">or</span>
          <span className="flex-grow border-t border-border"></span>
        </div>
        
        {showForgotPassword ? (
          <div className="space-y-4">
            {forgotPasswordSent ? (
              <div className="space-y-4 text-center">
                <div className="bg-success/10 border border-success/20 text-success text-sm rounded-md px-4 py-3">
                  <h3 className="font-semibold mb-1">Reset Email Sent!</h3>
                  <p className="text-xs">Please check your email and follow the link to reset your password.</p>
                </div>
                <Button 
                  onClick={() => {
                    setForgotPasswordSent(false);
                    setShowForgotPassword(false);
                    setTab("login");
                  }}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background" />
                {error && <div className="bg-danger/10 border border-danger text-danger text-sm rounded-md px-3 py-2 text-center animate-pulse">{error}</div>}
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200" disabled={loading}>{loading ? "Sending..." : "Send Reset Email"}</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </form>
            )}
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted rounded-lg p-1">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background" />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background" />
                {error && <div className="bg-danger/10 border border-danger text-danger text-sm rounded-md px-3 py-2 text-center animate-pulse">{error}</div>}
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              {verificationSent ? (
                <div className="space-y-4 text-center">
                  <div className="bg-success/10 border border-success/20 text-success text-sm rounded-md px-4 py-3">
                    <h3 className="font-semibold mb-1">Account Created Successfully!</h3>
                    <p className="text-xs">Please check your email and click the verification link to complete your registration.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setVerificationSent(false);
                      setTab("login");
                    }}
                    className="w-full"
                  >
                    Continue to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="bg-background" />
                  <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background" />
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background" />
                  <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="bg-background" />
                  {error && <div className="bg-danger/10 border border-danger text-danger text-sm rounded-md px-3 py-2 text-center animate-pulse">{error}</div>}
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        )}
        {user && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-semibold mb-4 text-primary">Account Settings</h3>
            <form onSubmit={handleChangePassword} className="space-y-3 mb-4">
              <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="bg-background" />
              <Button type="submit" className="w-full" disabled={settingsLoading}>{settingsLoading ? "Updating..." : "Change Password"}</Button>
            </form>
            <Button type="button" variant="destructive" className="w-full" onClick={handleDeleteAccount} disabled={settingsLoading}>
              {settingsLoading ? "Processing..." : "Delete Account"}
            </Button>
            {settingsError && <div className="bg-danger/10 border border-danger text-danger text-sm rounded-md px-3 py-2 text-center animate-pulse mt-3">{settingsError}</div>}
            {settingsSuccess && <div className="bg-success/10 border border-success text-success text-sm rounded-md px-3 py-2 text-center animate-pulse mt-3">{settingsSuccess}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 