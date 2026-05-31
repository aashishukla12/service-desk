"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiLogIn } from "react-icons/fi";
import styles from "./SignIn.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    if (!password) next.password = "Password is required.";
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerMessage("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setServerMessage(result?.error || "Invalid email or password.");
        return;
      }

      router.push("/tickets/new");
    } catch {
      setServerMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="sign-in-title">
      <div className={styles.header}>
        <FiLogIn aria-hidden="true" />
        <div>
          <h1 id="sign-in-title">Sign In</h1>
          <p>Enter your credentials to access the service desk portal.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span>Email</span>
          <input
            id="sign-in-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
              setServerMessage("");
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@company.com"
          />
          {errors.email && (
            <strong id="email-error" className={styles.error}>
              {errors.email}
            </strong>
          )}
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            id="sign-in-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
              setServerMessage("");
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="••••••••"
          />
          {errors.password && (
            <strong id="password-error" className={styles.error}>
              {errors.password}
            </strong>
          )}
        </label>

        {serverMessage && <div className={styles.alert}>{serverMessage}</div>}

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          <FiLogIn aria-hidden="true" />
          {isSubmitting ? "Signing In…" : "Sign In"}
        </button>

        <div className={styles.links}>
          Don&apos;t have an account? Contact your administrator.
        </div>
      </form>
    </section>
  );
}
