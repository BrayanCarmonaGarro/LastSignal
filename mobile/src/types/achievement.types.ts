export interface DashboardAchievement {
  id: string;
  earned_at: string;
  achievement: {
    key: string;
    name: string;
    description: string | null;
    icon_url: string | null;
  };
}
