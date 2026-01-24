import { Logo } from "@/components/ui/Logo";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size={48} showText={false} />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your ContextMemory account
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
