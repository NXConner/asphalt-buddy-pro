import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Upload, Camera, Mail, Phone, MapPin, Building, Calendar, Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    avatar?: string;
    bio: string;
  };
  professional: {
    title: string;
    company: string;
    experience: string;
    certifications: string[];
    specialties: string[];
    licenseNumber: string;
    insuranceProvider: string;
    bondingCompany: string;
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    units: 'imperial' | 'metric';
    currency: string;
    timezone: string;
    language: string;
  };
  stats: {
    joinDate: string;
    totalEstimates: number;
    totalRevenue: number;
    completedJobs: number;
    customerRating: number;
    badgesEarned: string[];
  };
}

export const ProfileTab = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    personal: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      phone: "(555) 123-4567",
      address: "123 Main Street",
      city: "Richmond",
      state: "VA",
      zipCode: "23220",
      bio: "Experienced asphalt maintenance professional with over 10 years in the industry. Specializing in commercial parking lot maintenance and residential driveway services."
    },
    professional: {
      title: "Owner/Operator",
      company: "Smith Asphalt Services",
      experience: "10+ years",
      certifications: ["PAVEMENT Coatings Certified", "OSHA 30-Hour Construction"],
      specialties: ["Sealcoating", "Crack Repair", "Line Striping", "Pothole Repair"],
      licenseNumber: "VA-AS-2024-001",
      insuranceProvider: "General Liability Insurance Co.",
      bondingCompany: "Professional Bonding Services"
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      units: 'imperial',
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en'
    },
    stats: {
      joinDate: "2024-01-15",
      totalEstimates: 147,
      totalRevenue: 125000,
      completedJobs: 89,
      customerRating: 4.8,
      badgesEarned: ["Pro Estimator", "Quality Expert", "Safety First", "Customer Champion"]
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<'personal' | 'professional' | 'preferences' | null>(null);

  useEffect(() => {
    // Load saved profile
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setIsEditing(false);
    setEditingSection(null);
    
    toast({
      title: "Profile updated!",
      description: "Your profile information has been saved successfully."
    });
  };

  const handleAvatarUpload = () => {
    // Mock avatar upload functionality
    toast({
      title: "Avatar upload",
      description: "Avatar upload functionality would be implemented here with file handling."
    });
  };

  const getBadgeColor = (badge: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[badge.length % colors.length];
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="card-professional">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.personal.avatar} />
                <AvatarFallback className="text-xl font-bold">
                  {getInitials(profile.personal.firstName, profile.personal.lastName)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={handleAvatarUpload}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {profile.personal.firstName} {profile.personal.lastName}
                  </h2>
                  <p className="text-lg text-muted-foreground">{profile.professional.title}</p>
                  <p className="text-sm text-muted-foreground">{profile.professional.company}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.personal.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.personal.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.personal.city}, {profile.personal.state}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-600">{profile.stats.customerRating}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.floor(profile.stats.customerRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Customer Rating</p>
                </div>
              </div>

              {profile.personal.bio && (
                <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
                  {profile.personal.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-professional">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{profile.stats.totalEstimates}</div>
            <div className="text-sm text-muted-foreground">Total Estimates</div>
          </CardContent>
        </Card>
        <Card className="card-professional">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">${profile.stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
        <Card className="card-professional">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.stats.completedJobs}</div>
            <div className="text-sm text-muted-foreground">Completed Jobs</div>
          </CardContent>
        </Card>
        <Card className="card-professional">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.stats.badgesEarned.length}</div>
            <div className="text-sm text-muted-foreground">Badges Earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {profile.stats.badgesEarned.map((badge, index) => (
              <Badge key={index} className={`${getBadgeColor(badge)} text-white px-3 py-1`}>
                {badge}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSection(editingSection === 'personal' ? null : 'personal');
                    setIsEditing(editingSection !== 'personal');
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingSection === 'personal' ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.personal.firstName}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, firstName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.personal.lastName}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, lastName: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.personal.email}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, email: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.personal.phone}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, phone: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.personal.address}
                  disabled={editingSection !== 'personal'}
                  onChange={(e) => setProfile({
                    ...profile,
                    personal: { ...profile.personal, address: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.personal.city}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, city: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.personal.state}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, state: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={profile.personal.zipCode}
                    disabled={editingSection !== 'personal'}
                    onChange={(e) => setProfile({
                      ...profile,
                      personal: { ...profile.personal, zipCode: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.personal.bio}
                  disabled={editingSection !== 'personal'}
                  onChange={(e) => setProfile({
                    ...profile,
                    personal: { ...profile.personal, bio: e.target.value }
                  })}
                  rows={3}
                />
              </div>

              {editingSection === 'personal' && (
                <div className="flex justify-end">
                  <Button onClick={saveProfile} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Professional Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSection(editingSection === 'professional' ? null : 'professional');
                    setIsEditing(editingSection !== 'professional');
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingSection === 'professional' ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={profile.professional.title}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.professional.company}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, company: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    value={profile.professional.experience}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, experience: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={profile.professional.licenseNumber}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, licenseNumber: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.professional.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.professional.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insurance">Insurance Provider</Label>
                  <Input
                    id="insurance"
                    value={profile.professional.insuranceProvider}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, insuranceProvider: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="bonding">Bonding Company</Label>
                  <Input
                    id="bonding"
                    value={profile.professional.bondingCompany}
                    disabled={editingSection !== 'professional'}
                    onChange={(e) => setProfile({
                      ...profile,
                      professional: { ...profile.professional, bondingCompany: e.target.value }
                    })}
                  />
                </div>
              </div>

              {editingSection === 'professional' && (
                <div className="flex justify-end">
                  <Button onClick={saveProfile} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Preferences & Settings</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSection(editingSection === 'preferences' ? null : 'preferences');
                    setIsEditing(editingSection !== 'preferences');
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingSection === 'preferences' ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email notifications</span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.email}
                      disabled={editingSection !== 'preferences'}
                      onChange={(e) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            email: e.target.checked
                          }
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS notifications</span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.sms}
                      disabled={editingSection !== 'preferences'}
                      onChange={(e) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            sms: e.target.checked
                          }
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push notifications</span>
                    <input
                      type="checkbox"
                      checked={profile.preferences.notifications.push}
                      disabled={editingSection !== 'preferences'}
                      onChange={(e) => setProfile({
                        ...profile,
                        preferences: {
                          ...profile.preferences,
                          notifications: {
                            ...profile.preferences.notifications,
                            push: e.target.checked
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="units">Measurement Units</Label>
                  <select
                    id="units"
                    value={profile.preferences.units}
                    disabled={editingSection !== 'preferences'}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, units: e.target.value as 'imperial' | 'metric' }
                    })}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    <option value="imperial">Imperial (ft, lb)</option>
                    <option value="metric">Metric (m, kg)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={profile.preferences.currency}
                    disabled={editingSection !== 'preferences'}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, currency: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {editingSection === 'preferences' && (
                <div className="flex justify-end">
                  <Button onClick={saveProfile} className="btn-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};