import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" placeholder="Spiritual Guidance" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input id="contact-email" type="email" placeholder="contact@example.com" />
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
          <CardDescription>Configure user-related settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-credits">Default Credits for New Users</Label>
            <Input id="default-credits" type="number" placeholder="50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-uploads">Max Upload Size (MB)</Label>
            <Input id="max-uploads" type="number" placeholder="10" />
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage security and authentication settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Authentication Providers</Label>
            <p className="text-sm text-muted-foreground">
              Configure authentication providers in your Supabase dashboard
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://supabase.com/dashboard/project/kjnapormccbbufrdrqni/auth/providers"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase Auth Settings
              </a>
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>API Keys</Label>
            <p className="text-sm text-muted-foreground">
              Manage API keys and secrets in your Supabase dashboard
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://supabase.com/dashboard/project/kjnapormccbbufrdrqni/settings/functions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Supabase Secrets
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
