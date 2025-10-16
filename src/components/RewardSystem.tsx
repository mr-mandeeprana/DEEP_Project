import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Coins, Star, Crown, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: 'cosmetic' | 'feature' | 'premium' | 'special';
  redeemed?: boolean;
  available: boolean;
}

interface RewardSystemProps {
  userCredits: number;
  rewards: Reward[];
  onRedeemReward?: (rewardId: string) => void;
}

export const RewardSystem = ({ userCredits, rewards, onRedeemReward }: RewardSystemProps) => {
  const handleRedeem = (reward: Reward) => {
    if (userCredits < reward.cost) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${reward.cost - userCredits} more credits to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }

    if (onRedeemReward) {
      onRedeemReward(reward.id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cosmetic':
        return <Star className="w-4 h-4" />;
      case 'feature':
        return <Zap className="w-4 h-4" />;
      case 'premium':
        return <Crown className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cosmetic':
        return 'bg-pink-100 text-pink-700';
      case 'feature':
        return 'bg-blue-100 text-blue-700';
      case 'premium':
        return 'bg-purple-100 text-purple-700';
      case 'special':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const availableRewards = rewards.filter(r => r.available && !r.redeemed);
  const redeemedRewards = rewards.filter(r => r.redeemed);

  return (
    <div className="space-y-6">
      {/* Credits Balance */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Coins className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Credits Balance</h3>
                <p className="text-sm text-muted-foreground">Earn credits by completing activities</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-700">{userCredits.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">credits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableRewards.map((reward) => (
              <Card key={reward.id} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                        </div>
                        <Badge className={`text-xs gap-1 ${getCategoryColor(reward.category)}`}>
                          {getCategoryIcon(reward.category)}
                          {reward.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{reward.cost}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(reward)}
                          disabled={userCredits < reward.cost}
                          className="gap-1"
                        >
                          <Gift className="w-3 h-3" />
                          Redeem
                        </Button>
                      </div>

                      {userCredits < reward.cost && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress to unlock</span>
                            <span>{userCredits}/{reward.cost}</span>
                          </div>
                          <Progress value={(userCredits / reward.cost) * 100} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {availableRewards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rewards available right now.</p>
              <p className="text-sm">Check back later for new rewards!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeemed Rewards */}
      {redeemedRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Your Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {redeemedRewards.map((reward) => (
                <div key={reward.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-green-800">{reward.name}</h5>
                    <p className="text-xs text-green-600">{reward.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ Redeemed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            How to Earn Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">10</span>
              </div>
              <div>
                <p className="font-medium">Complete a lesson</p>
                <p className="text-sm text-muted-foreground">Learn and earn credits</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">25</span>
              </div>
              <div>
                <p className="font-medium">Complete mentorship session</p>
                <p className="text-sm text-muted-foreground">Help others grow</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">5</span>
              </div>
              <div>
                <p className="font-medium">Create a post</p>
                <p className="text-sm text-muted-foreground">Share wisdom with community</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium">Leave a comment</p>
                <p className="text-sm text-muted-foreground">Engage with others</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};