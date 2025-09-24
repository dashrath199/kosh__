import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Smartphone, Eye, EyeOff } from "lucide-react";
import { login, register } from "@/lib/api";

interface AuthSectionProps {
  onAuthenticated?: (user: { name: string; email: string; phone: string }) => void;
}

const AuthSection = ({ onAuthenticated }: AuthSectionProps) => {
  const [showPassword, setShowPassword] = useState(false);
  // login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  // register form state
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    setLoadingLogin(true);
    try {
      const res = await login({ identifier, password });
      onAuthenticated?.(res.user);
    } catch (e: any) {
      setLoginError(e?.message || "Login failed");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegister = async () => {
    setRegisterError(null);
    setLoadingRegister(true);
    try {
      await register({ fullName, email, mobile, password: newPassword });
      // Auto-login after register for demo
      const res = await login({ identifier: email, password: newPassword });
      onAuthenticated?.(res.user);
    } catch (e: any) {
      setRegisterError(e?.message || "Registration failed");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Kosh</h1>
          <p className="text-muted-foreground">Your smart financial assistant for business growth</p>
        </div>

        <Card className="shadow-card bg-gradient-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Secure Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email or Mobile</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email or mobile number"
                    className="bg-background"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="bg-background pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {loginError && (
                  <div className="text-sm text-destructive" role="alert">
                    {loginError}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="primary"
                  size="lg"
                  onClick={handleLogin}
                  disabled={loadingLogin}
                >
                  {loadingLogin ? "Signing In..." : "Sign In Securely"}
                </Button>

                <div className="text-center">
                  <Button variant="link" size="sm">
                    Forgot your password?
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-background"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex">
                    <div className="flex items-center bg-secondary px-3 border border-r-0 rounded-l-md">
                      <span className="text-sm">+91</span>
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter mobile number"
                      className="bg-background rounded-l-none"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="bg-background pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {registerError && (
                  <div className="text-sm text-destructive" role="alert">
                    {registerError}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="primary"
                  size="lg"
                  onClick={handleRegister}
                  disabled={loadingRegister}
                >
                  {loadingRegister ? "Creating Account..." : "Create Account"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Or continue with biometric login</span>
              </div>
              <Button variant="outline" className="w-full mt-3">
                Use Fingerprint/Face ID
              </Button>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              🔒 Your data is encrypted and secure. We're regulated by RBI.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthSection;