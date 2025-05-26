import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  FileText, 
  User, 
  Search, 
  Settings,
  Users,
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  CheckCircle2,
  RotateCw,
  Sliders, 
  Lightbulb,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  className = "" 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  className?: string;
}) => (
  <Card className={`shadow-sm transition-all hover:shadow-md ${className}`}>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
  </Card>
);

const AdminHowItWorks = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container py-8 max-w-4xl">      <h1 className="text-4xl font-bold mb-6">{t('adminHowItWorks')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('adminHowItWorksIntro')}
      </p>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-1 gap-3 mb-12">
          <TabsTrigger 
            value="dashboard" 
            className="p-3 text-base border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            {t('adminDashboardStats')}
          </TabsTrigger>
          <TabsTrigger 
            value="ticketManagement" 
            className="p-3 text-base border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            {t('adminTicketManagement')}
          </TabsTrigger>
          <TabsTrigger 
            value="configuration" 
            className="p-3 text-base border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            {t('adminConfiguration')}
          </TabsTrigger>
        </TabsList>
          <TabsContent value="dashboard" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('adminDashboardStats')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={BarChart3} 
              title={t('adminDashboardOverview')} 
              description={t('adminDashboardOverviewDesc')} 
            />
            <FeatureCard 
              icon={RotateCw} 
              title={t('adminRealTimeUpdates')}
              description={t('adminRealTimeUpdatesDesc')}
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('adminKeyMetrics')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('adminTotalTicketsMetric')}</li>
              <li>{t('adminResolutionTimeMetric')}</li>
              <li>{t('adminCategoryDistributionMetric')}</li>
              <li>{t('adminWeeklyComparisonMetric')}</li>
            </ul>
          </div>          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              {t('adminGoDashboard')}
            </Button>
          </div>
        </TabsContent>        <TabsContent value="ticketManagement" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('adminTicketManagement')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={Search} 
              title={t('adminAdvancedSearch')} 
              description={t('adminAdvancedSearchDesc')} 
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title={t('adminAssignmentPrioritization')}
              description={t('adminAssignmentPrioritizationDesc')}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('adminKeyActions')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span><strong>{t('adminAssignment')}:</strong> {t('adminAssignmentDesc')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span><strong>{t('adminPrioritization')}:</strong> {t('adminPrioritizationDesc')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span><strong>{t('adminResolution')}:</strong> {t('adminResolutionDesc')}</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => navigate('/tickets')}
              className="flex items-center gap-2"
            >
              {t('adminViewTicketList')}
            </Button>
          </div>
        </TabsContent>        <TabsContent value="userManagement" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('adminUserManagement')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={Users} 
              title={t('adminUserAdmin')} 
              description={t('adminUserAdminDesc')} 
            />
            <FeatureCard 
              icon={UserCheck} 
              title={t('adminRoleAssignment')}
              description={t('adminRoleAssignmentDesc')}
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('adminSystemRoles')}</h3>
            <div className="space-y-2">
              <div className="p-2 border border-emerald-200 rounded-md">
                <span className="font-medium">{t('roleUser')}:</span> {t('roleUserDesc')}
              </div>
              <div className="p-2 border border-emerald-200 rounded-md">
                <span className="font-medium">{t('roleAgent')}:</span> {t('roleAgentDesc')}
              </div>
              <div className="p-2 border border-emerald-200 rounded-md">
                <span className="font-medium">{t('roleAdmin')}:</span> {t('roleAdminDesc')}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              {t('adminGoUserManagement')}
            </Button>
          </div>
        </TabsContent>        <TabsContent value="configuration" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('adminConfigurationAdmin')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={Settings} 
              title={t('adminSystemConfig')} 
              description={t('adminSystemConfigDesc')} 
            />
            <FeatureCard 
              icon={Lightbulb} 
              title={t('adminSuggestionManagement')}
              description={t('adminSuggestionManagementDesc')}
            />
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('adminTasks')}</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>{t('adminMonitorSuggestions')}</strong> {t('adminMonitorSuggestionsDesc')}</li>
              <li><strong>{t('adminManageRoles')}</strong> {t('adminManageRolesDesc')}</li>
              <li><strong>{t('adminReviewStats')}</strong> {t('adminReviewStatsDesc')}</li>
              <li><strong>{t('adminSetPriorities')}</strong> {t('adminSetPrioritiesDesc')}</li>
            </ol>
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              variant="outline"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              {t('adminProfileConfig')}
            </Button>
            <Button 
              onClick={() => navigate('/admin/suggestions')}
              className="flex items-center gap-2"
            >
              {t('adminManageSuggestions')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>      <div className="mt-12 p-5 border rounded-lg bg-card">
        <h3 className="text-xl font-medium mb-2">{t('adminNeedMoreInfo')}</h3>
        <p className="mb-4">{t('adminNeedMoreInfoDesc')}</p>
        <div className="flex justify-start">
          <a href="mailto:admin@fixit-app.com" className="text-primary hover:underline">
            admin@fixit-app.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminHowItWorks;
