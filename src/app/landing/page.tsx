import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import CtaButton from '@/components/landing/CtaButton';
import FeatureCard from '@/components/landing/FeatureCard';
import { Sparkles, CheckCircle, GraduationCap, Camera, FileText, Type, HelpCircle, Layers3, Target, Rocket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Helper for section styling
const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={`py-16 md:py-24 ${className || ''}`}>
    <div className="container mx-auto px-4 md:px-8 max-w-6xl">
      {children}
    </div>
  </section>
);

const features = [
  {
    icon: Camera,
    title: "Image-to-Flashcard",
    description: "Snapped a photo of your notes or whiteboard? Upload it. Cardify reads the content, extracts the key ideas, and builds flashcards — instantly.",
    imageSrc: "https://picsum.photos/seed/imagefeature/600/338",
    dataAiHint: "notes photo"
  },
  {
    icon: FileText,
    title: "PDF-to-Flashcard",
    description: "Drop in that 50-page handout or textbook chapter. Cardify pulls out only what matters and turns it into digestible flashcards you’ll actually remember.",
    imageSrc: "https://picsum.photos/seed/pdffeature/600/338",
    dataAiHint: "document pdf"
  },
  {
    icon: Type,
    title: "Text-to-Flashcard",
    description: "Paste in lecture summaries or study notes — Cardify creates custom Q&As so you can review on your terms, anytime, anywhere.",
    imageSrc: "https://picsum.photos/seed/textfeature/600/338",
    dataAiHint: "text editor"
  },
  {
    icon: HelpCircle,
    title: "Ask Anything About Your Material",
    description: "Confused by a concept? Ask Cardify directly. It understands your uploaded lessons and gives clear, accurate answers — like a study buddy who actually knows their stuff.",
    imageSrc: "https://picsum.photos/seed/qafeature/600/338",
    dataAiHint: "question answer"
  },
  {
    icon: Layers3,
    title: "Study Mode That Works",
    description: "Practice with flashcards tailored to your content. Mark what you’ve mastered, focus on what you haven’t, and track your progress with zero stress.",
    imageSrc: "https://picsum.photos/seed/studymode/600/338",
    dataAiHint: "flashcards study"
  }
];

const whyLovePoints = [
  "Cuts study time in half",
  "Answers your questions instantly",
  "Works with photos, PDFs, and notes",
  "Clean, distraction-free interface",
  "Helps you remember more, faster"
];

const builtForStudentsBullets = [
  "No more re-reading entire chapters",
  "No more copying questions by hand",
  "Just smarter studying in less time"
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <SectionWrapper className="bg-gradient-to-b from-primary/20 via-background to-background text-center pt-20 md:pt-28" id="hero">
          <GraduationCap className="mx-auto h-16 w-16 text-accent mb-6 animate-bounce" />
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-accent">Cardify</span> — The Fastest Way to Turn Your Study Material into Flashcards
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
            We’ve all crammed the night before a test… and forgotten everything the next day.
            With Cardify, you actually remember what you study — faster, easier, and for longer.
          </p>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
            Cardify turns your notes, slides, and textbooks into <strong className="text-foreground font-semibold">smart flashcards</strong> and even <strong className="text-foreground font-semibold">answers questions</strong> about your lessons — so you never feel stuck again.
          </p>
          <div className="mt-10">
            <CtaButton href="/signup" size="lg" className="text-lg px-8 py-3">
              Try Cardify Free
            </CtaButton>
          </div>
        </SectionWrapper>

        {/* Features Section */}
        <SectionWrapper id="features">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How Cardify Supercharges Your Learning</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              From messy notes to focused study sessions, effortlessly.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard 
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                imageSrc={feature.imageSrc}
                dataAiHint={feature.dataAiHint}
              />
            ))}
          </div>
        </SectionWrapper>
        
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <Separator className="my-12 md:my-16" />
        </div>


        {/* Built for Students Section */}
        <SectionWrapper id="built-for-students" className="bg-secondary/20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Target className="h-12 w-12 text-accent mb-4" />
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">🎯 Built for Students Like You</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether it’s a quiz tomorrow or finals next week, Cardify keeps you organized, focused, and ahead of the curve.
              </p>
              <div className="mt-8 space-y-4">
                {builtForStudentsBullets.map((bullet, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Sparkles className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                    <p className="text-md text-foreground">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 md:mt-0">
              <img 
                src="https://picsum.photos/seed/students/600/400" 
                alt="Students studying" 
                data-ai-hint="students studying"
                className="rounded-xl shadow-2xl object-cover w-full h-auto" 
              />
            </div>
          </div>
        </SectionWrapper>

        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <Separator className="my-12 md:my-16" />
        </div>

        {/* Why Students Love Cardify Section */}
        <SectionWrapper id="why-love-cardify">
          <div className="text-center">
            <Rocket className="mx-auto h-12 w-12 text-accent mb-4" />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">🚀 Why Students Love Cardify</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyLovePoints.map((point, index) => (
              <div key={index} className="flex items-center space-x-4 p-6 bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                <p className="text-lg font-medium text-card-foreground">{point}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
            <Separator className="my-12 md:my-16" />
        </div>

        {/* Final CTA Section */}
        <SectionWrapper className="bg-gradient-to-t from-primary/20 via-background to-background text-center" id="final-cta">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">👇 Start for Free</h2>
          <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
            Upload your notes. Ask questions. Ace the test. <strong className="text-foreground font-semibold">Cardify makes it that easy.</strong>
          </p>
          <div className="mt-10">
            <CtaButton href="/signup" size="lg" className="text-lg px-10 py-4">
               Try Cardify Free
            </CtaButton>
          </div>
        </SectionWrapper>
      </main>
      <LandingFooter />
    </div>
  );
}

