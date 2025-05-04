import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, User as UserIcon, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Profile() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get profile from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Map full_name to name in our local state
          const profileWithName = {
            ...data,
            name: data.full_name || "",
          };
          
          setProfileData(profileWithName as User);
          setFormData({
            name: data.full_name || "",
            email: user.email || "",
          });
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Update the profile - using full_name instead of name
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Set local state
      setProfileData({
        ...profileData!,
        name: formData.name,
      });
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleAvatarClick = () => {
    setAvatarUrl(profileData?.avatar_url || "");
    setIsAvatarDialogOpen(true);
  };

  const handleAvatarSave = async () => {
    if (!user) return;
    
    try {
      setSavingAvatar(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setProfileData({
        ...profileData!,
        avatar_url: avatarUrl,
      });
      
      setIsAvatarDialogOpen(false);
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Error updating avatar:", error.message);
      toast.error("Failed to update profile picture");
    } finally {
      setSavingAvatar(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-1/3 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={profileData?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profileData?.name ? getInitials(profileData.name) : <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{profileData?.name || "User"}</h2>
            <p className="text-muted-foreground mt-1">{user?.email}</p>
            <Badge variant={role === 'admin' ? "default" : "outline"} className="mt-2">
              {role || "user"}
            </Badge>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <Tabs defaultValue="settings">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        name="role"
                        value={role || "user"}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-muted-foreground">
                        {role === 'admin' 
                          ? "You have administrator privileges" 
                          : "Contact an administrator to change your role"}
                      </p>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground">
                    Password management is handled through Supabase Authentication.
                  </p>
                </CardContent>
                
                <CardFooter>
                  <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                    Sign Out
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Enter the URL of your profile picture
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Image URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>
              
              {avatarUrl && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xl">
                      {profileData?.name ? getInitials(profileData.name) : <UserIcon />}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAvatarSave} disabled={savingAvatar}>
              {savingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 