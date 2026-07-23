import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface LegalPageProps {
  type: "privacy" | "terms";
}

export function LegalPage({ type }: LegalPageProps) {
  const { theme, setTheme } = useTheme();
  
  const title = type === "privacy" ? "Privacy Policy" : "Terms of Service";
  
  const content = type === "privacy" ? (
    <div className="space-y-6 text-lg leading-relaxed">
      <p>
        At BoardTalk, we take your privacy seriously. This document outlines how we collect, use, and protect your personal information when you use our services.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">1. Information Collection</h3>
      <p>
        We collect information you provide directly to us when you create an account, such as your name and email address. We also automatically collect some technical data regarding your interactions with our canvas.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">2. Data Usage</h3>
      <p>
        The data we collect is solely used to provide and improve the BoardTalk experience, including real-time collaboration features and AI assistance. We do not sell your personal data to third parties.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">3. Security</h3>
      <p>
        We implement industry-standard security measures to protect your data. Your whiteboard sessions and communications are secured in transit and at rest.
      </p>
      <p className="pt-4 text-black/60 dark:text-white/60 text-sm">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  ) : (
    <div className="space-y-6 text-lg leading-relaxed">
      <p>
        Welcome to BoardTalk. By using our website and services, you agree to comply with and be bound by the following terms and conditions of use.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
      <p>
        By accessing BoardTalk, you accept these Terms of Service in full. If you disagree with these terms or any part of these terms, you must not use our application.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">2. User Conduct</h3>
      <p>
        You agree to use our platform responsibly. You must not use BoardTalk in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the service.
      </p>
      <h3 className="text-xl font-bold mt-8 mb-4">3. Intellectual Property</h3>
      <p>
        The visual designs, features, and source code of BoardTalk are protected by intellectual property laws. Content created by users on the canvas remains the property of the respective creators.
      </p>
      <p className="pt-4 text-black/60 dark:text-white/60 text-sm">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#121212] text-black dark:text-white font-sans transition-colors duration-300">
      <header className="border-b-[3px] border-black/5 dark:border-white/5 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-md">
              <Sparkles className="text-white dark:text-black h-5 w-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">BoardTalk</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 md:py-24 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold mb-12 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
          {title}
        </h1>
        <div className="prose dark:prose-invert max-w-none text-black/80 dark:text-white/80">
          {content}
        </div>
      </main>
      
      <footer className="border-t-[3px] border-black/5 dark:border-white/5 py-12 text-center mt-12">
        <p className="text-black/40 dark:text-white/40 font-bold">
          © {new Date().getFullYear()} BoardTalk Inc.
        </p>
      </footer>
    </div>
  );
}
