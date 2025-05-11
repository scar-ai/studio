import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  dataAiHint?: string;
}

export default function FeatureCard({ icon: Icon, title, description, imageSrc, imageAlt, dataAiHint }: FeatureCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full bg-card">
      <CardHeader className="bg-primary/10">
        <div className="flex items-center space-x-3">
          <Icon className="h-8 w-8 text-accent" />
          <CardTitle className="text-2xl font-semibold text-card-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col">
        <CardDescription className="text-base text-muted-foreground leading-relaxed mb-4">
          {description}
        </CardDescription>
        {imageSrc && (
          <div className="mt-auto aspect-video w-full overflow-hidden rounded-md border relative">
            <Image
              data-ai-hint={dataAiHint}
              src={imageSrc}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
