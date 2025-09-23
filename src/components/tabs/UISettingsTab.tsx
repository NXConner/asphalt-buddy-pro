import { useState, useEffect } from "react";
import { applyUITheme, broadcastThemeUpdated } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, Upload, Volume2, Bell, Monitor, Sun, Moon, Zap, 
  Image, Music, Download, Trash2, Play, Pause, Settings,
  Eye, Camera, Sparkles, RefreshCw, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  accentColor: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  animations: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
}

interface SoundSettings {
  enabled: boolean;
  volume: number;
  sounds: {
    notification: string;
    success: string;
    error: string;
    click: string;
  };
  customSounds: Array<{
    id: string;
    name: string;
    file: string;
    type: string;
  }>;
}

interface NotificationSettings {
  enabled: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  duration: number;
  showIcons: boolean;
  soundEnabled: boolean;
  customSound?: string;
}

interface UISettings {
  theme: ThemeSettings;
  sounds: SoundSettings;
  notifications: NotificationSettings;
  wallpapers: Array<{
    id: string;
    name: string;
    file: string;
    preview: string;
    isActive: boolean;
  }>;
  effects: {
    particleBackground: boolean;
    glowEffects: boolean;
    transitions: boolean;
    blurEffects: boolean;
  };
}

const defaultWallpapers = [
  {
    id: '1',
    name: 'Asphalt Texture',
    file: '/wallpapers/asphalt.svg',
    preview: '/wallpapers/asphalt.svg',
    isActive: false
  },
  {
    id: '2',
    name: 'Construction Site',
    file: '/wallpapers/construction.svg',
    preview: '/wallpapers/construction.svg',
    isActive: false
  },
  {
    id: '3',
    name: 'Road Work',
    file: '/wallpapers/roadwork.svg',
    preview: '/wallpapers/roadwork.svg',
    isActive: false
  }
];

const predefinedThemes = [
  { name: 'Professional Blue', primary: '#3B82F6', secondary: '#F59E0B' },
  { name: 'Construction Orange', primary: '#EA580C', secondary: '#0EA5E9' },
  { name: 'Asphalt Dark', primary: '#6366F1', secondary: '#EF4444' },
  { name: 'Safety Green', primary: '#10B981', secondary: '#F59E0B' },
  { name: 'Classic Gray', primary: '#6B7280', secondary: '#8B5CF6' }
];

