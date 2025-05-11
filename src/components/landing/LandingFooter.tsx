export default function LandingFooter() {
  return (
    <footer className="border-t border-border/40 py-8 bg-background">
      <div className="container mx-auto px-4 md:px-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cardify. All rights reserved.</p>
        <p className="mt-1">AI Powered Learning, Made Simple.</p>
      </div>
    </footer>
  );
}
