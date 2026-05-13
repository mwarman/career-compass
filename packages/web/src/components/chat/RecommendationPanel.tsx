import { Recommendation } from '@career-compass/shared';
import { JSX } from 'react';

import { Badge } from '@/components/shadcn/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';

/**
 * Props for the RecommendationPanel component.
 */
export interface RecommendationPanelProps {
  /** The recommendation object to render */
  recommendation: Recommendation;
}

/**
 * Maps severity level to badge variant.
 */
const severityToBadgeVariant = (severity: 'low' | 'medium' | 'high'): 'default' | 'warning' | 'destructive' => {
  switch (severity) {
    case 'low':
      return 'default';
    case 'medium':
      return 'warning';
    case 'high':
      return 'destructive';
  }
};

/**
 * RecommendationPanel component renders the complete recommendation output
 * from the synthesis phase in a structured, readable layout.
 */
export const RecommendationPanel = ({ recommendation }: RecommendationPanelProps): JSX.Element => {
  return (
    <div className="border-primary/20 bg-primary/5 mx-auto w-full max-w-2xl space-y-8 rounded-lg border-2 p-6">
      {/* Profile Summary Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Professional Profile Summary</h2>
        <Separator className="bg-primary/10" />
        <p className="text-foreground/90 leading-relaxed">{recommendation.profileSummary}</p>
      </section>

      {/* Skill Gaps Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Identified Skill Gaps</h2>
        <Separator className="bg-primary/10" />
        <div className="grid gap-4">
          {recommendation.skillGaps.map((gap, index) => (
            <Card key={index} className="border-border rounded-lg shadow-none">
              <CardHeader className="mb-2 flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{gap.name}</CardTitle>
                <Badge variant={severityToBadgeVariant(gap.severity)} className="capitalize">
                  {gap.severity}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{gap.rationale}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Recommended Learning Areas</h2>
        <Separator className="bg-primary/10" />
        <div className="grid gap-4">
          {recommendation.recommendations.map((rec, index) => (
            <Card key={index} className="border-border rounded-lg shadow-none">
              <CardHeader className="mb-2">
                <CardTitle className="text-base">{rec.area}</CardTitle>
                <CardDescription>{rec.rationale}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resource Categories */}
                <div>
                  <p className="text-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Resource Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rec.resourceCategories.map((category, catIndex) => (
                      <Badge key={catIndex} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Effort and Timeline Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-foreground text-xs font-semibold tracking-wide uppercase">Estimated Effort</p>
                    <p className="text-foreground/80 text-sm capitalize">{rec.estimatedEffort}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground text-xs font-semibold tracking-wide uppercase">Timeline</p>
                    <p className="text-foreground/80 text-sm">{rec.estimatedTimeline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