export const UISettingsTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UISettings>({
    theme: {
      mode: 'dark',
      accentColor: '#3B82F6',
      backgroundOpacity: 80,
      animations: true,
      reducedMotion: false,
      fontSize: 'medium',
      borderRadius: 'medium'
    },
    sounds: {
      enabled: true,
      volume: 70,
      sounds: {
        notification: 'bell',
        success: 'chime',
        error: 'error',
        click: 'click'
      },
      customSounds: []
    },
    notifications: {
      enabled: true,
      position: 'top-right',
      duration: 5000,
      showIcons: true,
      soundEnabled: true
    },
    wallpapers: defaultWallpapers,
    effects: {
      particleBackground: false,
      glowEffects: true,
      transitions: true,
      blurEffects: false
    }
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<'sound' | 'wallpaper' | null>(null);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem('uiSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate placeholder wallpapers to new SVG assets if present
        if (Array.isArray(parsed?.wallpapers)) {
          parsed.wallpapers = parsed.wallpapers.map((w: any) => {
            if (w?.name === 'Asphalt Texture') return { ...w, file: '/wallpapers/asphalt.svg', preview: '/wallpapers/asphalt.svg' };
            if (w?.name === 'Construction Site') return { ...w, file: '/wallpapers/construction.svg', preview: '/wallpapers/construction.svg' };
            if (w?.name === 'Road Work') return { ...w, file: '/wallpapers/roadwork.svg', preview: '/wallpapers/roadwork.svg' };
            return w;
          });
        }
        setSettings(parsed);
        const active = parsed?.wallpapers?.find((w: any) => w.isActive);
        if (active?.file) {
          applyUITheme({ ...(parsed.theme || {}), backgroundImage: active.file } as any);
        }
      } catch {
        setSettings(prev => prev);
      }
    }
  }, []);

  // Live preview theme changes when in preview mode
  useEffect(() => {
    if (isPreviewMode) {
      applyUITheme(settings.theme as any);
    }
  }, [isPreviewMode, settings]);

  const saveSettings = () => {
    localStorage.setItem('uiSettings', JSON.stringify(settings));
    // Apply immediately and notify app
    applyUITheme(settings.theme as any);
    broadcastThemeUpdated(settings.theme as any);
    toast({
      title: "Settings saved!",
      description: "Your UI preferences have been updated successfully."
    });
  };

  const applyTheme = (theme: typeof predefinedThemes[0]) => {
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        accentColor: theme.primary
      }
    }));
    if (isPreviewMode) {
      applyUITheme({ ...settings.theme, accentColor: theme.primary } as any);
    }
  };

  const handleSoundUpload = () => {
    setUploadingFile('sound');
    // Mock file upload - in real implementation would handle file selection
    setTimeout(() => {
      const newSound = {
        id: Date.now().toString(),
        name: 'Custom Sound',
        file: 'custom-sound.mp3',
        type: 'audio/mp3'
      };
      
      setSettings(prev => ({
        ...prev,
        sounds: {
          ...prev.sounds,
          customSounds: [...prev.sounds.customSounds, newSound]
        }
      }));
      
      setUploadingFile(null);
      toast({
        title: "Sound uploaded!",
        description: "Custom sound has been added to your library."
      });
    }, 1500);
  };

  const handleWallpaperUpload = () => {
    setUploadingFile('wallpaper');
    // Mock file upload - in real implementation would handle file selection
    setTimeout(() => {
      const newWallpaper = {
        id: Date.now().toString(),
        name: 'Custom Wallpaper',
        file: '/api/placeholder/1920/1080',
        preview: '/api/placeholder/300/200',
        isActive: false
      };
      
      setSettings(prev => ({
        ...prev,
        wallpapers: [...prev.wallpapers, newWallpaper]
      }));
      
      setUploadingFile(null);
      toast({
        title: "Wallpaper uploaded!",
        description: "Custom wallpaper has been added to your collection."
      });
    }, 2000);
  };

  const setActiveWallpaper = (id: string) => {
    setSettings(prev => {
      const nextWallpapers = prev.wallpapers.map(w => ({
        ...w,
        isActive: w.id === id
      }));
      const active = nextWallpapers.find(w => w.isActive);
      const next = {
        ...prev,
        wallpapers: nextWallpapers,
        theme: {
          ...prev.theme,
          backgroundImage: active?.file
        }
      } as UISettings;
      if (isPreviewMode && active?.file) {
        applyUITheme(next.theme as any);
      }
      return next;
    });
  };

  const deleteCustomItem = (type: 'sound' | 'wallpaper', id: string) => {
    if (type === 'sound') {
      setSettings(prev => ({
        ...prev,
        sounds: {
          ...prev.sounds,
          customSounds: prev.sounds.customSounds.filter(s => s.id !== id)
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        wallpapers: prev.wallpapers.filter(w => w.id !== id)
      }));
    }
    
    toast({
      title: `${type === 'sound' ? 'Sound' : 'Wallpaper'} deleted`,
      description: `Custom ${type} has been removed.`
    });
  };

  const playTestSound = (soundType: string) => {
    toast({
      title: "Sound preview",
      description: `Playing ${soundType} sound...`
    });
  };

  const previewTheme = () => {
    const next = !isPreviewMode;
    setIsPreviewMode(next);
    if (next) {
      applyUITheme(settings.theme as any);
    } else {
      // Exit preview: re-apply persisted theme if different
      try {
        const saved = localStorage.getItem('uiSettings');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.theme) applyUITheme(parsed.theme);
      } catch {}
    }
    toast({
      title: next ? "Preview enabled" : "Preview disabled",
      description: next ? "Showing theme preview" : "Returned to normal view"
    });
  };

  const resetToDefaults = () => {
    setSettings({
      theme: {
        mode: 'dark',
        accentColor: '#3B82F6',
        backgroundOpacity: 80,
        animations: true,
        reducedMotion: false,
        fontSize: 'medium',
        borderRadius: 'medium'
      },
      sounds: {
        enabled: true,
        volume: 70,
        sounds: {
          notification: 'bell',
          success: 'chime',
          error: 'error',
          click: 'click'
        },
        customSounds: []
      },
      notifications: {
        enabled: true,
        position: 'top-right',
        duration: 5000,
        showIcons: true,
        soundEnabled: true
      },
      wallpapers: defaultWallpapers,
      effects: {
        particleBackground: false,
        glowEffects: true,
        transitions: true,
        blurEffects: false
      }
    });
    
    toast({
      title: "Settings reset",
      description: "All UI settings have been reset to defaults."
    });
  };

  return (
    <div className={`space-y-6 ${isPreviewMode ? 'animate-pulse' : ''}`}>
      {/* Header */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              UI Settings & Customization
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={previewTheme}>
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button variant="outline" onClick={resetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveSettings} className="btn-primary">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="sounds">Sounds</TabsTrigger>
          <TabsTrigger value="wallpapers">Wallpapers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-6">
          {/* Color Themes */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Themes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {predefinedThemes.map((theme, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] ${
                      settings.theme.accentColor === theme.primary ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => applyTheme(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-center h-16 rounded-lg mb-3" 
                           style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-center">{theme.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Theme Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Theme Mode</Label>
                    <div className="flex gap-2 mt-2">
                      {['light', 'dark', 'auto'].map((mode) => (
                        <Button
                          key={mode}
                          variant={settings.theme.mode === mode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            theme: { ...prev.theme, mode: mode as any }
                          }))}
                          className="flex items-center gap-2"
                        >
                          {mode === 'light' && <Sun className="h-4 w-4" />}
                          {mode === 'dark' && <Moon className="h-4 w-4" />}
                          {mode === 'auto' && <Monitor className="h-4 w-4" />}
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select value={settings.theme.fontSize} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, theme: { ...prev.theme, fontSize: value } }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="borderRadius">Border Radius</Label>
                    <Select value={settings.theme.borderRadius} onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, theme: { ...prev.theme, borderRadius: value } }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backgroundOpacity">Background Opacity</Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={[settings.theme.backgroundOpacity]}
                        onValueChange={([value]) => setSettings(prev => ({
                          ...prev,
                          theme: { ...prev.theme, backgroundOpacity: value }
                        }))}
                        min={0}
                        max={100}
                        step={10}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {settings.theme.backgroundOpacity}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations">Enable Animations</Label>
                    <Switch
                      id="animations"
                      checked={settings.theme.animations}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        theme: { ...prev.theme, animations: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reducedMotion">Reduced Motion</Label>
                    <Switch
                      id="reducedMotion"
                      checked={settings.theme.reducedMotion}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        theme: { ...prev.theme, reducedMotion: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds" className="space-y-6">
          {/* Sound Settings */}
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sound Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="soundEnabled">Enable Sounds</Label>
                <Switch
                  id="soundEnabled"
                  checked={settings.sounds.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    sounds: { ...prev.sounds, enabled: checked }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="volume">Master Volume</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[settings.sounds.volume]}
                    onValueChange={([value]) => setSettings(prev => ({
                      ...prev,
                      sounds: { ...prev.sounds, volume: value }
                    }))}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {settings.sounds.volume}%
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Sound Assignment</h4>
                {Object.entries(settings.sounds.sounds).map(([type, sound]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label className="capitalize">{type.replace('_', ' ')}</Label>
                    <div className="flex items-center gap-2">
                      <Select value={sound} onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          sounds: {
                            ...prev.sounds,
                            sounds: { ...prev.sounds.sounds, [type]: value }
                          }
                        }))
                      }>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bell">Bell</SelectItem>
                          <SelectItem value="chime">Chime</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="click">Click</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playTestSound(type)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Sounds */}
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Custom Sounds
                </CardTitle>
                <Button 
                  onClick={handleSoundUpload}
                  disabled={uploadingFile === 'sound'}
                  className="btn-primary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingFile === 'sound' ? 'Uploading...' : 'Upload Sound'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {settings.sounds.customSounds.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No custom sounds uploaded yet.</p>
                  <p className="text-sm text-muted-foreground">Upload MP3, WAV, or OGG files.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.sounds.customSounds.map((sound) => (
                    <Card key={sound.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{sound.name}</h4>
                            <p className="text-sm text-muted-foreground">{sound.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => playTestSound(sound.name)}>
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteCustomItem('sound', sound.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallpapers" className="space-y-6">
          <Card className="card-professional">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Background Wallpapers
                </CardTitle>
                <Button 
                  onClick={handleWallpaperUpload}
                  disabled={uploadingFile === 'wallpaper'}
                  className="btn-primary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingFile === 'wallpaper' ? 'Uploading...' : 'Upload Wallpaper'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.wallpapers.map((wallpaper) => (
                  <Card 
                    key={wallpaper.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] ${
                      wallpaper.isActive ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div 
                        className="aspect-video bg-cover bg-center rounded-lg mb-3"
                        style={{ backgroundImage: `url(${wallpaper.preview})` }}
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{wallpaper.name}</h4>
                          {wallpaper.isActive && (
                            <Badge className="text-xs mt-1">Active</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveWallpaper(wallpaper.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {wallpaper.id !== '1' && wallpaper.id !== '2' && wallpaper.id !== '3' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteCustomItem('wallpaper', wallpaper.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
                <Switch
                  id="notificationsEnabled"
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, enabled: checked }
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={settings.notifications.position} onValueChange={(value: any) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, position: value }
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      value={[settings.notifications.duration / 1000]}
                      onValueChange={([value]) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, duration: value * 1000 }
                      }))}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {settings.notifications.duration / 1000}s
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showIcons">Show Icons</Label>
                <Switch
                  id="showIcons"
                  checked={settings.notifications.showIcons}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, showIcons: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="soundEnabled">Sound Enabled</Label>
                <Switch
                  id="soundEnabled"
                  checked={settings.notifications.soundEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, soundEnabled: checked }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-6">
          <Card className="card-professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Visual Effects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="particleBackground">Particle Background</Label>
                      <p className="text-sm text-muted-foreground">Animated background particles</p>
                    </div>
                    <Switch
                      id="particleBackground"
                      checked={settings.effects.particleBackground}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        effects: { ...prev.effects, particleBackground: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="glowEffects">Glow Effects</Label>
                      <p className="text-sm text-muted-foreground">Glowing borders and shadows</p>
                    </div>
                    <Switch
                      id="glowEffects"
                      checked={settings.effects.glowEffects}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        effects: { ...prev.effects, glowEffects: checked }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transitions">Smooth Transitions</Label>
                      <p className="text-sm text-muted-foreground">Enhanced page transitions</p>
                    </div>
                    <Switch
                      id="transitions"
                      checked={settings.effects.transitions}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        effects: { ...prev.effects, transitions: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="blurEffects">Blur Effects</Label>
                      <p className="text-sm text-muted-foreground">Backdrop blur and glass effects</p>
                    </div>
                    <Switch
                      id="blurEffects"
                      checked={settings.effects.blurEffects}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        effects: { ...prev.effects, blurEffects: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Note */}
      {isPreviewMode && (
        <Card className="card-professional border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <Eye className="h-5 w-5" />
              <span className="font-medium">Preview Mode Active</span>
              <span className="text-sm text-muted-foreground">- Theme changes are being previewed</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};