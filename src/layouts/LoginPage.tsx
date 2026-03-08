import { LoginBranding } from "../components/LoginBranding";
import { LoginForm } from "../components/LoginForm";

type LoginPageProps = {
  platformName: string;
  onLogin: (credentials: { email: string; password: string }) => Promise<boolean>;
  onCreateRestaurant?: () => void;
};

export function LoginPage({ platformName, onLogin, onCreateRestaurant }: LoginPageProps) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <LoginBranding platformName={platformName} />
        <LoginForm onSubmit={onLogin} onCreateRestaurant={onCreateRestaurant} />
      </div>
    </main>
  );
}
