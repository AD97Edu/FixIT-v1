import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  FileText, 
  User, 
  Globe, 
  Moon, 
  Sun, 
  MessageSquare, 
  CheckCircle2, 
  MoveRight,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">{t('howItWorks')}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('howItWorksIntro')}
      </p>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="create">{t('createTickets')}</TabsTrigger>
          <TabsTrigger value="manage">{t('manageTickets')}</TabsTrigger>
          <TabsTrigger value="customize">{t('customizeExperience')}</TabsTrigger>
          <TabsTrigger value="suggestions">{t('sendFeedback')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('reportingIssues')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={FileText} 
              title={t('createNewTicket')} 
              description={t('createTicketDesc')} 
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title={t('fillDetails')}
              description={t('fillDetailsDesc')}
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('importantTips')}</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('tipBeSpecific')}</li>
              <li>{t('tipIncludeScreenshots')}</li>
              <li>{t('tipProvideSteps')}</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-primary cursor-pointer">
              <span>{t('learnMoreTickets')}</span>
              <MoveRight size={16} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('managingTickets')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={FileText} 
              title={t('checkTicketStatus')} 
              description={t('checkStatusDesc')} 
            />
            <FeatureCard 
              icon={MessageSquare} 
              title={t('respondToComments')}
              description={t('respondCommentsDesc')}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('statusExplanation')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span><strong>{t('status_open')}:</strong> {t('statusOpenDesc')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span><strong>{t('status_in_progress')}:</strong> {t('statusInProgressDesc')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span><strong>{t('status_resolved')}:</strong> {t('statusResolvedDesc')}</span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="customize" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('personalizeApp')}</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <FeatureCard 
              icon={User} 
              title={t('profile')} 
              description={t('profileDesc')} 
            />
            <FeatureCard 
              icon={Globe} 
              title={t('language')}
              description={t('languageDesc')}
            />
            <FeatureCard 
              icon={Moon} 
              title={t('darkMode')}
              description={t('darkModeDesc')}
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('personalSettings')}</h3>
            <p>{t('personalSettingsDesc')}</p>
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4 pt-4">
          <h2 className="text-2xl font-semibold mb-4">{t('suggestionsAndFeedback')}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FeatureCard 
              icon={Lightbulb} 
              title={t('suggestImprovements')} 
              description={t('suggestImprovementsDesc')} 
            />
            <FeatureCard 
              icon={MessageSquare} 
              title={t('contactTechnical')}
              description={t('contactTechnicalDesc')}
            />
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">{t('howToSendSuggestions')}</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>{t('suggestionStep1')}</li>
              <li>{t('suggestionStep2')}</li>
              <li>{t('suggestionStep3')}</li>
              <li>{t('suggestionStep4')}</li>
            </ol>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-primary cursor-pointer">
              <span>{t('viewFeedbackGuidelines')}</span>
              <MoveRight size={16} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-12 p-5 border rounded-lg bg-card">
        <h3 className="text-xl font-medium mb-2">{t('needMoreHelp')}</h3>
        <p className="mb-4">{t('contactSupport')}</p>
        <div className="flex justify-start">
          <a href="mailto:support@fixit-app.com" className="text-primary hover:underline">
            support@fixit-app.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
