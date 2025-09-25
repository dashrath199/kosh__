import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getSettings,
  updateSettings as updateSettingsApi,
  requestDataExport,
  getUserProfile,
  updateUserProfile as updateUserProfileApi,
} from "@/lib/api";
import type {
  Settings as SettingsResponse,
  UserProfile as UserProfileResponse,
  DataExportResponse,
} from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type SettingsForm = {
  autoSaveRate: number;
  minThreshold: number;
  roundUpsEnabled: boolean;
  riskTolerance: string;
  investmentGoal: string | null;
  autoInvest: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  lowBalanceAlert: boolean;
  weeklyReport: boolean;
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  currency: string;
  language: string;
  theme: string;
  weeklyTopUp: number;
  monthlyGoal: number | null;
};

type ProfileForm = {
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

const defaultSettings: SettingsForm = {
  autoSaveRate: 3.5,
  minThreshold: 100,
  roundUpsEnabled: true,
  riskTolerance: "moderate",
  investmentGoal: null,
  autoInvest: true,
  emailNotifications: true,
  pushNotifications: true,
  lowBalanceAlert: true,
  weeklyReport: true,
  twoFactorAuth: false,
  biometricAuth: true,
  currency: "INR",
  language: "en",
  theme: "system",
  weeklyTopUp: 500,
  monthlyGoal: null,
};

const defaultProfile: ProfileForm = {
  name: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
};

export function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);
  const [profile, setProfile] = useState<ProfileForm>(defaultProfile);
  const [lastSettingsSavedAt, setLastSettingsSavedAt] = useState<string | null>(null);
  const [lastProfileSavedAt, setLastProfileSavedAt] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'sql'>('json');
  const [latestExport, setLatestExport] = useState<DataExportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [settingsResponse, profileResponse] = await Promise.all([
          getSettings().catch((error) => {
            console.error("Failed to fetch settings:", error);
            throw error;
          }),
          getUserProfile().catch((error) => {
            console.error("Failed to fetch profile:", error);
            throw error;
          }),
        ]);

        const nextSettings: SettingsForm = {
          autoSaveRate: settingsResponse.autoSaveRate ?? defaultSettings.autoSaveRate,
          minThreshold: settingsResponse.minThreshold ?? defaultSettings.minThreshold,
          roundUpsEnabled: settingsResponse.roundUpsEnabled ?? defaultSettings.roundUpsEnabled,
          riskTolerance: settingsResponse.riskTolerance ?? defaultSettings.riskTolerance,
          investmentGoal: settingsResponse.investmentGoal ?? defaultSettings.investmentGoal,
          autoInvest: settingsResponse.autoInvest ?? defaultSettings.autoInvest,
          emailNotifications: settingsResponse.emailNotifications ?? defaultSettings.emailNotifications,
          pushNotifications: settingsResponse.pushNotifications ?? defaultSettings.pushNotifications,
          lowBalanceAlert: settingsResponse.lowBalanceAlert ?? defaultSettings.lowBalanceAlert,
          weeklyReport: settingsResponse.weeklyReport ?? defaultSettings.weeklyReport,
          twoFactorAuth: settingsResponse.twoFactorAuth ?? defaultSettings.twoFactorAuth,
          biometricAuth: settingsResponse.biometricAuth ?? defaultSettings.biometricAuth,
          currency: settingsResponse.currency ?? defaultSettings.currency,
          language: settingsResponse.language ?? defaultSettings.language,
          theme: settingsResponse.theme ?? defaultSettings.theme,
          weeklyTopUp: settingsResponse.weeklyTopUp ?? defaultSettings.weeklyTopUp,
          monthlyGoal: settingsResponse.monthlyGoal ?? defaultSettings.monthlyGoal,
        };

        const nextProfile: ProfileForm = {
          name: profileResponse.name ?? "",
          email: profileResponse.email ?? "",
          phoneNumber: profileResponse.phoneNumber ?? "",
          dateOfBirth: profileResponse.dateOfBirth ? profileResponse.dateOfBirth.slice(0, 10) : "",
          address: profileResponse.address ?? "",
          city: profileResponse.city ?? "",
          state: profileResponse.state ?? "",
          country: profileResponse.country ?? "",
          postalCode: profileResponse.postalCode ?? "",
        };

        setSettings(nextSettings);
        setProfile(nextProfile);
        setLastSettingsSavedAt(settingsResponse.updatedAt ?? settingsResponse.createdAt ?? null);
        setLastProfileSavedAt(profileResponse.updatedAt ?? null);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSettingsChange = (key: keyof SettingsForm, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileChange = (key: keyof ProfileForm, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSettingsSave = async () => {
    setIsSettingsSaving(true);
    try {
      const updated = await updateSettingsApi(settings);
      setLastSettingsSavedAt(updated.updatedAt ?? new Date().toISOString());
      setSettings((prev) => ({
        ...prev,
        autoSaveRate: updated.autoSaveRate,
        minThreshold: updated.minThreshold,
        roundUpsEnabled: updated.roundUpsEnabled,
        riskTolerance: updated.riskTolerance,
        investmentGoal: updated.investmentGoal,
        autoInvest: updated.autoInvest,
        emailNotifications: updated.emailNotifications,
        pushNotifications: updated.pushNotifications,
        lowBalanceAlert: updated.lowBalanceAlert,
        weeklyReport: updated.weeklyReport,
        twoFactorAuth: updated.twoFactorAuth,
        biometricAuth: updated.biometricAuth,
        currency: updated.currency,
        language: updated.language,
        theme: updated.theme,
        weeklyTopUp: updated.weeklyTopUp,
        monthlyGoal: updated.monthlyGoal,
      }));

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Unable to save",
        description: error?.message || "Please try saving again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setIsProfileSaving(true);
    try {
      const payload: Partial<UserProfileResponse> = {
        name: profile.name || null,
        phoneNumber: profile.phoneNumber || null,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : null,
        address: profile.address || null,
        city: profile.city || null,
        state: profile.state || null,
        country: profile.country || null,
        postalCode: profile.postalCode || null,
      };

      const updated = await updateUserProfileApi(payload);
      setLastProfileSavedAt(updated.updatedAt ?? new Date().toISOString());
      setProfile((prev) => ({
        ...prev,
        name: updated.name ?? "",
        email: updated.email ?? prev.email,
        phoneNumber: updated.phoneNumber ?? "",
        dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.slice(0, 10) : "",
        address: updated.address ?? "",
        city: updated.city ?? "",
        state: updated.state ?? "",
        country: updated.country ?? "",
        postalCode: updated.postalCode ?? "",
      }));

      toast({
        title: "Profile updated",
        description: "Your profile details have been saved.",
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Unable to update profile",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await requestDataExport(exportFormat);
      setLatestExport(response);
      toast({
        title: "Export requested",
        description: `We'll email you when your ${exportFormat.toUpperCase()} export is ready.`,
      });
    } catch (error: any) {
      console.error("Failed to request export:", error);
      toast({
        title: "Export failed",
        description: error?.message || "Please try requesting again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const settingsLastUpdated = useMemo(() => {
    if (!lastSettingsSavedAt) return null;
    return formatDistanceToNow(new Date(lastSettingsSavedAt), { addSuffix: true });
  }, [lastSettingsSavedAt]);

  const profileLastUpdated = useMemo(() => {
    if (!lastProfileSavedAt) return null;
    return formatDistanceToNow(new Date(lastProfileSavedAt), { addSuffix: true });
  }, [lastProfileSavedAt]);

  const latestExportStatus = useMemo(() => {
    if (!latestExport) return null;
    const requestedAgo = formatDistanceToNow(new Date(latestExport.requestedAt), { addSuffix: true });
    return `${latestExport.format.toUpperCase()} export requested ${requestedAgo}`;
  }, [latestExport]);

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, profile, and app preferences</p>
          {settingsLastUpdated && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Last saved {settingsLastUpdated}</Badge>
            </div>
          )}
        </div>
        <Button onClick={handleSettingsSave} disabled={isSettingsSaving}>
          {isSettingsSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">Email changes are managed by support.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={profile.phoneNumber}
                    onChange={(e) => handleProfileChange("phoneNumber", e.target.value)}
                    placeholder="e.g., +91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange("address", e.target.value)}
                    placeholder="Street, Apartment, Landmark"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => handleProfileChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) => handleProfileChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => handleProfileChange("country", e.target.value)}
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={profile.postalCode}
                    onChange={(e) => handleProfileChange("postalCode", e.target.value)}
                    placeholder="PIN / ZIP"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {profileLastUpdated ? `Last updated ${profileLastUpdated}` : ""}
              </div>
              <Button onClick={handleProfileSave} disabled={isProfileSaving}>
                {isProfileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Save Settings</CardTitle>
              <CardDescription>
                Configure how much you want to save automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autoSaveRate">Auto-Save Rate (%)</Label>
                  <Input
                    id="autoSaveRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.autoSaveRate}
                    onChange={(e) => handleSettingsChange("autoSaveRate", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minThreshold">Minimum Threshold (₹)</Label>
                  <Input
                    id="minThreshold"
                    type="number"
                    min="0"
                    value={settings.minThreshold}
                    onChange={(e) => handleSettingsChange("minThreshold", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="roundUpsEnabled"
                  checked={settings.roundUpsEnabled}
                  onCheckedChange={(checked) => handleSettingsChange("roundUpsEnabled", checked)}
                />
                <Label htmlFor="roundUpsEnabled">Enable Round-Up Savings</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings Goals</CardTitle>
              <CardDescription>Set your weekly and monthly savings targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weeklyTopUp">Weekly Savings Goal (₹)</Label>
                  <Input
                    id="weeklyTopUp"
                    type="number"
                    min="0"
                    value={settings.weeklyTopUp}
                    onChange={(e) => handleSettingsChange("weeklyTopUp", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyGoal">Monthly Savings Goal (₹) - Optional</Label>
                  <Input
                    id="monthlyGoal"
                    type="number"
                    min="0"
                    value={settings.monthlyGoal ?? ""}
                    onChange={(e) =>
                      handleSettingsChange("monthlyGoal", e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="e.g., 10000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Preferences</CardTitle>
              <CardDescription>Configure your investment strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                <Select
                  value={settings.riskTolerance}
                  onValueChange={(value) => handleSettingsChange("riskTolerance", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="moderate">Moderate Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investmentGoal">Investment Goal</Label>
                <Select
                  value={settings.investmentGoal ?? ""}
                  onValueChange={(value) => handleSettingsChange("investmentGoal", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Short Term (1-3 years)</SelectItem>
                    <SelectItem value="medium_term">Medium Term (3-7 years)</SelectItem>
                    <SelectItem value="long_term">Long Term (7+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoInvest"
                  checked={settings.autoInvest}
                  onCheckedChange={(checked) => handleSettingsChange("autoInvest", checked)}
                />
                <Label htmlFor="autoInvest">Enable Auto-Invest</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingsChange("emailNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get alerts on your device</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingsChange("pushNotifications", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Balance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when your balance is low</p>
                  </div>
                  <Switch
                    checked={settings.lowBalanceAlert}
                    onCheckedChange={(checked) => handleSettingsChange("lowBalanceAlert", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of your finances</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) => handleSettingsChange("weeklyReport", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingsChange("twoFactorAuth", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Biometric Authentication</Label>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face recognition to log in</p>
                </div>
                <Switch
                  checked={settings.biometricAuth}
                  onCheckedChange={(checked) => handleSettingsChange("biometricAuth", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => handleSettingsChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleSettingsChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => handleSettingsChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button onClick={handleSettingsSave} disabled={isSettingsSaving}>
                {isSettingsSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>Request a copy of your data in the format that works best for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value) => setExportFormat(value as 'json' | 'csv' | 'sql')}
                >
                  <SelectTrigger id="exportFormat">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (structured data)</SelectItem>
                    <SelectItem value="csv">CSV (spreadsheet friendly)</SelectItem>
                    <SelectItem value="sql">SQL (database backup)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {latestExportStatus && (
                <Badge variant="outline">{latestExportStatus}</Badge>
              )}

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Data exports are processed securely and may take a few minutes. We'll notify you when it's ready.</p>
                {latestExport?.downloadUrl && (
                  <a
                    href={latestExport.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Download most recent export
                  </a>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleExportData} disabled={isExporting}>
                {isExporting ? "Requesting..." : `Request ${exportFormat.toUpperCase()} Export`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Find answers or get in touch with our team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold">Frequently asked questions</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                  <li>How does auto-save work and when is money moved?</li>
                  <li>How can I change my linked bank accounts?</li>
                  <li>What investment products are available?</li>
                </ul>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>If you need help, our support team is here for you.</p>
                <p>
                  Email us at {" "}
                  <a href="mailto:support@kosh.money" className="text-primary hover:underline">
                    support@kosh.money
                  </a>{" "}
                  or call +91-80-1234-5678.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
