"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Hexagon,
  ArrowRight,
  Workflow,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { write } from "@/services/api";
import { Button } from "@/components/ui/button";
const schema = z.object({ email: z.email(), password: z.string().min(8) });
export default function Login() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@example.com", password: "DemoPass123!" },
  });
  async function submit(values: z.infer<typeof schema>) {
    try {
      const data = await write<{
        access_token: string;
        refresh_token: string;
      }>("/auth/login", values);
      sessionStorage.setItem("access", data.access_token);
      sessionStorage.setItem("refresh", data.refresh_token);
      router.push("/");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Hexagon />
          </span>
          AgentCore <span className="brand-ai">AI</span>
        </div>
        <div className="login-copy">
          <div className="eyebrow">THE INTELLIGENCE TO MOVE FORWARD</div>
          <h1>
            Build intelligent
            <br />
            <em>automation</em>
            <br />
            with AI agents.
          </h1>
          <p>
            Bring your agents, tools, and ideas together.
            <br />
            Build intelligent workflows that move work forward.
          </p>
          <ul className="auth-benefits">
            {[
              "Visual workflow orchestration",
              "Specialized agents and tools",
              "Real-time execution monitoring",
              "Human control at every step",
            ].map((text) => (
              <li key={text}>
                <CheckCircle2 size={15} />
                {text}
              </li>
            ))}
          </ul>
          <div className="ai-sculpture" aria-hidden="true">
            <div className="sculpture-orbit a" />
            <div className="sculpture-orbit b" />
            <div className="sculpture-cube">
              <Workflow size={54} />
            </div>
            <div className="sculpture-satellite one">
              <Sparkles size={25} />
            </div>
            <div className="sculpture-satellite two">
              <ShieldCheck size={25} />
            </div>
            <span className="sculpture-caption">
              CONNECTED INTELLIGENCE / AGENTCORE AI
            </span>
          </div>
        </div>
        <small>Intelligent orchestration. Designed around you.</small>
      </section>
      <section className="login-form">
        <div className="eyebrow">YOUR WORKSPACE AWAITS</div>
        <h2>Welcome back.</h2>
        <p>Sign in to your AgentCore workspace.</p>
        <form onSubmit={handleSubmit(submit)}>
          <label>
            Email address
            <input autoComplete="username" {...register("email")} />
          </label>
          {errors.email && (
            <small className="error">Enter a valid email address.</small>
          )}
          <label>
            Password
            <span className="password-field">
              <input
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {errors.password && (
            <small className="error">Use at least 8 characters.</small>
          )}
          <Button disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Enter workspace"}
            <ArrowRight size={17} />
          </Button>
        </form>
        <div className="demo-note">
          <span className="badge">DEMO WORKSPACE</span>
          <p>
            Explore with admin@example.com
            <br />
            Password: DemoPass123!
          </p>
          <small>
            Also available: builder@example.com and viewer@example.com
          </small>
        </div>
      </section>
    </div>
  );
}
